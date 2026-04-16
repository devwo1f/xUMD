import { useMemo } from 'react';
import { create } from 'zustand';
import {
  clubNameById,
  CURRENT_SOCIAL_USER_ID,
  initialFollowingByUser,
  socialProfiles,
  type RecommendationReason,
  type SocialProfile,
} from '../data/mockSocialGraph';

interface SocialGraphState {
  profiles: Record<string, SocialProfile>;
  followingByUser: Record<string, string[]>;
  follow: (targetId: string, actorId?: string) => void;
  unfollow: (targetId: string, actorId?: string) => void;
  toggleFollow: (targetId: string, actorId?: string) => void;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function intersect(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return unique(left.filter((value) => rightSet.has(value)));
}

function getFollowersIdsForUser(followingByUser: Record<string, string[]>, userId: string) {
  return Object.entries(followingByUser)
    .filter(([, following]) => following.includes(userId))
    .map(([followerId]) => followerId);
}

function getNeighborhoodIds(followingByUser: Record<string, string[]>, userId: string) {
  const following = followingByUser[userId] ?? [];
  const followers = getFollowersIdsForUser(followingByUser, userId);
  return unique([...following, ...followers]);
}

function buildRecommendationReason(
  currentUser: SocialProfile,
  candidate: SocialProfile,
  followingByUser: Record<string, string[]>,
): RecommendationReason {
  const mutualIds = intersect(
    getNeighborhoodIds(followingByUser, currentUser.id),
    getNeighborhoodIds(followingByUser, candidate.id),
  ).filter((id) => id !== currentUser.id && id !== candidate.id);

  const sharedClubIds = intersect(currentUser.clubIds, candidate.clubIds);
  const sharedInterests = intersect(currentUser.interests, candidate.interests);

  let score = 0;
  score += mutualIds.length * 4;
  score += sharedClubIds.length * 5;
  score += sharedInterests.length * 3;
  if (currentUser.major && candidate.major && currentUser.major === candidate.major) {
    score += 3;
  }
  if (candidate.isOfficial) {
    score += 1;
  }

  let headline = 'Popular around campus';
  if (mutualIds.length > 0) {
    headline = `${mutualIds.length} mutual${mutualIds.length === 1 ? '' : 's'} in your orbit`;
  } else if (sharedClubIds.length > 0) {
    headline = `Also in ${clubNameById[sharedClubIds[0]] ?? 'your circles'}`;
  } else if (sharedInterests.length > 0) {
    headline = `Into ${sharedInterests[0].replace(/-/g, ' ')} too`;
  } else if (candidate.isOfficial) {
    headline = 'Official campus account';
  }

  return {
    mutualCount: mutualIds.length,
    sharedClubIds,
    sharedInterests,
    score,
    headline,
  };
}

export const useSocialGraphStore = create<SocialGraphState>((set, get) => ({
  profiles: socialProfiles,
  followingByUser: initialFollowingByUser,
  follow: (targetId, actorId = CURRENT_SOCIAL_USER_ID) =>
    set((state) => {
      if (!state.profiles[targetId] || targetId === actorId) {
        return state;
      }

      const currentFollowing = state.followingByUser[actorId] ?? [];
      if (currentFollowing.includes(targetId)) {
        return state;
      }

      return {
        followingByUser: {
          ...state.followingByUser,
          [actorId]: [...currentFollowing, targetId],
        },
      };
    }),
  unfollow: (targetId, actorId = CURRENT_SOCIAL_USER_ID) =>
    set((state) => ({
      followingByUser: {
        ...state.followingByUser,
        [actorId]: (state.followingByUser[actorId] ?? []).filter((id) => id !== targetId),
      },
    })),
  toggleFollow: (targetId, actorId = CURRENT_SOCIAL_USER_ID) => {
    const isFollowing = (get().followingByUser[actorId] ?? []).includes(targetId);
    if (isFollowing) {
      get().unfollow(targetId, actorId);
      return;
    }
    get().follow(targetId, actorId);
  },
}));

export function useSocialGraph(userId: string = CURRENT_SOCIAL_USER_ID) {
  const profiles = useSocialGraphStore((state) => state.profiles);
  const followingByUser = useSocialGraphStore((state) => state.followingByUser);
  const follow = useSocialGraphStore((state) => state.follow);
  const unfollow = useSocialGraphStore((state) => state.unfollow);
  const toggleFollow = useSocialGraphStore((state) => state.toggleFollow);

  const currentUser = profiles[userId];
  const followingIds = followingByUser[userId] ?? [];
  const followerIds = useMemo(() => getFollowersIdsForUser(followingByUser, userId), [followingByUser, userId]);

  const following = useMemo(
    () => followingIds.map((id) => profiles[id]).filter(Boolean),
    [followingIds, profiles],
  );

  const followers = useMemo(
    () => followerIds.map((id) => profiles[id]).filter(Boolean),
    [followerIds, profiles],
  );

  const getMutualCount = useMemo(
    () => (targetId: string) =>
      buildRecommendationReason(currentUser, profiles[targetId], followingByUser).mutualCount,
    [currentUser, followingByUser, profiles],
  );

  const recommendations = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return Object.values(profiles)
      .filter((profile) => profile.id !== userId && !followingIds.includes(profile.id))
      .map((profile) => ({
        profile,
        reason: buildRecommendationReason(currentUser, profile, followingByUser),
      }))
      .sort((left, right) => right.reason.score - left.reason.score)
      .slice(0, 8);
  }, [currentUser, followingByUser, followingIds, profiles, userId]);

  const mutualConnections = useMemo(
    () =>
      followers
        .filter((profile) => followingIds.includes(profile.id))
        .sort((left, right) => left.displayName.localeCompare(right.displayName)),
    [followers, followingIds],
  );

  return {
    currentUser,
    followingIds,
    followerIds,
    following,
    followers,
    mutualConnections,
    recommendations,
    isFollowingUser: (targetId: string) => followingIds.includes(targetId),
    getMutualCount,
    follow: (targetId: string) => follow(targetId, userId),
    unfollow: (targetId: string) => unfollow(targetId, userId),
    toggleFollow: (targetId: string) => toggleFollow(targetId, userId),
  };
}

export type SocialRecommendation = ReturnType<typeof useSocialGraph>['recommendations'][number];
