import { handleOptions, parseJsonBody, jsonResponse, errorResponse } from '../_shared/http.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';
import { fetchPostsByIds } from '../_shared/records.ts';
import { decodeCursor, paginateItems, FEED_CACHE_TTL_SECONDS, SEEN_POSTS_TTL_SECONDS } from '../_shared/feed.ts';
import { getRedis } from '../_shared/upstash.ts';
import type { FeedItem, GetFeedRequest } from '../_shared/types.ts';

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const body = request.method === 'POST' ? await parseJsonBody<GetFeedRequest>(request) : {};
    const mode = body.mode ?? 'for_you';
    const limit = Math.min(Math.max(body.limit ?? 20, 1), 50);
    const cursor = decodeCursor(body.cursor);
    const redis = getRedis();

    if (mode === 'following') {
      const { data: followedRows, error: followError } = await adminClient
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (followError) {
        throw followError;
      }

      const followedIds = (followedRows ?? []).map((row: { following_id: string }) => row.following_id);
      if (followedIds.length === 0) {
        return jsonResponse({ items: [], nextCursor: null, generatedAt: new Date().toISOString(), source: 'recomputed' });
      }

      const { data: posts, error } = await adminClient
        .from('posts')
        .select('id, created_at')
        .in('user_id', followedIds)
        .eq('moderation_status', 'approved')
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      const metadata = Object.fromEntries(
        (posts ?? []).map((post: { id: string; created_at: string }) => [
          post.id,
          {
            score: new Date(post.created_at).getTime(),
            suggested: false,
          },
        ]),
      );

      const items = await fetchPostsByIds(adminClient, (posts ?? []).map((post: { id: string }) => post.id), metadata);
      const page = paginateItems(items, cursor, limit);

      if (redis && page.items.length > 0) {
        await redis.sadd(`seen:${userId}`, ...page.items.map((item) => item.id));
        await redis.expire(`seen:${userId}`, SEEN_POSTS_TTL_SECONDS);
      }

      return jsonResponse({
        items: page.items,
        nextCursor: page.nextCursor,
        generatedAt: new Date().toISOString(),
        source: 'recomputed',
      });
    }

    if (mode === 'trending') {
      const redisPairs = redis ? await redis.zrevrangeWithScores('trending:posts', 0, 49) : [];
      const trendingIds = redisPairs.map((entry) => entry.member);
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

      let items: FeedItem[];
      if (trendingIds.length > 0) {
        items = await fetchPostsByIds(adminClient, trendingIds, metadata);
      } else {
        const { data: posts, error } = await adminClient
          .from('posts')
          .select('id, like_count, comment_count, share_count, created_at')
          .eq('moderation_status', 'approved')
          .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          throw error;
        }

        const fallbackMetadata = Object.fromEntries(
          (posts ?? []).map((post: { id: string; like_count: number; comment_count: number; share_count: number }) => [
            post.id,
            {
              score: post.like_count + post.comment_count * 2 + post.share_count * 3,
              suggested: true,
              suggestedReason: 'Trending across campus',
            },
          ]),
        );
        items = await fetchPostsByIds(adminClient, (posts ?? []).map((post: { id: string }) => post.id), fallbackMetadata);
      }

      const page = paginateItems(items, cursor, limit);
      return jsonResponse({
        items: page.items,
        nextCursor: page.nextCursor,
        generatedAt: new Date().toISOString(),
        source: redisPairs.length > 0 ? 'redis' : 'recomputed',
      });
    }

    const { data: followingRows, error: followingError } = await adminClient
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followingError) {
      throw followingError;
    }

    const followingIds = new Set((followingRows ?? []).map((row: { following_id: string }) => row.following_id));
    const redisMeta = redis ? await redis.getJson<Record<string, { score: number; suggested?: boolean; suggestedReason?: string | null; socialProofCount?: number; topicAffinity?: number }>>(`feedmeta:${userId}`) : null;

    let cacheRows: Array<{ post_id: string; score: number }> = [];
    if (!cursor && redisMeta) {
      cacheRows = Object.entries(redisMeta)
        .map(([postId, meta]) => ({ post_id: postId, score: meta.score }))
        .sort((left, right) => right.score - left.score);
    }

    if (cacheRows.length === 0) {
      const { data, error } = await adminClient
        .from('feed_cache')
        .select('post_id, score')
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      cacheRows = data ?? [];
    }

    if (cacheRows.length === 0) {
      const { data: recentPosts, error } = await adminClient
        .from('posts')
        .select('id, created_at')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) {
        throw error;
      }

      const fallbackMetadata = Object.fromEntries(
        (recentPosts ?? []).map((post: { id: string; created_at: string }) => [
          post.id,
          {
            score: new Date(post.created_at).getTime(),
            suggested: true,
            suggestedReason: 'Fresh on campus',
          },
        ]),
      );
      const items = await fetchPostsByIds(adminClient, (recentPosts ?? []).map((post: { id: string }) => post.id), fallbackMetadata);
      const page = paginateItems(items, cursor, limit);
      return jsonResponse({
        items: page.items,
        nextCursor: page.nextCursor,
        generatedAt: new Date().toISOString(),
        source: 'recomputed',
      });
    }

    const metadata = Object.fromEntries(
      cacheRows.map((row) => [
        row.post_id,
        {
          score: row.score,
          ...(redisMeta?.[row.post_id] ?? {}),
        },
      ]),
    );

    const items = await fetchPostsByIds(adminClient, cacheRows.map((row) => row.post_id), metadata);
    const normalizedItems = items.map((item) => ({
      ...item,
      suggested: redisMeta?.[item.id]?.suggested ?? !followingIds.has(item.userId),
      suggestedReason: redisMeta?.[item.id]?.suggestedReason ?? (!followingIds.has(item.userId) ? 'Suggested for you' : null),
    }));

    const page = paginateItems(normalizedItems, cursor, limit);

    if (redis && page.items.length > 0) {
      await redis.sadd(`seen:${userId}`, ...page.items.map((item) => item.id));
      await redis.expire(`seen:${userId}`, SEEN_POSTS_TTL_SECONDS);
      await redis.expire(`feed:${userId}`, FEED_CACHE_TTL_SECONDS);
      await redis.expire(`feedmeta:${userId}`, FEED_CACHE_TTL_SECONDS);
    }

    return jsonResponse({
      items: page.items,
      nextCursor: page.nextCursor,
      generatedAt: new Date().toISOString(),
      source: redisMeta && !cursor ? 'redis' : 'postgres',
    });
  } catch (error) {
    return errorResponse(error);
  }
});