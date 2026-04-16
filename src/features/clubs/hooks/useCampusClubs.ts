import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { JoinRequest } from '../../../assets/data/mockClubs';
import { useAuth } from '../../auth/hooks/useAuth';
import { useProfile } from '../../profile/hooks/useProfile';
import { useLocalClubGraphStore } from '../stores/useLocalClubGraphStore';
import {
  buildLocalClubDirectorySnapshot,
  createClubMediaItem,
  joinClubMembership,
  leaveClubMembership,
  loadCampusClubDirectory,
  removeClubMember,
  transferClubOwnership,
  updateClubMemberRole,
  updateClubMemberStatus,
  type CampusClubDirectory,
} from '../../../services/campusClubs';
import { isSupabaseConfigured } from '../../../services/supabase';
import { MemberRole, MemberStatus, type Club, type ClubMemberWithUser, type User } from '../../../shared/types';

const CLUB_DIRECTORY_QUERY_KEY = ['campus-club-directory'] as const;

function buildFallbackViewerUser(profileUser: ReturnType<typeof useProfile>['user']): User {
  return {
    id: profileUser.id,
    email: profileUser.email,
    username: profileUser.username,
    display_name: profileUser.displayName,
    avatar_url: profileUser.avatar || null,
    major: profileUser.major,
    graduation_year: profileUser.classYear,
    bio: profileUser.bio,
    created_at: new Date().toISOString(),
    follower_count: 0,
    following_count: 0,
    push_token: null,
  };
}

export function useCampusClubs() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { user: profileUser } = useProfile();
  const localMemberships = useLocalClubGraphStore((state) => state.memberships);
  const localJoinRequests = useLocalClubGraphStore((state) => state.joinRequests);
  const localMedia = useLocalClubGraphStore((state) => state.media);

  const localDirectory = useMemo(
    () => buildLocalClubDirectorySnapshot(),
    [localJoinRequests, localMedia, localMemberships],
  );

  const remoteQuery = useQuery({
    queryKey: CLUB_DIRECTORY_QUERY_KEY,
    queryFn: loadCampusClubDirectory,
    enabled: isSupabaseConfigured,
    staleTime: 60_000,
  });

  const viewerId = authUser?.id ?? profileUser.id;
  const viewerUser = authUser ?? buildFallbackViewerUser(profileUser);
  const directory = (isSupabaseConfigured ? remoteQuery.data : localDirectory) ?? localDirectory;

  const approvedMemberships = useMemo(
    () => directory.memberships.filter((membership) => membership.status === MemberStatus.Approved),
    [directory.memberships],
  );

  const clubsById = useMemo(
    () => new Map(directory.clubs.map((club) => [club.id, club])),
    [directory.clubs],
  );

  const viewerMemberships = useMemo(
    () => approvedMemberships.filter((membership) => membership.user_id === viewerId),
    [approvedMemberships, viewerId],
  );

  const viewerClubIds = useMemo(
    () => viewerMemberships.map((membership) => membership.club_id),
    [viewerMemberships],
  );

  const clubsByUserId = useMemo(() => {
    const mapping = new Map<string, string[]>();
    approvedMemberships.forEach((membership) => {
      const current = mapping.get(membership.user_id) ?? [];
      mapping.set(membership.user_id, [...current, membership.club_id]);
    });
    return mapping;
  }, [approvedMemberships]);

  const mediaByClubId = useMemo(() => {
    const mapping = new Map<string, typeof directory.media>();
    directory.media.forEach((item) => {
      const current = mapping.get(item.club_id) ?? [];
      mapping.set(item.club_id, [...current, item]);
    });
    return mapping;
  }, [directory.media]);

  const requestsByClubId = useMemo(() => {
    const mapping = new Map<string, typeof directory.joinRequests>();
    directory.joinRequests.forEach((request) => {
      const current = mapping.get(request.club_id) ?? [];
      mapping.set(request.club_id, [...current, request]);
    });
    return mapping;
  }, [directory.joinRequests]);

  const membersByClubId = useMemo(() => {
    const mapping = new Map<string, typeof approvedMemberships>();
    approvedMemberships.forEach((membership) => {
      const current = mapping.get(membership.club_id) ?? [];
      mapping.set(membership.club_id, [...current, membership]);
    });
    return mapping;
  }, [approvedMemberships]);

  const invalidateRemoteDirectory = async () => {
    await queryClient.invalidateQueries({ queryKey: CLUB_DIRECTORY_QUERY_KEY });
  };

  const joinClub = async (clubId: string) => {
    if (!isSupabaseConfigured) {
      useLocalClubGraphStore.getState().joinClub(clubId, viewerUser);
      return;
    }

    const result = await joinClubMembership(clubId);
    if (result.error) {
      throw new Error(result.error);
    }
    await invalidateRemoteDirectory();
  };

  const leaveClub = async (clubId: string, userId = viewerId) => {
    if (!isSupabaseConfigured) {
      useLocalClubGraphStore.getState().leaveClub(clubId, userId);
      return;
    }

    const result = await leaveClubMembership(clubId, userId);
    if (result.error) {
      throw new Error(result.error);
    }
    await invalidateRemoteDirectory();
  };

  const approveRequest = async (clubId: string, userId: string) => {
    if (!isSupabaseConfigured) {
      useLocalClubGraphStore.getState().approveJoinRequest(clubId, userId);
      return;
    }

    const result = await updateClubMemberStatus(clubId, userId, MemberStatus.Approved);
    if (result.error) {
      throw new Error(result.error);
    }
    await invalidateRemoteDirectory();
  };

  const rejectRequest = async (clubId: string, userId: string) => {
    if (!isSupabaseConfigured) {
      useLocalClubGraphStore.getState().rejectJoinRequest(clubId, userId);
      return;
    }

    const result = await updateClubMemberStatus(clubId, userId, MemberStatus.Rejected);
    if (result.error) {
      throw new Error(result.error);
    }
    await invalidateRemoteDirectory();
  };

  const setMemberRole = async (clubId: string, userId: string, role: MemberRole) => {
    if (!isSupabaseConfigured) {
      useLocalClubGraphStore.getState().updateMemberRole(clubId, userId, role);
      return;
    }

    const result = await updateClubMemberRole(clubId, userId, role);
    if (result.error) {
      throw new Error(result.error);
    }
    await invalidateRemoteDirectory();
  };

  const makeOwner = async (clubId: string, nextOwnerUserId: string) => {
    if (!isSupabaseConfigured) {
      useLocalClubGraphStore.getState().transferOwnership(clubId, nextOwnerUserId);
      return;
    }

    const result = await transferClubOwnership(clubId, nextOwnerUserId);
    if (result.error) {
      throw new Error(result.error);
    }
    await invalidateRemoteDirectory();
  };

  const removeMemberFromClub = async (clubId: string, userId: string) => {
    if (!isSupabaseConfigured) {
      useLocalClubGraphStore.getState().removeMember(clubId, userId);
      return;
    }

    const result = await removeClubMember(clubId, userId);
    if (result.error) {
      throw new Error(result.error);
    }
    await invalidateRemoteDirectory();
  };

  const addMedia = async (clubId: string, url: string, caption: string) => {
    if (!isSupabaseConfigured) {
      useLocalClubGraphStore.getState().addMedia({ clubId, url, caption, createdBy: viewerId });
      return;
    }

    const result = await createClubMediaItem({ clubId, url, caption });
    if (result.error) {
      throw new Error(result.error);
    }
    await invalidateRemoteDirectory();
  };

  return {
    ...directory,
    viewerId,
    viewerUser,
    viewerClubIds,
    clubsById,
    approvedMemberships,
    getClubById: (clubId: string) =>
      directory.clubs.find((club) => club.id === clubId || club.slug === clubId) ?? null,
    getClubMembers: (clubId: string) => membersByClubId.get(clubId) ?? [],
    getClubJoinRequests: (clubId: string) => requestsByClubId.get(clubId) ?? [],
    getClubMedia: (clubId: string) => mediaByClubId.get(clubId) ?? [],
    getClubIdsForUser: (userId: string) => clubsByUserId.get(userId) ?? [],
    getClubsForUser: (userId: string) =>
      (clubsByUserId.get(userId) ?? [])
        .map((clubId) => clubsById.get(clubId))
        .filter((club): club is NonNullable<typeof club> => Boolean(club)),
    isClubJoined: (clubId: string, userId = viewerId) => (clubsByUserId.get(userId) ?? []).includes(clubId),
    isLoading: isSupabaseConfigured ? remoteQuery.isLoading : false,
    error: isSupabaseConfigured && remoteQuery.error instanceof Error ? remoteQuery.error.message : null,
    refetch: async () => {
      if (isSupabaseConfigured) {
        await remoteQuery.refetch();
      }
    },
    joinClub,
    leaveClub,
    approveRequest,
    rejectRequest,
    setMemberRole,
    makeOwner,
    removeMemberFromClub,
    addMedia,
  } satisfies CampusClubDirectory & {
    viewerId: string;
    viewerUser: User;
    viewerClubIds: string[];
    clubsById: Map<string, Club>;
    approvedMemberships: ClubMemberWithUser[];
    getClubById: (clubId: string) => Club | null;
    getClubMembers: (clubId: string) => ClubMemberWithUser[];
    getClubJoinRequests: (clubId: string) => JoinRequest[];
    getClubMedia: (clubId: string) => typeof directory.media;
    getClubIdsForUser: (userId: string) => string[];
    getClubsForUser: (userId: string) => Club[];
    isClubJoined: (clubId: string, userId?: string) => boolean;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    joinClub: (clubId: string) => Promise<void>;
    leaveClub: (clubId: string, userId?: string) => Promise<void>;
    approveRequest: (clubId: string, userId: string) => Promise<void>;
    rejectRequest: (clubId: string, userId: string) => Promise<void>;
    setMemberRole: (clubId: string, userId: string, role: MemberRole) => Promise<void>;
    makeOwner: (clubId: string, nextOwnerUserId: string) => Promise<void>;
    removeMemberFromClub: (clubId: string, userId: string) => Promise<void>;
    addMedia: (clubId: string, url: string, caption: string) => Promise<void>;
  };
}
