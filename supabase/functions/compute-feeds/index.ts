import { handleOptions, jsonResponse, errorResponse } from '../_shared/http.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { fetchApprovedClubIdsByUserIds, fetchPostsByIds } from '../_shared/records.ts';
import {
  calculateEngagementVelocity,
  calculateFinalFeedScore,
  calculateFreshness,
  calculateSharedContextBoost,
  composeFeedMix,
  FEED_CACHE_TTL_SECONDS,
  normalize,
} from '../_shared/feed.ts';
import { getRedis } from '../_shared/upstash.ts';

interface UserRow {
  id: string;
  major: string | null;
  clubs: string[] | null;
  courses: string[] | null;
}

interface PostRow {
  id: string;
  user_id: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
}

interface InteractionRow {
  user_id: string;
  target_id: string;
  target_type: 'post' | 'user';
  action_type: string;
  created_at: string;
}

function intersectionCount(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value)).length;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const adminClient = createAdminClient();
    const redis = getRedis();
    const now = Date.now();

    const [usersResult, followsResult, posts30Result, interactions30Result] = await Promise.all([
      adminClient.from('users').select('id, major, clubs, courses'),
      adminClient.from('follows').select('follower_id, following_id'),
      adminClient
        .from('posts')
        .select('id, user_id, created_at, like_count, comment_count, share_count')
        .eq('moderation_status', 'approved')
        .gte('created_at', new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()),
      adminClient
        .from('interactions')
        .select('user_id, target_id, target_type, action_type, created_at')
        .gte('created_at', new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    if (usersResult.error) throw usersResult.error;
    if (followsResult.error) throw followsResult.error;
    if (posts30Result.error) throw posts30Result.error;
    if (interactions30Result.error) throw interactions30Result.error;

    const rawUsers = (usersResult.data ?? []) as UserRow[];
    const clubIdsByUserId = await fetchApprovedClubIdsByUserIds(adminClient, rawUsers.map((user) => user.id));
    const users = rawUsers.map((user) => ({
      ...user,
      clubs: clubIdsByUserId.get(user.id) ?? [],
    })) as UserRow[];
    const usersById = new Map(users.map((user) => [user.id, user]));
    const followingByUser = new Map<string, Set<string>>();
    for (const row of followsResult.data ?? []) {
      const current = followingByUser.get(row.follower_id) ?? new Set<string>();
      current.add(row.following_id);
      followingByUser.set(row.follower_id, current);
    }

    const posts30 = (posts30Result.data ?? []) as PostRow[];
    const postsById = new Map(posts30.map((post) => [post.id, post]));
    const candidatePosts = posts30.filter((post) => new Date(post.created_at).getTime() >= now - 48 * 60 * 60 * 1000);

    const interactions30 = (interactions30Result.data ?? []) as InteractionRow[];
    const activeUserIds = new Set<string>();
    for (const post of posts30) {
      if (new Date(post.created_at).getTime() >= now - 7 * 24 * 60 * 60 * 1000) {
        activeUserIds.add(post.user_id);
      }
    }
    for (const interaction of interactions30) {
      if (new Date(interaction.created_at).getTime() >= now - 7 * 24 * 60 * 60 * 1000) {
        activeUserIds.add(interaction.user_id);
      }
    }

    const trendingSeed = candidatePosts
      .filter((post) => new Date(post.created_at).getTime() >= now - 6 * 60 * 60 * 1000)
      .map((post) => ({
        id: post.id,
        score: calculateEngagementVelocity({
          likes: post.like_count,
          comments: post.comment_count,
          shares: post.share_count,
          hoursSincePosted: Math.max(1 / 60, (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60)),
        }),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 20);

    for (const userId of activeUserIds) {
      const user = usersById.get(userId);
      if (!user) {
        continue;
      }

      const following = followingByUser.get(userId) ?? new Set<string>();
      const seenIds = redis ? new Set(await redis.smembers(`seen:${userId}`)) : new Set<string>();
      const candidateIds = new Set<string>();

      for (const post of candidatePosts) {
        if (following.has(post.user_id)) {
          candidateIds.add(post.id);
        }
      }

      for (const interaction of interactions30) {
        const interactionTime = new Date(interaction.created_at).getTime();
        if (
          interaction.target_type === 'post'
          && following.has(interaction.user_id)
          && ['like', 'comment', 'share'].includes(interaction.action_type)
          && interactionTime >= now - 24 * 60 * 60 * 1000
        ) {
          candidateIds.add(interaction.target_id);
        }
      }

      for (const trending of trendingSeed) {
        candidateIds.add(trending.id);
      }

      const { data: vectorMatches } = await adminClient.rpc('match_posts_by_interest', {
        p_user_id: userId,
        p_match_count: 20,
        p_window_hours: 48,
      });

      const topicAffinityByPostId = new Map(
        (vectorMatches ?? []).map((row: { post_id: string; topic_affinity: number }) => [row.post_id, Number(row.topic_affinity ?? 0)]),
      );
      for (const postId of topicAffinityByPostId.keys()) {
        candidateIds.add(postId);
      }

      for (const seenId of seenIds) {
        candidateIds.delete(seenId);
      }

      const authorAffinityRaw = new Map<string, number>();
      for (const interaction of interactions30) {
        if (interaction.user_id !== userId) {
          continue;
        }

        const daysAgo = Math.max(0, (now - new Date(interaction.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const decay = 0.95 ** daysAgo;

        if (interaction.target_type === 'post' && ['like', 'comment', 'share'].includes(interaction.action_type)) {
          const authorId = postsById.get(interaction.target_id)?.user_id;
          if (!authorId) {
            continue;
          }

          const actionWeight = interaction.action_type === 'like'
            ? 1
            : interaction.action_type === 'comment'
              ? 2
              : 2.5;
          authorAffinityRaw.set(authorId, (authorAffinityRaw.get(authorId) ?? 0) + actionWeight * decay);
        }

        if (interaction.target_type === 'user' && interaction.action_type === 'profile_visit') {
          authorAffinityRaw.set(interaction.target_id, (authorAffinityRaw.get(interaction.target_id) ?? 0) + 0.5 * decay);
        }
      }

      const candidatePostsRows = Array.from(candidateIds)
        .map((postId) => postsById.get(postId))
        .filter((value): value is PostRow => Boolean(value));

      const maxAffinity = Math.max(
        1,
        ...candidatePostsRows.map((post) => authorAffinityRaw.get(post.user_id) ?? 0),
        1,
      );
      const maxVelocity = Math.max(
        1,
        ...candidatePostsRows.map((post) => calculateEngagementVelocity({
          likes: post.like_count,
          comments: post.comment_count,
          shares: post.share_count,
          hoursSincePosted: Math.max(1 / 60, (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60)),
        })),
        1,
      );

      const socialProofCountByPostId = new Map<string, number>();
      for (const post of candidatePostsRows) {
        const engaged = new Set<string>();
        for (const interaction of interactions30) {
          if (
            interaction.target_type === 'post'
            && interaction.target_id === post.id
            && following.has(interaction.user_id)
            && ['like', 'comment', 'share'].includes(interaction.action_type)
            && new Date(interaction.created_at).getTime() >= now - 24 * 60 * 60 * 1000
          ) {
            engaged.add(interaction.user_id);
          }
        }
        socialProofCountByPostId.set(post.id, engaged.size);
      }

      const scoredCandidates = candidatePostsRows.map((post) => {
        const author = usersById.get(post.user_id);
        const hoursSincePosted = Math.max(1 / 60, (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60));
        const authorAffinity = normalize(authorAffinityRaw.get(post.user_id) ?? 0, maxAffinity);
        const freshness = calculateFreshness(hoursSincePosted);
        const engagementVelocity = normalize(
          calculateEngagementVelocity({
            likes: post.like_count,
            comments: post.comment_count,
            shares: post.share_count,
            hoursSincePosted,
          }),
          maxVelocity,
        );
        const socialProofCount = socialProofCountByPostId.get(post.id) ?? 0;
        const socialProof = Math.min(1, socialProofCount / 10);
        const topicAffinity = Math.max(0, Math.min(1, topicAffinityByPostId.get(post.id) ?? 0));
        const sharedContextBoost = author
          ? calculateSharedContextBoost({
              sameMajor: Boolean(user.major && author.major && user.major === author.major),
              sharedCourseCount: intersectionCount(user.courses ?? [], author.courses ?? []),
              sharedClubCount: intersectionCount(user.clubs ?? [], author.clubs ?? []),
            })
          : 0;

        const score = calculateFinalFeedScore({
          authorAffinity,
          freshness,
          engagementVelocity,
          socialProof,
          topicAffinity,
          sharedContextBoost,
        });

        return {
          postId: post.id,
          authorId: post.user_id,
          score,
          suggested: !following.has(post.user_id),
          suggestedReason: !following.has(post.user_id)
            ? socialProofCount > 0
              ? `${socialProofCount} people you follow engaged`
              : topicAffinity > 0.4
                ? 'Aligned with your interests'
                : 'Trending across campus'
            : null,
          socialProofCount,
          topicAffinity,
        };
      });

      const metadata = Object.fromEntries(
        scoredCandidates.map((candidate) => [
          candidate.postId,
          {
            score: candidate.score,
            suggested: candidate.suggested,
            suggestedReason: candidate.suggestedReason,
            socialProofCount: candidate.socialProofCount,
            topicAffinity: candidate.topicAffinity,
          },
        ]),
      );

      const followedIds = scoredCandidates
        .filter((candidate) => !candidate.suggested)
        .sort((left, right) => right.score - left.score)
        .map((candidate) => candidate.postId);
      const recommendedIds = scoredCandidates
        .filter((candidate) => candidate.suggested)
        .sort((left, right) => right.score - left.score)
        .map((candidate) => candidate.postId);

      const followedItems = await fetchPostsByIds(adminClient, followedIds, metadata);
      const recommendedItems = await fetchPostsByIds(adminClient, recommendedIds, metadata);
      const mixedFeed = composeFeedMix(followedItems, recommendedItems).slice(0, 200);

      await adminClient.from('feed_cache').delete().eq('user_id', userId);
      if (mixedFeed.length > 0) {
        await adminClient.from('feed_cache').insert(
          mixedFeed.map((item) => ({
            user_id: userId,
            post_id: item.id,
            score: item.score,
            computed_at: new Date().toISOString(),
          })),
        );
      }

      if (redis) {
        await redis.del(`feed:${userId}`);
        await redis.del(`feedmeta:${userId}`);
        if (mixedFeed.length > 0) {
          const top = mixedFeed.slice(0, 100);
          await redis.zadd(
            `feed:${userId}`,
            top.map((item) => ({ member: item.id, score: item.score })),
          );
          await redis.setJson(
            `feedmeta:${userId}`,
            Object.fromEntries(
              top.map((item) => [
                item.id,
                {
                  score: item.score,
                  suggested: item.suggested,
                  suggestedReason: item.suggestedReason,
                  socialProofCount: item.socialProofCount,
                  topicAffinity: item.topicAffinity,
                },
              ]),
            ),
            FEED_CACHE_TTL_SECONDS,
          );
          await redis.expire(`feed:${userId}`, FEED_CACHE_TTL_SECONDS);
        }
      }
    }

    return jsonResponse({
      updatedAt: new Date().toISOString(),
      userCount: activeUserIds.size,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
