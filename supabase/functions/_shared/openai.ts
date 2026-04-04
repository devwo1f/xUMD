import { getEnv } from './env.ts';
import { HttpError } from './errors.ts';
import { withRetry } from './retry.ts';

async function callOpenAi<T>(path: string, body: unknown): Promise<T> {
  const env = getEnv();
  if (!env.openAiApiKey) {
    throw new HttpError(500, 'internal_error', 'OPENAI_API_KEY is not configured.');
  }

  return withRetry(async () => {
    const response = await fetch(`https://api.openai.com/v1/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new HttpError(response.status, 'upstream_error', 'OpenAI request failed.', payload);
    }

    return payload as T;
  });
}

export async function moderateText(input: string) {
  if (!input.trim()) {
    return {
      flagged: false,
      categories: {},
    };
  }

  const payload = await callOpenAi<{
    results: Array<{
      flagged: boolean;
      categories: Record<string, boolean>;
    }>;
  }>('moderations', {
    model: 'omni-moderation-latest',
    input,
  });

  return payload.results[0] ?? { flagged: false, categories: {} };
}

export async function embedText(input: string) {
  if (!input.trim()) {
    return null;
  }

  const payload = await callOpenAi<{
    data: Array<{ embedding: number[] }>;
  }>('embeddings', {
    model: 'text-embedding-3-small',
    input,
  });

  return payload.data[0]?.embedding ?? null;
}