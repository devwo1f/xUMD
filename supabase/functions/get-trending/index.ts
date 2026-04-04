import { handleOptions, jsonResponse, errorResponse } from '../_shared/http.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';
import { fetchPostsByIds } from '../_shared/records.ts';
import { getRedis } from '../_shared/upstash.ts';

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    await requireAuthenticatedUser(request);
    const adminClient = (await requireAuthenticatedUser(request)).adminClient;
    const redis = getRedis();

    const redisPairs = redis ? await redis.zrevrangeWithScores('trending:posts', 0, 19) : [];
    const redisHashtags = redis ? await redis.getJson<Array<{ tag: string; score: number }>>('trending:hashtags') : null;

    let posts = [];
    if (redisPairs.length > 0) {
      const metadata = Object.fromEntries(
        redisPairs.map((entry) => [
          entry.member,
          {
            score: entry.score,
            suggested: true,
            suggestedReason: 'Trending across campus',
          },
        ]),
      );
      posts = await fetchPostsByIds(adminClient, redisPairs.map((entry) => entry.member), metadata);
    } else {
      const { data, error } = await adminClient
        .from('posts')
        .select('id, like_count, comment_count, share_count')
        .eq('moderation_status', 'approved')
        .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      const metadata = Object.fromEntries(
        (data ?? []).map((row: { id: string; like_count: number; comment_count: number; share_count: number }) => [
          row.id,
          {
            score: row.like_count + row.comment_count * 2 + row.share_count * 3,
            suggested: true,
            suggestedReason: 'Trending across campus',
          },
        ]),
      );
      posts = await fetchPostsByIds(adminClient, (data ?? []).map((row: { id: string }) => row.id), metadata);
    }

    return jsonResponse({
      posts,
      hashtags: redisHashtags ?? [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
});
