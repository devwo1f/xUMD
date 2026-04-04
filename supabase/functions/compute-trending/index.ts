import { handleOptions, jsonResponse, errorResponse } from '../_shared/http.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { calculateEngagementVelocity, TRENDING_CACHE_TTL_SECONDS } from '../_shared/feed.ts';
import { getRedis } from '../_shared/upstash.ts';

function extractTrendingHashtags(posts: Array<{ hashtags: string[] | null; created_at: string }>) {
  const scores = new Map<string, number>();

  for (const post of posts) {
    const hoursAgo = Math.max(0, (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60));
    const weight = 0.95 ** hoursAgo;

    for (const hashtag of post.hashtags ?? []) {
      const normalized = hashtag.trim().toLowerCase();
      if (!normalized) {
        continue;
      }

      scores.set(normalized, (scores.get(normalized) ?? 0) + weight);
    }
  }

  return Array.from(scores.entries())
    .map(([tag, score]) => ({ tag, score }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 20);
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const adminClient = createAdminClient();
    const redis = getRedis();

    const { data: posts, error } = await adminClient
      .from('posts')
      .select('id, like_count, comment_count, share_count, created_at, hashtags')
      .eq('moderation_status', 'approved')
      .gte('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const postRows = posts ?? [];
    const trendingPosts = postRows
      .filter((post) => new Date(post.created_at).getTime() >= Date.now() - 6 * 60 * 60 * 1000)
      .map((post) => {
        const hoursSincePosted = Math.max(1 / 60, (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60));
        return {
          postId: post.id,
          velocity: calculateEngagementVelocity({
            likes: post.like_count,
            comments: post.comment_count,
            shares: post.share_count,
            hoursSincePosted,
          }),
        };
      })
      .sort((left, right) => right.velocity - left.velocity)
      .slice(0, 50);

    const hashtags = extractTrendingHashtags(postRows);

    if (redis) {
      await redis.del('trending:posts');
      if (trendingPosts.length > 0) {
        await redis.zadd(
          'trending:posts',
          trendingPosts.map((entry) => ({ member: entry.postId, score: entry.velocity })),
        );
        await redis.expire('trending:posts', TRENDING_CACHE_TTL_SECONDS);
      }

      await redis.setJson('trending:hashtags', hashtags, TRENDING_CACHE_TTL_SECONDS);
    }

    return jsonResponse({
      updatedAt: new Date().toISOString(),
      postCount: trendingPosts.length,
      hashtagCount: hashtags.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
});