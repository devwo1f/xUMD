import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured } from '../../../services/supabase';
import {
  fetchCurrentRemoteUserId,
  fetchFollowerProfiles,
  fetchFollowingProfiles,
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
import { useSocialGraph } from './useSocialGraph';

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

function toRecommendationReason(entry: RemoteRecommendation): RecommendationReason {
  return {
    mutualCount: 0,
    sharedClubIds: [],
    sharedInterests: [],
    score: entry.score,
    headline: entry.reason,
  };
}

export function useCampusSocialGraph(userId: string = CURRENT_SOCIAL_USER_ID) {
  const demo = useSocialGraph(userId);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState<SocialProfile[]>([]);
  const [followers, setFollowers] = useState<SocialProfile[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{ profile: SocialProfile; reason: RecommendationReason }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRemote = isSupabaseConfigured && !!remoteUserId;

  const loadRemote = async (effectiveUserId: string) => {
    setLoading(true);
    setError(null);

    try {
      const [nextFollowing, nextFollowers, nextRecommendations] = await Promise.all([
        fetchFollowingProfiles(effectiveUserId),
        fetchFollowerProfiles(effectiveUserId),
        fetchRemoteRecommendations(12),
      ]);

      setFollowing(nextFollowing.map(toSocialProfile));
      setFollowers(nextFollowers.map(toSocialProfile));
      setRecommendations(
        nextRecommendations.map((entry) => ({
          profile: toSocialProfile(entry.profile),
          reason: toRecommendationReason(entry),
        })),
      );
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
    recommendations: recommendations.length > 0 ? recommendations : demo.recommendations,
    loading,
    error,
    isFollowingUser: (targetId: string) => remoteFollowingIds.includes(targetId),
    getMutualCount: () => 0,
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
