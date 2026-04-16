import { supabase } from './supabase';
import { MemberRole, MemberStatus } from '../shared/types';
import type {
  Club,
  ClubFilters,
  ClubMember,
  ClubMemberWithUser,
  ClubUpdate,
  PaginatedResponse,
  ServiceResult,
} from '../shared/types';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated, filterable list of clubs.
 */
export async function getClubs(
  filters?: ClubFilters,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<ServiceResult<PaginatedResponse<Club>>> {
  let query = supabase
    .from('clubs')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  // Apply sorting
  switch (filters?.sort) {
    case 'member_count':
      query = query.order('member_count', { ascending: false });
      break;
    case 'created_at':
      query = query.order('created_at', { ascending: false });
      break;
    case 'name':
    default:
      query = query.order('name', { ascending: true });
      break;
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  const total = count ?? 0;

  return {
    data: {
      data: (data ?? []) as Club[],
      count: total,
      page,
      pageSize,
      hasMore: from + pageSize < total,
    },
    error: null,
  };
}

/**
 * Fetch a single club by its ID.
 */
export async function getClubById(id: string): Promise<ServiceResult<Club>> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Club, error: null };
}

/**
 * Fetch all approved members of a club, with their user profiles.
 */
export async function getClubMembers(
  clubId: string,
): Promise<ServiceResult<ClubMemberWithUser[]>> {
  const { data, error } = await supabase
    .from('club_members')
    .select('*, user:users!club_members_user_id_fkey(*)')
    .eq('club_id', clubId)
    .eq('status', MemberStatus.Approved)
    .order('role', { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as ClubMemberWithUser[], error: null };
}

/**
 * Submit a request to join a club.
 * Creates a club_members row with status = Pending.
 */
export async function requestToJoinClub(clubId: string): Promise<ServiceResult<null>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { error } = await supabase.from('club_members').insert({
    club_id: clubId,
    user_id: session.user.id,
    role: MemberRole.Member,
    status: MemberStatus.Pending,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

/**
 * Approve a pending join request (officer/president action).
 * Updates the member status and increments the club member count.
 */
export async function approveJoinRequest(
  clubId: string,
  userId: string,
): Promise<ServiceResult<null>> {
  const { error: updateError } = await supabase
    .from('club_members')
    .update({ status: MemberStatus.Approved, joined_at: new Date().toISOString() })
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .eq('status', MemberStatus.Pending);

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  // Increment the member count
  const { error: countError } = await supabase.rpc('increment_member_count', {
    target_club_id: clubId,
  });

  if (countError) {
    // Non-fatal: the count can be reconciled later
    console.warn('Failed to increment member count:', countError.message);
  }

  return { data: null, error: null };
}

/**
 * Reject a pending join request.
 */
export async function rejectJoinRequest(
  clubId: string,
  userId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('club_members')
    .update({ status: MemberStatus.Rejected })
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .eq('status', MemberStatus.Pending);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

/**
 * Fetch all clubs the given user is an approved member of.
 */
export async function getMyClubs(userId: string): Promise<ServiceResult<Club[]>> {
  const { data, error } = await supabase
    .from('club_members')
    .select('club:clubs(*)')
    .eq('user_id', userId)
    .eq('status', MemberStatus.Approved);

  if (error) {
    return { data: null, error: error.message };
  }

  // Flatten the join — each row has { club: Club }
  const clubs = (data ?? [])
    .map((row) => {
      const clubValue = (row as { club?: Club | Club[] }).club;
      return Array.isArray(clubValue) ? clubValue[0] : clubValue;
    })
    .filter((club): club is Club => Boolean(club));

  return { data: clubs, error: null };
}

/**
 * Update a club's information (officer/president action).
 */
export async function updateClub(
  clubId: string,
  updates: ClubUpdate,
): Promise<ServiceResult<Club>> {
  const { data, error } = await supabase
    .from('clubs')
    .update(updates)
    .eq('id', clubId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Club, error: null };
}

/**
 * Fetch media gallery items for a club from the club_media table.
 */
export async function getClubMedia(
  clubId: string,
): Promise<ServiceResult<{ id: string; url: string; caption: string | null; created_at: string }[]>> {
  const { data, error } = await supabase
    .from('club_media')
    .select('id, url, caption, created_at')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}
