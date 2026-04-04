import { handleOptions, jsonResponse, errorResponse } from '../_shared/http.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { fetchUsersByIds } from '../_shared/records.ts';
import { getRedis } from '../_shared/upstash.ts';
import { RECOMMENDATIONS_CACHE_TTL_SECONDS } from '../_shared/feed.ts';

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  major: string | null;
  graduation_year: number | null;
  clubs: string[] | null;
  courses: string[] | null;
}

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

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
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

    const [usersResult, followsResult, overlapInteractionsResult, vectorsResult] = await Promise.all([
      adminClient
        .from('users')
        .select('id, username, display_name, major, graduation_year, clubs, courses'),
      adminClient.from('follows').select('follower_id, following_id'),
      adminClient
        .from('interactions')
        .select('user_id, target_id')
        .eq('target_type', 'post')
        .in('action_type', ['like', 'comment', 'share'])
        .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
      adminClient.from('user_interest_vectors').select('user_id, interest_vector'),
    ]);

    if (usersResult.error) throw usersResult.error;
    if (followsResult.error) throw followsResult.error;
    if (overlapInteractionsResult.error) throw overlapInteractionsResult.error;
    if (vectorsResult.error) throw vectorsResult.error;

    const users = (usersResult.data ?? []) as UserRow[];
    const usersById = new Map(users.map((user) => [user.id, user]));

    const followingByUser = new Map<string, Set<string>>();
    for (const row of followsResult.data ?? []) {
      const current = followingByUser.get(row.follower_id) ?? new Set<string>();
      current.add(row.following_id);
      followingByUser.set(row.follower_id, current);
    }

    const interactionsByPost = new Map<string, Set<string>>();
    const postsByUser = new Map<string, Set<string>>();
    for (const row of overlapInteractionsResult.data ?? []) {
      const postUsers = interactionsByPost.get(row.target_id) ?? new Set<string>();
      postUsers.add(row.user_id);
      interactionsByPost.set(row.target_id, postUsers);

      const userPosts = postsByUser.get(row.user_id) ?? new Set<string>();
      userPosts.add(row.target_id);
      postsByUser.set(row.user_id, userPosts);
    }

    const vectorsByUser = new Map(
      (vectorsResult.data ?? []).map((row: { user_id: string; interest_vector: unknown }) => [row.user_id, parseVector(row.interest_vector)]),
    );

    for (const user of users) {
      const following = followingByUser.get(user.id) ?? new Set<string>();
      const candidateIds = users
        .map((candidate) => candidate.id)
        .filter((candidateId) => candidateId !== user.id && !following.has(candidateId));

      const mutualCounts = new Map<string, number>();
      for (const followedId of following) {
        for (const candidateId of followingByUser.get(followedId) ?? new Set<string>()) {
          if (candidateId === user.id || following.has(candidateId)) {
            continue;
          }
          mutualCounts.set(candidateId, (mutualCounts.get(candidateId) ?? 0) + 1);
        }
      }

      const overlapCounts = new Map<string, number>();
      for (const postId of postsByUser.get(user.id) ?? new Set<string>()) {
        for (const candidateId of interactionsByPost.get(postId) ?? new Set<string>()) {
          if (candidateId === user.id || following.has(candidateId)) {
            continue;
          }
          overlapCounts.set(candidateId, (overlapCounts.get(candidateId) ?? 0) + 1);
        }
      }

      const maxMutualCount = Math.max(1, ...mutualCounts.values(), 1);
      const maxOverlapCount = Math.max(1, ...overlapCounts.values(), 1);
      const userVector = vectorsByUser.get(user.id) ?? [];

      const scored = candidateIds
        .map((candidateId) => {
          const candidate = usersById.get(candidateId);
          if (!candidate) {
            return null;
          }

          const sharedCourses = intersectionCount(user.courses ?? [], candidate.courses ?? []);
          const sharedClubs = intersectionCount(user.clubs ?? [], candidate.clubs ?? []);
          const attributeScore = Math.min(
            1,
            (user.major && candidate.major && user.major === candidate.major ? 0.4 : 0)
              + (user.graduation_year && candidate.graduation_year && user.graduation_year === candidate.graduation_year ? 0.2 : 0)
              + Math.min(sharedCourses * 0.15, 0.6)
              + Math.min(sharedClubs * 0.1, 0.4),
          );

          const mutualScore = (mutualCounts.get(candidateId) ?? 0) / maxMutualCount;
          const overlapScore = (overlapCounts.get(candidateId) ?? 0) / maxOverlapCount;
          const vectorScore = cosineSimilarity(userVector, vectorsByUser.get(candidateId) ?? []);

          const score = mutualScore * 0.35
            + attributeScore * 0.25
            + overlapScore * 0.2
            + vectorScore * 0.2;

          const strongest = [
            { key: 'mutual', value: mutualScore * 0.35 },
            { key: 'attributes', value: attributeScore * 0.25 },
            { key: 'overlap', value: overlapScore * 0.2 },
            { key: 'vector', value: vectorScore * 0.2 },
          ].sort((left, right) => right.value - left.value)[0]?.key;

          let reason = 'Similar interests';
          if (strongest === 'mutual' && (mutualCounts.get(candidateId) ?? 0) > 0) {
            reason = `${mutualCounts.get(candidateId)} mutual follow${mutualCounts.get(candidateId) === 1 ? '' : 's'}`;
          } else if (strongest === 'attributes') {
            if (user.major && candidate.major && user.major === candidate.major) {
              reason = `Also studying ${candidate.major}`;
            } else if (sharedCourses > 0) {
              const course = (user.courses ?? []).find((entry) => (candidate.courses ?? []).includes(entry));
              reason = course ? `In ${course} with you` : 'Shared classes this semester';
            } else if (sharedClubs > 0) {
              reason = 'Shared club circles';
            }
          } else if (strongest === 'overlap' && (overlapCounts.get(candidateId) ?? 0) > 0) {
            reason = `${overlapCounts.get(candidateId)} overlapping conversations`;
          }

          return {
            user_id: user.id,
            recommended_user_id: candidateId,
            score,
            reason,
            computed_at: new Date().toISOString(),
          };
        })
        .filter((value): value is { user_id: string; recommended_user_id: string; score: number; reason: string; computed_at: string } => Boolean(value))
        .sort((left, right) => right.score - left.score)
        .slice(0, 20);

      await adminClient.from('people_recommendations').delete().eq('user_id', user.id);
      if (scored.length > 0) {
        await adminClient.from('people_recommendations').insert(scored);
      }

      if (redis) {
        await redis.setJson(
          `recs:${user.id}`,
          scored.map((entry) => ({
            recommendedUserId: entry.recommended_user_id,
            score: entry.score,
            reason: entry.reason,
          })),
          RECOMMENDATIONS_CACHE_TTL_SECONDS,
        );
      }
    }

    return jsonResponse({
      updatedAt: new Date().toISOString(),
      userCount: users.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
});