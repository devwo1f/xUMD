import { mockClubs, type ClubMedia as MockClubMedia, type JoinRequest } from '../assets/data/mockClubs';
import { useLocalClubGraphStore } from '../features/clubs/stores/useLocalClubGraphStore';
import {
  MemberRole,
  MemberStatus,
  type Club,
  type ClubMemberWithUser,
  type ServiceResult,
  type User,
} from '../shared/types';
import { isSupabaseConfigured, supabase, supabaseConfigError } from './supabase';

export interface CampusClubMediaItem {
  id: string;
  club_id: string;
  url: string;
  type: 'photo' | 'video';
  caption: string;
  created_at: string;
  created_by?: string | null;
}

export interface CampusClubDirectory {
  clubs: Club[];
  memberships: ClubMemberWithUser[];
  joinRequests: JoinRequest[];
  media: CampusClubMediaItem[];
  source: 'remote' | 'local';
}

type DbClubRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  category: string | null;
  logo_url: string | null;
  cover_url: string | null;
  cover_image_url?: string | null;
  meeting_schedule: string | null;
  contact_email: string | null;
  social_links: Record<string, unknown> | null;
  member_count: number | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
};

type DbUserRow = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  major: string | null;
  graduation_year: number | null;
  degree_type?: string | null;
  minor?: string | null;
  bio: string | null;
  pronouns?: string | null;
  clubs?: string[] | null;
  courses?: string[] | null;
  interests?: string[] | null;
  follower_count?: number | null;
  following_count?: number | null;
  profile_completed?: boolean | null;
  onboarding_step?: number | null;
  notification_prefs?: Record<string, unknown> | null;
  push_token?: string | null;
  created_at: string | null;
  updated_at?: string | null;
};

type DbClubMemberRow = {
  club_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string | null;
  user: DbUserRow | DbUserRow[] | null;
};

type DbClubMediaRow = {
  id: string;
  club_id: string;
  url: string;
  type: 'photo' | 'video' | null;
  caption: string | null;
  created_at: string | null;
  created_by: string | null;
};

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function toUser(row: DbUserRow | User): User {
  return {
    id: row.id,
    email: row.email ?? '',
    username: row.username ?? undefined,
    display_name: row.display_name ?? 'UMD Student',
    avatar_url: row.avatar_url ?? null,
    major: row.major ?? null,
    graduation_year: row.graduation_year ?? null,
    degree_type: ((('degree_type' in row ? row.degree_type : null) ?? null) as User['degree_type']),
    minor: ('minor' in row ? row.minor : null) ?? null,
    bio: row.bio ?? null,
    pronouns: ('pronouns' in row ? row.pronouns : null) ?? null,
    clubs: ('clubs' in row ? row.clubs : undefined) ?? undefined,
    courses: ('courses' in row ? row.courses : undefined) ?? undefined,
    interests: ('interests' in row ? row.interests : undefined) ?? undefined,
    follower_count: ('follower_count' in row ? row.follower_count : undefined) ?? 0,
    following_count: ('following_count' in row ? row.following_count : undefined) ?? 0,
    profile_completed: ('profile_completed' in row ? row.profile_completed : undefined) ?? undefined,
    onboarding_step: ('onboarding_step' in row ? row.onboarding_step : undefined) ?? undefined,
    notification_prefs: ('notification_prefs' in row ? row.notification_prefs : undefined) as User['notification_prefs'],
    push_token: ('push_token' in row ? row.push_token : undefined) ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: ('updated_at' in row ? row.updated_at : undefined) ?? undefined,
  };
}

function normalizeRemoteClubCounts(clubs: Club[], memberships: ClubMemberWithUser[]) {
  const approvedCounts = new Map<string, number>();
  memberships.forEach((membership) => {
    if (membership.status !== MemberStatus.Approved) {
      return;
    }

    approvedCounts.set(membership.club_id, (approvedCounts.get(membership.club_id) ?? 0) + 1);
  });

  return clubs.map((club) => ({
    ...club,
    member_count: approvedCounts.get(club.id) ?? 0,
  }));
}

function mapClubRow(row: DbClubRow): Club {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    description: row.description ?? '',
    short_description: row.short_description ?? row.description ?? '',
    category: (row.category ?? 'other') as Club['category'],
    logo_url: row.logo_url ?? null,
    cover_url: row.cover_url ?? row.cover_image_url ?? null,
    meeting_schedule: row.meeting_schedule ?? null,
    contact_email: row.contact_email ?? null,
    social_links: (row.social_links ?? {}) as Club['social_links'],
    member_count: row.member_count ?? 0,
    is_active: row.is_active ?? true,
    created_by: row.created_by ?? '',
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

function mapMembershipRow(row: DbClubMemberRow): ClubMemberWithUser | null {
  const userValue = Array.isArray(row.user) ? row.user[0] : row.user;
  if (!userValue) {
    return null;
  }

  return {
    club_id: row.club_id,
    user_id: row.user_id,
    role: row.role,
    status: row.status,
    joined_at: row.joined_at ?? new Date().toISOString(),
    user: toUser(userValue),
  };
}

function mapClubMediaRow(row: DbClubMediaRow): CampusClubMediaItem {
  return {
    id: row.id,
    club_id: row.club_id,
    url: row.url,
    type: row.type === 'video' ? 'video' : 'photo',
    caption: row.caption ?? '',
    created_at: row.created_at ?? new Date().toISOString(),
    created_by: row.created_by ?? null,
  };
}

function sortClubMembers(memberships: ClubMemberWithUser[]) {
  const roleRank: Record<MemberRole, number> = {
    [MemberRole.President]: 0,
    [MemberRole.Admin]: 1,
    [MemberRole.Officer]: 2,
    [MemberRole.Member]: 3,
  };

  return [...memberships].sort((left, right) => {
    const rankDelta = roleRank[left.role] - roleRank[right.role];
    if (rankDelta !== 0) {
      return rankDelta;
    }

    return left.user.display_name.localeCompare(right.user.display_name);
  });
}

export function buildLocalClubDirectorySnapshot(): CampusClubDirectory {
  const localState = useLocalClubGraphStore.getState();
  const memberships = sortClubMembers(localState.memberships);
  const clubs = normalizeRemoteClubCounts([...mockClubs], memberships);

  return {
    clubs,
    memberships,
    joinRequests: [...localState.joinRequests],
    media: localState.media.map((item: MockClubMedia) => ({
      id: item.id,
      club_id: item.club_id,
      url: item.url,
      type: item.type,
      caption: item.caption,
      created_at: item.created_at,
    })),
    source: 'local',
  };
}

export async function loadCampusClubDirectory(): Promise<CampusClubDirectory> {
  if (!isSupabaseConfigured) {
    return buildLocalClubDirectorySnapshot();
  }

  try {
    const [clubsResult, membershipsResult, mediaResult] = await Promise.all([
      supabase
        .from('clubs')
        .select('id, name, slug, description, short_description, category, logo_url, cover_url, cover_image_url, meeting_schedule, contact_email, social_links, member_count, is_active, created_by, created_at')
        .eq('is_active', true)
        .order('member_count', { ascending: false }),
      supabase
        .from('club_members')
        .select(`
          club_id,
          user_id,
          role,
          status,
          joined_at,
          user:users!club_members_user_id_fkey(
            id,
            email,
            username,
            display_name,
            avatar_url,
            major,
            graduation_year,
            degree_type,
            minor,
            bio,
            pronouns,
            clubs,
            courses,
            interests,
            follower_count,
            following_count,
            profile_completed,
            onboarding_step,
            notification_prefs,
            push_token,
            created_at,
            updated_at
          )
        `),
      supabase
        .from('club_media')
        .select('id, club_id, url, type, caption, created_at, created_by')
        .order('created_at', { ascending: false }),
    ]);

    if (clubsResult.error) {
      throw clubsResult.error;
    }
    if (membershipsResult.error) {
      throw membershipsResult.error;
    }
    if (mediaResult.error) {
      throw mediaResult.error;
    }

    const memberships = (membershipsResult.data ?? [])
      .map((row) => mapMembershipRow(row as DbClubMemberRow))
      .filter((row): row is ClubMemberWithUser => Boolean(row));
    const clubs = normalizeRemoteClubCounts(
      (clubsResult.data ?? []).map((row) => mapClubRow(row as DbClubRow)),
      memberships,
    );

    return {
      clubs,
      memberships: sortClubMembers(memberships),
      joinRequests: memberships
        .filter((row) => row.status === MemberStatus.Pending)
        .map((row) => ({
          id: `join-request-${row.club_id}-${row.user_id}`,
          club_id: row.club_id,
          user: row.user,
          status: 'pending',
          answers: [],
          requested_at: row.joined_at,
        })),
      media: (mediaResult.data ?? []).map((row) => mapClubMediaRow(row as DbClubMediaRow)),
      source: 'remote',
    };
  } catch (error) {
    console.warn('Falling back to local club directory.', error);
    return buildLocalClubDirectorySnapshot();
  }
}

async function requireSessionUserId() {
  if (!isSupabaseConfigured) {
    return { data: null, error: supabaseConfigError } satisfies ServiceResult<null>;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.user?.id) {
    return { data: null, error: error?.message ?? 'You need to be signed in first.' } satisfies ServiceResult<null>;
  }

  return { data: session.user.id, error: null } satisfies ServiceResult<string>;
}

export async function joinClubMembership(clubId: string): Promise<ServiceResult<null>> {
  const currentUserId = await requireSessionUserId();
  if (currentUserId.error) {
    return currentUserId;
  }

  const { error } = await supabase.from('club_members').upsert(
    {
      club_id: clubId,
      user_id: currentUserId.data,
      role: MemberRole.Member,
      status: MemberStatus.Approved,
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'club_id,user_id' },
  );

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function leaveClubMembership(clubId: string, userId?: string): Promise<ServiceResult<null>> {
  const resolvedUserId = userId
    ? ({ data: userId, error: null } as ServiceResult<string>)
    : await requireSessionUserId();
  if (resolvedUserId.error) {
    return resolvedUserId;
  }

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', resolvedUserId.data);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function updateClubMemberRole(
  clubId: string,
  userId: string,
  role: MemberRole,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('club_members')
    .update({ role })
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function updateClubMemberStatus(
  clubId: string,
  userId: string,
  status: MemberStatus,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('club_members')
    .update({
      status,
      joined_at: status === MemberStatus.Approved ? new Date().toISOString() : undefined,
    })
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function transferClubOwnership(
  clubId: string,
  nextOwnerUserId: string,
): Promise<ServiceResult<null>> {
  const { data: currentPresidentRows, error: presidentError } = await supabase
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubId)
    .eq('role', MemberRole.President)
    .limit(1);

  if (presidentError) {
    return { data: null, error: presidentError.message };
  }

  const currentPresidentId = currentPresidentRows?.[0]?.user_id ?? null;
  const { error: promoteError } = await supabase
    .from('club_members')
    .update({ role: MemberRole.President, status: MemberStatus.Approved })
    .eq('club_id', clubId)
    .eq('user_id', nextOwnerUserId);

  if (promoteError) {
    return { data: null, error: promoteError.message };
  }

  if (currentPresidentId && currentPresidentId !== nextOwnerUserId) {
    const { error: demoteError } = await supabase
      .from('club_members')
      .update({ role: MemberRole.Admin })
      .eq('club_id', clubId)
      .eq('user_id', currentPresidentId);

    if (demoteError) {
      return { data: null, error: demoteError.message };
    }
  }

  return { data: null, error: null };
}

export async function removeClubMember(
  clubId: string,
  userId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function createClubMediaItem(input: {
  clubId: string;
  url: string;
  caption: string;
}): Promise<ServiceResult<CampusClubMediaItem>> {
  const currentUserId = await requireSessionUserId();
  if (currentUserId.error) {
    return currentUserId;
  }

  const { data, error } = await supabase
    .from('club_media')
    .insert({
      club_id: input.clubId,
      url: input.url.trim(),
      caption: input.caption.trim(),
      type: 'photo',
      created_by: currentUserId.data,
    })
    .select('id, club_id, url, type, caption, created_at, created_by')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: mapClubMediaRow(data as DbClubMediaRow), error: null };
}
