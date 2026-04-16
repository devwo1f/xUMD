import { create } from 'zustand';
import {
  mockClubMedia,
  mockClubMembers,
  mockJoinRequests,
  type ClubMedia,
  type JoinRequest,
} from '../../../assets/data/mockClubs';
import {
  MemberRole,
  MemberStatus,
  type ClubMemberWithUser,
  type User,
} from '../../../shared/types';

function roleRank(role: MemberRole) {
  if (role === MemberRole.President) return 0;
  if (role === MemberRole.Admin) return 1;
  if (role === MemberRole.Officer) return 2;
  return 3;
}

function sortMembers(members: ClubMemberWithUser[]) {
  return [...members].sort((left, right) => {
    const rankDelta = roleRank(left.role) - roleRank(right.role);
    if (rankDelta !== 0) {
      return rankDelta;
    }

    return left.user.display_name.localeCompare(right.user.display_name);
  });
}

interface LocalClubGraphState {
  memberships: ClubMemberWithUser[];
  joinRequests: JoinRequest[];
  media: ClubMedia[];
  joinClub: (clubId: string, user: User) => void;
  leaveClub: (clubId: string, userId: string) => void;
  approveJoinRequest: (clubId: string, userId: string) => void;
  rejectJoinRequest: (clubId: string, userId: string) => void;
  updateMemberRole: (clubId: string, userId: string, role: MemberRole) => void;
  transferOwnership: (clubId: string, nextOwnerUserId: string) => void;
  removeMember: (clubId: string, userId: string) => void;
  addMedia: (input: { clubId: string; url: string; caption: string; createdBy?: string | null }) => void;
  reset: () => void;
}

const initialMemberships = sortMembers(mockClubMembers);
const initialJoinRequests = [...mockJoinRequests];
const initialMedia = [...mockClubMedia];

export const useLocalClubGraphStore = create<LocalClubGraphState>((set) => ({
  memberships: initialMemberships,
  joinRequests: initialJoinRequests,
  media: initialMedia,

  joinClub: (clubId, user) =>
    set((state) => {
      const existingMember = state.memberships.find(
        (member) => member.club_id === clubId && member.user_id === user.id,
      );

      const nextMemberships = existingMember
        ? sortMembers(
            state.memberships.map((member) =>
              member.club_id === clubId && member.user_id === user.id
                ? {
                    ...member,
                    status: MemberStatus.Approved,
                    joined_at: new Date().toISOString(),
                    user,
                  }
                : member,
            ),
          )
        : sortMembers([
            ...state.memberships,
            {
              club_id: clubId,
              user_id: user.id,
              role: MemberRole.Member,
              status: MemberStatus.Approved,
              joined_at: new Date().toISOString(),
              user,
            },
          ]);

      return {
        memberships: nextMemberships,
        joinRequests: state.joinRequests.filter(
          (request) => !(request.club_id === clubId && request.user.id === user.id),
        ),
      };
    }),

  leaveClub: (clubId, userId) =>
    set((state) => ({
      memberships: state.memberships.filter(
        (member) => !(member.club_id === clubId && member.user_id === userId),
      ),
      joinRequests: state.joinRequests.filter(
        (request) => !(request.club_id === clubId && request.user.id === userId),
      ),
    })),

  approveJoinRequest: (clubId, userId) =>
    set((state) => {
      const request = state.joinRequests.find(
        (entry) => entry.club_id === clubId && entry.user.id === userId,
      );
      if (!request) {
        return state;
      }

      const alreadyMember = state.memberships.some(
        (member) => member.club_id === clubId && member.user_id === userId,
      );

      return {
        memberships: alreadyMember
          ? state.memberships
          : sortMembers([
              ...state.memberships,
              {
                club_id: clubId,
                user_id: request.user.id,
                role: MemberRole.Member,
                status: MemberStatus.Approved,
                joined_at: new Date().toISOString(),
                user: request.user,
              },
            ]),
        joinRequests: state.joinRequests.filter(
          (entry) => !(entry.club_id === clubId && entry.user.id === userId),
        ),
      };
    }),

  rejectJoinRequest: (clubId, userId) =>
    set((state) => ({
      joinRequests: state.joinRequests.filter(
        (entry) => !(entry.club_id === clubId && entry.user.id === userId),
      ),
    })),

  updateMemberRole: (clubId, userId, role) =>
    set((state) => ({
      memberships: sortMembers(
        state.memberships.map((member) =>
          member.club_id === clubId && member.user_id === userId ? { ...member, role } : member,
        ),
      ),
    })),

  transferOwnership: (clubId, nextOwnerUserId) =>
    set((state) => ({
      memberships: sortMembers(
        state.memberships.map((member) => {
          if (member.club_id !== clubId) {
            return member;
          }

          if (member.user_id === nextOwnerUserId) {
            return { ...member, role: MemberRole.President };
          }

          if (member.role === MemberRole.President) {
            return { ...member, role: MemberRole.Admin };
          }

          return member;
        }),
      ),
    })),

  removeMember: (clubId, userId) =>
    set((state) => ({
      memberships: state.memberships.filter(
        (member) => !(member.club_id === clubId && member.user_id === userId),
      ),
      joinRequests: state.joinRequests.filter(
        (entry) => !(entry.club_id === clubId && entry.user.id === userId),
      ),
    })),

  addMedia: ({ clubId, url, caption }) =>
    set((state) => ({
      media: [
        {
          id: `club-media-${Date.now()}`,
          club_id: clubId,
          url: url.trim(),
          type: 'photo',
          caption: caption.trim(),
          created_at: new Date().toISOString(),
        },
        ...state.media,
      ],
    })),

  reset: () =>
    set({
      memberships: initialMemberships,
      joinRequests: initialJoinRequests,
      media: initialMedia,
    }),
}));
