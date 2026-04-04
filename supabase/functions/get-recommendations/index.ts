import { handleOptions, parseJsonBody, jsonResponse, errorResponse } from '../_shared/http.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';
import { fetchUsersByIds } from '../_shared/records.ts';
import { getRedis } from '../_shared/upstash.ts';
import { RECOMMENDATIONS_CACHE_TTL_SECONDS } from '../_shared/feed.ts';
import type { GetRecommendationsRequest } from '../_shared/types.ts';

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const body = request.method === 'POST' ? await parseJsonBody<GetRecommendationsRequest>(request) : {};
    const limit = Math.min(Math.max(body.limit ?? 10, 1), 20);
    const redis = getRedis();

    const cached = redis ? await redis.getJson<Array<{ recommendedUserId: string; score: number; reason: string }>>(`recs:${userId}`) : null;
    let rows = cached;

    if (!rows || rows.length === 0) {
      const { data, error } = await adminClient
        .from('people_recommendations')
        .select('recommended_user_id, score, reason')
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      rows = (data ?? []).map((row: { recommended_user_id: string; score: number; reason: string }) => ({
        recommendedUserId: row.recommended_user_id,
        score: row.score,
        reason: row.reason,
      }));

      if (redis && rows.length > 0) {
        await redis.setJson(`recs:${userId}`, rows, RECOMMENDATIONS_CACHE_TTL_SECONDS);
      }
    }

    const usersById = await fetchUsersByIds(adminClient, rows.map((row) => row.recommendedUserId));
    const items = rows
      .map((row) => ({
        recommendedUserId: row.recommendedUserId,
        score: row.score,
        reason: row.reason,
        profile: usersById.get(row.recommendedUserId) ?? null,
      }))
      .filter((row) => row.profile)
      .slice(0, limit);

    return jsonResponse({ items });
  } catch (error) {
    return errorResponse(error);
  }
});