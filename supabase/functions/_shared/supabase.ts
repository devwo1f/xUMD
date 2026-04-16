import { createClient, type SupabaseClient, type User as SupabaseAuthUser } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { getEnv } from './env.ts';
import { HttpError } from './errors.ts';
import { normalizeEmail, sanitizeUsername } from './auth.ts';

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

function buildFallbackUsername(authUser: SupabaseAuthUser) {
  const rawUsername =
    typeof authUser.user_metadata?.username === 'string'
      ? authUser.user_metadata.username
      : authUser.email?.split('@')[0] ?? 'terp';
  const cleaned = sanitizeUsername(rawUsername) || 'terp';
  const suffix = authUser.id.replace(/-/g, '').slice(0, 6).toLowerCase();
  return sanitizeUsername(`${cleaned}_${suffix}`) || `terp_${suffix}`;
}

function buildFallbackDisplayName(authUser: SupabaseAuthUser) {
  const metadataDisplayName =
    typeof authUser.user_metadata?.display_name === 'string'
      ? authUser.user_metadata.display_name.trim()
      : '';

  if (metadataDisplayName.length > 0) {
    return metadataDisplayName;
  }

  const emailPrefix = authUser.email?.split('@')[0] ?? 'terp';
  const derived = emailPrefix
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim();

  return derived || 'Terp';
}

async function resolveAvailableUsername(adminClient: SupabaseClient, authUser: SupabaseAuthUser) {
  const baseUsername = buildFallbackUsername(authUser);
  let candidateUsername = baseUsername;
  let suffix = 0;

  while (true) {
    const { data, error } = await adminClient
      .from('users')
      .select('id')
      .eq('username', candidateUsername)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data || data.id === authUser.id) {
      return candidateUsername;
    }

    suffix += 1;
    candidateUsername = sanitizeUsername(`${baseUsername}_${suffix}`) || `${baseUsername}${suffix}`;
  }
}

export async function ensurePublicUserRow(adminClient: SupabaseClient, authUser: SupabaseAuthUser) {
  const { data: existing, error: existingError } = await adminClient
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return;
  }

  const metadata = authUser.user_metadata ?? {};
  const username = await resolveAvailableUsername(adminClient, authUser);
  const graduationYear =
    typeof metadata.graduation_year === 'number'
      ? metadata.graduation_year
      : typeof metadata.graduation_year === 'string' && metadata.graduation_year.trim().length > 0
        ? Number(metadata.graduation_year)
        : null;

  const { error } = await adminClient.from('users').upsert(
    {
      id: authUser.id,
      email: normalizeEmail(authUser.email ?? 'student@umd.edu'),
      username,
      display_name: buildFallbackDisplayName(authUser),
      avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
      major: typeof metadata.major === 'string' ? metadata.major : null,
      graduation_year: Number.isFinite(graduationYear) ? graduationYear : null,
      degree_type: typeof metadata.degree_type === 'string' ? metadata.degree_type : null,
      minor: typeof metadata.minor === 'string' ? metadata.minor : null,
      bio: typeof metadata.bio === 'string' ? metadata.bio : null,
      pronouns: typeof metadata.pronouns === 'string' ? metadata.pronouns : null,
      clubs: [],
      courses: [],
      interests: [],
      follower_count: 0,
      following_count: 0,
      profile_completed: false,
      onboarding_step: 0,
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw error;
  }
}

export async function requireAuthenticatedUser(request: Request): Promise<{
  userId: string;
  authUser: SupabaseAuthUser;
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
    authUser: user,
    userClient,
    adminClient: createAdminClient(),
  };
}
