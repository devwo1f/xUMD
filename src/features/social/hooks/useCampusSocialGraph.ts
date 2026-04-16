import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured } from '../../../services/supabase';
import {
  fetchCurrentRemoteUserId,
  fetchFollowerProfiles,
  fetchFollowingProfiles,
  fetchMutualCounts,
  fetchRemoteRecommendations,
  toggleRemoteFollow,
  type RemoteRecommendation,
  type RemoteSocialProfile,
} from '../../../services/social';
import {
  CURRENT_SOCIAL_USER_ID,
  type RecommendationReason,
  type SocialProfile,
} from '../data/mockSocialGraph';
import { useCampusClubs } from '../../clubs/hooks/useCampusClubs';
import { useSocialGraph } from './useSocialGraph';

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function toSocialProfile(profile: RemoteSocialProfile): SocialProfile {
  return {
    id: profile.id,
    displayName: profile.displayName,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    pronouns: profile.pronouns ?? null,
    major: profile.major,
    classYear: profile.classYear,
    clubIds: profile.clubIds,
    interests: profile.interests,
  };
}

function toRecommendationReason(
  entry: RemoteRecommendation,
  viewerClubIds: string[],
  viewerInterests: string[],
): RecommendationReason {
  return {
    mutualCount: 0,
    sharedClubIds: entry.profile.clubIds.filter((id) => viewerClubIds.includes(id)),
    sharedInterests: entry.profile.interests.filter((interest) => viewerInterests.includes(interest)),
    score: entry.score,
    headline: entry.reason,
  };
}

export function useCampusSocialGraph(userId: string = CURRENT_SOCIAL_USER_ID) {
  const demo = useSocialGraph(userId);
  const { viewerClubIds } = useCampusClubs();
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState<SocialProfile[]>([]);
  const [followers, setFollowers] = useState<SocialProfile[]>([]);
  // Raw entries stored separately so the derived `recommendations` below can
  // react to viewer club changes without re-fetching from the network.
  const [rawRecommendations, setRawRecommendations] = useState<RemoteRecommendation[]>([]);
  const [mutualCountsMap, setMutualCountsMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewerInterests = demo.currentUser?.interests ?? [];
  const isRemote = isSupabaseConfigured && !!remoteUserId;

  // Re-derived whenever viewer's clubs/interests or raw entries change.
  const recommendations = useMemo(
    () =>
      rawRecommendations.map((entry) => ({
        profile: toSocialProfile(entry.profile),
        reason: toRecommendationReason(entry, viewerClubIds, viewerInterests),
      })),
    [rawRecommendations, viewerClubIds, viewerInterests],
  );

  const loadRemote = async (effectiveUserId: string) => {
    setLoading(true);
    setError(null);

    try {
      const [nextFollowing, nextFollowers, nextRecommendations] = await Promise.all([
        fetchFollowingProfiles(effectiveUserId),
        fetchFollowerProfiles(effectiveUserId),
        fetchRemoteRecommendations(12),
      ]);

      const nextFollowingProfiles = nextFollowing.map(toSocialProfile);
      const nextFollowerProfiles = nextFollowers.map(toSocialProfile);
      setFollowing(nextFollowingProfiles);
      setFollowers(nextFollowerProfiles);
      setRawRecommendations(nextRecommendations);

      // Fetch mutual counts for all connections without blocking the initial render.
      const allConnectionIds = unique([
        ...nextFollowingProfiles.map((p) => p.id),
        ...nextFollowerProfiles.map((p) => p.id),
      ]);
      const counts = await fetchMutualCounts(effectiveUserId, allConnectionIds);
      setMutualCountsMap(counts);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load your network right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    void (async () => {
      const sessionUserId = await fetchCurrentRemoteUserId();
      if (!isMounted || !sessionUserId) {
        return;
      }

      setRemoteUserId(sessionUserId);
      await loadRemote(sessionUserId);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const remoteFollowingIds = useMemo(() => following.map((profile) => profile.id), [following]);
  const remoteFollowerIds = useMemo(() => followers.map((profile) => profile.id), [followers]);
  const mutualConnections = useMemo(
    () => followers.filter((profile) => remoteFollowingIds.includes(profile.id)),
    [followers, remoteFollowingIds],
  );

  if (!isRemote) {
    return {
      ...demo,
      viewerUserId: userId,
      loading,
      error,
    };
  }

  return {
    currentUser: demo.currentUser,
    viewerUserId: remoteUserId,
    followingIds: remoteFollowingIds,
    followerIds: remoteFollowerIds,
    following,
    followers,
    mutualConnections,
    recommendations: rawRecommendations.length > 0 ? recommendations : demo.recommendations,
    loading,
    error,
    isFollowingUser: (targetId: string) => remoteFollowingIds.includes(targetId),
    getMutualCount: (targetId: string) => mutualCountsMap.get(targetId) ?? 0,
    follow: async (targetId: string) => {
      if (!remoteUserId) {
        return;
      }
      await toggleRemoteFollow({ targetUserId: targetId, action: 'follow', source: 'profile' });
      await loadRemote(remoteUserId);
    },
    unfollow: async (targetId: string) => {
      if (!remoteUserId) {
        return;
      }
      await toggleRemoteFollow({ targetUserId: targetId, action: 'unfollow', source: 'profile' });
      await loadRemote(remoteUserId);
    },
    toggleFollow: async (targetId: string) => {
      if (!remoteUserId) {
        return;
      }
      const action = remoteFollowingIds.includes(targetId) ? 'unfollow' : 'follow';
      await toggleRemoteFollow({ targetUserId: targetId, action, source: 'recommendation' });
      await loadRemote(remoteUserId);
    },
  };
}
