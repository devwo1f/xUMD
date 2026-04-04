import { handleOptions, jsonResponse, errorResponse } from '../_shared/http.ts';
import { createAdminClient } from '../_shared/supabase.ts';

const ACTION_WEIGHTS: Record<string, number> = {
  like: 1,
  comment: 1.5,
  share: 2,
};

function parseVector(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => Number(entry));
  }

  if (typeof value === 'string') {
    return value
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => !Number.isNaN(entry));
  }

  return [] as number[];
}

function vectorToPg(value: number[]) {
  return `[${value.join(',')}]`;
}

function weightedAverage(vectors: Array<{ embedding: number[]; weight: number }>) {
  if (vectors.length === 0) {
    return null;
  }

  const dimension = vectors[0].embedding.length;
  const sum = new Array<number>(dimension).fill(0);
  let totalWeight = 0;

  for (const vector of vectors) {
    totalWeight += vector.weight;
    for (let index = 0; index < dimension; index += 1) {
      sum[index] += vector.embedding[index] * vector.weight;
    }
  }

  if (!totalWeight) {
    return null;
  }

  return sum.map((entry) => entry / totalWeight);
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const adminClient = createAdminClient();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: interactions, error: interactionsError } = await adminClient
      .from('interactions')
      .select('user_id, target_id, action_type, created_at')
      .eq('target_type', 'post')
      .in('action_type', ['like', 'comment', 'share'])
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (interactionsError) {
      throw interactionsError;
    }

    const byUser = new Map<string, Array<{ target_id: string; action_type: string; created_at: string }>>();
    const postIds = new Set<string>();
    for (const row of interactions ?? []) {
      postIds.add(row.target_id);
      const current = byUser.get(row.user_id) ?? [];
      current.push(row);
      byUser.set(row.user_id, current);
    }

    const { data: embeddings, error: embeddingsError } = await adminClient
      .from('post_embeddings')
      .select('post_id, embedding')
      .in('post_id', Array.from(postIds));

    if (embeddingsError) {
      throw embeddingsError;
    }

    const embeddingsByPostId = new Map(
      (embeddings ?? []).map((row: { post_id: string; embedding: unknown }) => [row.post_id, parseVector(row.embedding)]),
    );

    for (const [userId, rows] of byUser.entries()) {
      const vectors = rows
        .map((row) => {
          const embedding = embeddingsByPostId.get(row.target_id);
          if (!embedding || embedding.length === 0) {
            return null;
          }

          const daysAgo = Math.max(0, (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24));
          const recency = 0.95 ** daysAgo;
          const weight = (ACTION_WEIGHTS[row.action_type] ?? 0) * recency;
          return {
            embedding,
            weight,
          };
        })
        .filter((value): value is { embedding: number[]; weight: number } => Boolean(value));

      const averaged = weightedAverage(vectors);
      if (!averaged) {
        continue;
      }

      await adminClient.from('user_interest_vectors').upsert({
        user_id: userId,
        interest_vector: vectorToPg(averaged),
        last_computed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
    }

    return jsonResponse({
      updatedAt: new Date().toISOString(),
      userCount: byUser.size,
    });
  } catch (error) {
    return errorResponse(error);
  }
});