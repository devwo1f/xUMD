import { HttpError } from './errors.ts';

export interface SocialRuntimeEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  openAiApiKey?: string;
  anthropicApiKey?: string;
  googleCloudVisionApiKey?: string;
  resendApiKey?: string;
  upstashRedisRestUrl?: string;
  upstashRedisRestToken?: string;
  meiliSearchHost?: string;
  meiliSearchApiKey?: string;
}

function readEnv(name: string) {
  return Deno.env.get(name)?.trim();
}

export function getEnv(): SocialRuntimeEnv {
  const supabaseUrl = readEnv('SUPABASE_URL');
  const supabaseAnonKey = readEnv('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new HttpError(
      500,
      'internal_error',
      'Missing required Supabase environment variables.',
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    openAiApiKey: readEnv('OPENAI_API_KEY'),
    anthropicApiKey: readEnv('ANTHROPIC_API_KEY'),
    googleCloudVisionApiKey: readEnv('GOOGLE_CLOUD_VISION_API_KEY'),
    resendApiKey: readEnv('RESEND_API_KEY'),
    upstashRedisRestUrl: readEnv('UPSTASH_REDIS_REST_URL'),
    upstashRedisRestToken: readEnv('UPSTASH_REDIS_REST_TOKEN'),
    meiliSearchHost: readEnv('MEILISEARCH_HOST'),
    meiliSearchApiKey: readEnv('MEILISEARCH_API_KEY'),
  };
}


