import { corsHeaders, withCorsHeaders } from './cors.ts';
import { HttpError, toErrorPayload } from './errors.ts';

export function handleOptions(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return null;
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, 'bad_request', 'Invalid JSON request body.');
  }
}

export function jsonResponse<T>(data: T, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: withCorsHeaders({
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    }),
  });
}

export function errorResponse(error: unknown) {
  const { status, body } = toErrorPayload(error);
  return jsonResponse(body, { status });
}