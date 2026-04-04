import type { FeedCursorToken, FeedItem } from './types.ts';

export const FEED_CACHE_TTL_SECONDS = 15 * 60;
export const COUNTS_CACHE_TTL_SECONDS = 5 * 60;
export const RECOMMENDATIONS_CACHE_TTL_SECONDS = 2 * 60 * 60;
export const TRENDING_CACHE_TTL_SECONDS = 10 * 60;
export const SEEN_POSTS_TTL_SECONDS = 48 * 60 * 60;

export function encodeCursor(cursor: FeedCursorToken) {
  return btoa(JSON.stringify(cursor));
}

export function decodeCursor(cursor?: string | null): FeedCursorToken | null {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(atob(cursor)) as FeedCursorToken;
    if (!parsed.postId || Number.isNaN(parsed.score)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function calculateFreshness(hoursSincePosted: number) {
  return 1 / (1 + hoursSincePosted * 0.1);
}

export function calculateEngagementVelocity(input: {
  likes: number;
  comments: number;
  shares: number;
  hoursSincePosted: number;
}) {
  const safeHours = Math.max(1, input.hoursSincePosted);
  return (input.likes + input.comments * 2 + input.shares * 3) / safeHours;
}

export function normalize(value: number, maxValue: number) {
  if (!maxValue || maxValue <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, value / maxValue));
}

export function calculateSharedContextBoost(input: {
  sameMajor: boolean;
  sharedCourseCount: number;
  sharedClubCount: number;
}) {
  let boost = 0;

  if (input.sameMajor) {
    boost += 0.05;
  }

  if (input.sharedCourseCount > 0) {
    boost += 0.05;
  }

  if (input.sharedClubCount > 0) {
    boost += 0.05;
  }

  return Math.min(0.15, boost);
}

export function calculateFinalFeedScore(input: {
  authorAffinity: number;
  freshness: number;
  engagementVelocity: number;
  socialProof: number;
  topicAffinity: number;
  sharedContextBoost: number;
}) {
  return input.authorAffinity * 0.25
    + input.freshness * 0.25
    + input.engagementVelocity * 0.2
    + input.socialProof * 0.1
    + input.topicAffinity * 0.1
    + input.sharedContextBoost * 0.1;
}

export function paginateItems<T extends { id: string; score: number }>(
  items: T[],
  cursor: FeedCursorToken | null,
  limit: number,
) {
  const startIndex = cursor
    ? items.findIndex((item) => item.id === cursor.postId && item.score === cursor.score) + 1
    : 0;
  const page = items.slice(Math.max(0, startIndex), Math.max(0, startIndex) + limit);
  const last = page.at(-1);

  return {
    items: page,
    nextCursor: last
      ? encodeCursor({
          score: last.score,
          postId: last.id,
        })
      : null,
  };
}

export function composeFeedMix(followed: FeedItem[], recommended: FeedItem[]) {
  const result: FeedItem[] = [];
  const followedQueue = [...followed];
  const recommendedQueue = [...recommended];
  const authorCounts = new Map<string, number>();

  while (followedQueue.length > 0 || recommendedQueue.length > 0) {
    for (let index = 0; index < 7 && followedQueue.length > 0; ) {
      const candidate = followedQueue.shift()!;
      const authorCount = authorCounts.get(candidate.userId) ?? 0;
      if (authorCount >= 3) {
        continue;
      }

      result.push(candidate);
      authorCounts.set(candidate.userId, authorCount + 1);
      index += 1;
    }

    for (let index = 0; index < 3 && recommendedQueue.length > 0; ) {
      const candidate = recommendedQueue.shift()!;
      const authorCount = authorCounts.get(candidate.userId) ?? 0;
      if (authorCount >= 3) {
        continue;
      }

      result.push(candidate);
      authorCounts.set(candidate.userId, authorCount + 1);
      index += 1;
    }
  }

  return result;
}