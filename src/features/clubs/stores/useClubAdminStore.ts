import { create } from 'zustand';
import {
  mockClubMembers,
  mockClubMedia,
  mockJoinRequests,
  type ClubMedia,
  type JoinRequest,
} from '../../../assets/data/mockClubs';
import { MemberRole, MemberStatus, type ClubMemberWithUser } from '../../../shared/types';

export interface ClubAnnouncement {
  id: string;
  club_id: string;
  title: string;
  body: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

interface AddAnnouncementInput {
  clubId: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
}

interface AddMediaInput {
  clubId: string;
  url: string;
  caption: string;
}

interface ClubAdminState {
  currentUserId: string;
  members: ClubMemberWithUser[];
  joinRequests: JoinRequest[];
  media: ClubMedia[];
  announcements: ClubAnnouncement[];
  setCurrentUserId: (userId: string) => void;
  getMembers: (clubId: string) => ClubMemberWithUser[];
  getJoinRequests: (clubId: string) => JoinRequest[];
  getMedia: (clubId: string) => ClubMedia[];
  getAnnouncements: (clubId: string) => ClubAnnouncement[];
  getMemberCountDelta: (clubId: string) => number;
  approveJoinRequest: (clubId: string, userId: string) => void;
  rejectJoinRequest: (clubId: string, userId: string) => void;
  removeMember: (clubId: string, userId: string) => void;
  setMemberRole: (clubId: string, userId: string, role: MemberRole) => void;
  transferOwnership: (clubId: string, nextOwnerUserId: string) => void;
  addAnnouncement: (input: AddAnnouncementInput) => void;
  addMedia: (input: AddMediaInput) => void;
}

const initialApprovedCounts = mockClubMembers.reduce<Record<string, number>>((accumulator, member) => {
  if (member.status === MemberStatus.Approved) {
    accumulator[member.club_id] = (accumulator[member.club_id] ?? 0) + 1;
  }

  return accumulator;
}, {});

const initialAnnouncements: ClubAnnouncement[] = [
  {
    id: 'announcement-001',
    club_id: 'club-001',
    title: 'Bitcamp volunteer call',
    body: 'Officer applications for logistics, design, and hacker experience close Friday at 11:59 PM.',
    author_id: 'user-001',
    author_name: 'Alex Chen',
    created_at: '2026-03-27T19:30:00Z',
  },
  {
    id: 'announcement-002',
    club_id: 'club-001',
    title: 'Workshop room update',
    body: 'React workshop moved to IRB 2207 this week because of the engineering career fair setup.',
    author_id: 'user-003',
    author_name: 'Jordan Kim',
    created_at: '2026-03-26T22:10:00Z',
  },
  {
    id: 'announcement-003',
    club_id: 'club-002',
    title: 'Garage sprint this Saturday',
    body: 'Subsystem leads should arrive by 9:00 AM so we can finish validation before the tow test.',
    author_id: 'user-002',
    author_name: 'Sarah Martinez',
    created_at: '2026-03-25T15:00:00Z',
  },
];

function sortMembersForDisplay(members: ClubMemberWithUser[]): ClubMemberWithUser[] {
  const roleOrder: Record<MemberRole, number> = {
    [MemberRole.President]: 0,
    [MemberRole.Admin]: 1,
    [MemberRole.Officer]: 2,
    [MemberRole.Member]: 3,
  };

  return [...members].sort((left, right) => {
    const roleDifference = roleOrder[left.role] - roleOrder[right.role];
    if (roleDifference !== 0) {
      return roleDifference;
    }

    return left.user.display_name.localeCompare(right.user.display_name);
  });
}

export const useClubAdminStore = create<ClubAdminState>((set, get) => ({
  currentUserId: 'user-001',
  members: sortMembersForDisplay(mockClubMembers),
  joinRequests: [...mockJoinRequests],
  media: [...mockClubMedia],
  announcements: [...initialAnnouncements],

  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  getMembers: (clubId) => get().members.filter((member) => member.club_id === clubId),

  getJoinRequests: (clubId) => get().joinRequests.filter((request) => request.club_id === clubId),

  getMedia: (clubId) => get().media.filter((item) => item.club_id === clubId),

  getAnnouncements: (clubId) =>
    get()
      .announcements
      .filter((announcement) => announcement.club_id === clubId)
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()),

  getMemberCountDelta: (clubId) => {
    const currentApprovedCount = get().members.filter((member) => member.club_id === clubId).length;
    const initialApprovedCount = initialApprovedCounts[clubId] ?? 0;
    return currentApprovedCount - initialApprovedCount;
  },

  approveJoinRequest: (clubId, userId) =>
    set((state) => {
      const request = state.joinRequests.find(
        (entry) => entry.club_id === clubId && entry.user.id === userId,
      );

      if (!request) {
        return state;
      }

      const alreadyMember = state.members.some(
        (member) => member.club_id === clubId && member.user_id === userId,
      );

      const nextMembers = alreadyMember
        ? state.members
        : sortMembersForDisplay([
            {
              club_id: clubId,
              user_id: request.user.id,
              role: MemberRole.Member,
              status: MemberStatus.Approved,
              joined_at: new Date().toISOString(),
              user: request.user,
            },
            ...state.members,
          ]);

      return {
        members: nextMembers,
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

  removeMember: (clubId, userId) =>
    set((state) => ({
      members: state.members.filter(
        (member) => !(member.club_id === clubId && member.user_id === userId),
      ),
    })),

  setMemberRole: (clubId, userId, role) =>
    set((state) => ({
      members: sortMembersForDisplay(
        state.members.map((member) =>
          member.club_id === clubId && member.user_id === userId
            ? { ...member, role }
            : member,
        ),
      ),
    })),

  transferOwnership: (clubId, nextOwnerUserId) =>
    set((state) => ({
      members: sortMembersForDisplay(
        state.members.map((member) => {
          if (member.club_id !== clubId) {
            return member;
          }

          if (member.role === MemberRole.President) {
            return { ...member, role: MemberRole.Admin };
          }

          if (member.user_id === nextOwnerUserId) {
            return { ...member, role: MemberRole.President };
          }

          return member;
        }),
      ),
    })),

  addAnnouncement: ({ clubId, title, body, authorId, authorName }) =>
    set((state) => ({
      announcements: [
        {
          id: `announcement-${Date.now()}`,
          club_id: clubId,
          title: title.trim(),
          body: body.trim(),
          author_id: authorId,
          author_name: authorName,
          created_at: new Date().toISOString(),
        },
        ...state.announcements,
      ],
    })),

  addMedia: ({ clubId, url, caption }) =>
    set((state) => ({
      media: [
        {
          id: `media-${Date.now()}`,
          club_id: clubId,
          url: url.trim(),
          type: 'photo',
          caption: caption.trim(),
          created_at: new Date().toISOString(),
        },
        ...state.media,
      ],
    })),
}));

export const useClubAdmin = useClubAdminStore;

