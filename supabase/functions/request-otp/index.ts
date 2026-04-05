import { getEnv } from '../_shared/env.ts';
import { validateUmdEmail } from '../_shared/auth.ts';
import { HttpError } from '../_shared/errors.ts';
import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { withRetry } from '../_shared/retry.ts';
import { getRedis } from '../_shared/upstash.ts';

interface RequestOtpBody {
  email: string;
}

interface AuthOtpResponse {
  code?: number;
  error_code?: string;
  msg?: string;
  message?: string;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    if (request.method !== 'POST') {
      throw new HttpError(405, 'bad_request', 'Method not allowed.');
    }

    const { email } = await parseJsonBody<RequestOtpBody>(request);
    const normalizedEmail = validateUmdEmail(email);
    const env = getEnv();
    const redis = getRedis();
    const rateLimitKey = `auth:otp:${normalizedEmail}`;
    let reservedCooldown = false;

    if (redis) {
      const reservation = await redis.command<string | null>('SET', rateLimitKey, '1', 'EX', 60, 'NX');
      if (!reservation) {
        throw new HttpError(429, 'rate_limited', 'Too many attempts. Please wait a minute and try again.');
      }
      reservedCooldown = true;
    }

    try {
      await withRetry(async () => {
        const response = await fetch(`${env.supabaseUrl}/auth/v1/otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: env.supabaseAnonKey,
            Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
          },
          body: JSON.stringify({
            email: normalizedEmail,
            create_user: true,
          }),
        });

        if (!response.ok) {
          let payload: AuthOtpResponse | null = null;
          try {
            payload = (await response.json()) as AuthOtpResponse;
          } catch {
            payload = null;
          }

          if (response.status === 429) {
            throw new HttpError(429, 'rate_limited', 'Too many attempts. Please wait a minute and try again.', payload);
          }

          const message = payload?.msg ?? payload?.message ?? 'Unable to send verification code.';
          throw new HttpError(
            response.status >= 500 ? 502 : 400,
            response.status >= 500 ? 'upstream_error' : 'bad_request',
            message,
            payload,
          );
        }
      });
    } catch (error) {
      if (redis && reservedCooldown) {
        const status = error instanceof HttpError ? error.status : 500;
        if (status !== 429) {
          await redis.del(rateLimitKey).catch(() => undefined);
        }
      }
      throw error;
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
