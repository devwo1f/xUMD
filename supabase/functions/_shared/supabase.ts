import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { getEnv } from './env.ts';
import { HttpError } from './errors.ts';

export function createAdminClient() {
  const env = getEnv();

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createUserClient(authHeader?: string) {
  const env = getEnv();

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: authHeader
      ? {
          headers: {
            Authorization: authHeader,
          },
        }
      : undefined,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireAuthenticatedUser(request: Request): Promise<{
  userId: string;
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
}> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new HttpError(401, 'unauthorized', 'Missing authorization header.');
  }

  const userClient = createUserClient(authHeader);
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new HttpError(401, 'unauthorized', error?.message ?? 'Not authenticated.');
  }

  return {
    userId: user.id,
    userClient,
    adminClient: createAdminClient(),
  };
}