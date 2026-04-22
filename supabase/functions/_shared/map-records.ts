import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { HttpError } from './errors.ts';
import type { FeedAuthorSummary } from './types.ts';
import { fetchUsersByIds } from './records.ts';
import {
  buildTimeWindow,
  normalizeSearchQuery,
  type CampusLocationRow,
  type EventRow,
  type MapEventFilters,
} from './map.ts';

export async function fetchApprovedClubIdsForUser(adminClient: SupabaseClient, userId: string) {
  const { data, error } = await adminClient
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId)
    .eq('status', 'approved');

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load club memberships.', error);
  }

  return new Set((data ?? []).map((row: { club_id: string }) => row.club_id));
}

export function canUserAccessEvent(
  event: Pick<EventRow, 'organizer_id' | 'organizer_ids' | 'visibility' | 'club_id'>,
  userId: string,
  approvedClubIds: Set<string>,
) {
  if (event.organizer_id === userId) {
    return true;
  }

  if ((event.organizer_ids ?? []).includes(userId)) {
    return true;
  }

  if (event.visibility !== 'club_members_only') {
    return true;
  }

  return Boolean(event.club_id && approvedClubIds.has(event.club_id));
}

export async function fetchCampusLocations(adminClient: SupabaseClient) {
  const { data, error } = await adminClient
    .from('campus_locations')
    .select('id, name, short_name, latitude, longitude, building_type, floor_count, address')
    .order('name', { ascending: true });

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load campus locations.', error);
  }

  return (data ?? []) as CampusLocationRow[];
}

export async function fetchMapEventRows(
  adminClient: SupabaseClient,
  filters: MapEventFilters,
  viewerId?: string,
) {
  const { start, end } = buildTimeWindow(filters.timeFilter, filters.customRange);
  const queryText = normalizeSearchQuery(filters.searchQuery);

  let query = adminClient
    .from('events')
    .select(
      'id, title, description, club_id, organizer_id, organizer_name, organizer_ids, co_host_club_ids, category, location_name, location_id, location_details, latitude, longitude, starts_at, ends_at, recurrence_frequency, recurs_until, series_root_id, status, cover_image_url, attachments, tags, attendee_count, interested_count, max_capacity, waitlist_enabled, require_approval, is_free, ticket_price, visibility, contact_info, moderation_status, flagged_categories, created_at, updated_at',
    )
    .eq('moderation_status', 'approved')
    .neq('status', 'cancelled')
    .lte('starts_at', end.toISOString())
    .gte('ends_at', start.toISOString())
    .order('starts_at', { ascending: true });

  if ((filters.categories ?? []).length > 0) {
    query = query.in('category', filters.categories ?? []);
  }

  if (queryText) {
    const escaped = queryText.replace(/,/g, ' ');
    query = query.or(
      `title.ilike.%${escaped}%,location_name.ilike.%${escaped}%,description.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load map events.', error);
  }

  const rows = (data ?? []) as EventRow[];
  if (!viewerId) {
    return rows;
  }

  const approvedClubIds = await fetchApprovedClubIdsForUser(adminClient, viewerId);
  return rows.filter((event) => canUserAccessEvent(event, viewerId, approvedClubIds));
}

export async function fetchEventById(adminClient: SupabaseClient, eventId: string) {
  const { data, error } = await adminClient
    .from('events')
    .select(
      'id, title, description, club_id, organizer_id, organizer_name, organizer_ids, co_host_club_ids, category, location_name, location_id, location_details, latitude, longitude, starts_at, ends_at, recurrence_frequency, recurs_until, series_root_id, status, cover_image_url, attachments, tags, attendee_count, interested_count, max_capacity, waitlist_enabled, require_approval, is_free, ticket_price, visibility, contact_info, moderation_status, flagged_categories, created_at, updated_at',
    )
    .eq('id', eventId)
    .single();

  if (error || !data) {
    throw new HttpError(404, 'not_found', 'Event not found.', error ?? null);
  }

  return data as EventRow;
}

export async function fetchCurrentUserRsvp(
  adminClient: SupabaseClient,
  userId: string,
  eventId: string,
) {
  const { data, error } = await adminClient
    .from('event_rsvps')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load RSVP status.', error);
  }

  return (data?.status ?? null) as 'going' | 'interested' | null;
}

export async function fetchEventRsvpStats(adminClient: SupabaseClient, eventId: string) {
  const { data, error } = await adminClient
    .from('event_rsvps')
    .select('status')
    .eq('event_id', eventId);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load RSVP stats.', error);
  }

  const stats = { going: 0, interested: 0 };
  for (const row of (data ?? []) as Array<{ status: 'going' | 'interested' }>) {
    if (row.status === 'going') {
      stats.going += 1;
    } else if (row.status === 'interested') {
      stats.interested += 1;
    }
  }

  return stats;
}

export async function fetchFollowingIds(adminClient: SupabaseClient, userId: string) {
  const { data, error } = await adminClient
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load following relationships.', error);
  }

  return (data ?? []).map((row: { following_id: string }) => row.following_id);
}

export async function fetchFriendAttendingProfiles(
  adminClient: SupabaseClient,
  userId: string,
  eventId: string,
) {
  const followingIds = await fetchFollowingIds(adminClient, userId);
  if (followingIds.length === 0) {
    return [] as FeedAuthorSummary[];
  }

  const { data, error } = await adminClient
    .from('event_rsvps')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('status', 'going')
    .in('user_id', followingIds)
    .limit(8);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load friends attending.', error);
  }

  const friendIds = (data ?? []).map((row: { user_id: string }) => row.user_id);
  const usersById = await fetchUsersByIds(adminClient, friendIds);
  return friendIds
    .map((id) => usersById.get(id))
    .filter((value): value is FeedAuthorSummary => Boolean(value));
}

export async function fetchFriendAttendingEventIds(adminClient: SupabaseClient, userId: string) {
  const followingIds = await fetchFollowingIds(adminClient, userId);
  if (followingIds.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await adminClient
    .from('event_rsvps')
    .select('event_id')
    .eq('status', 'going')
    .in('user_id', followingIds);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load friend attendance data.', error);
  }

  return new Set((data ?? []).map((row: { event_id: string }) => row.event_id));
}

export async function fetchEventReportCount(adminClient: SupabaseClient, eventId: string) {
  const { count, error } = await adminClient
    .from('event_reports')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load event reports.', error);
  }

  return count ?? 0;
}

export async function searchCampusFallback(adminClient: SupabaseClient, query: string, viewerId?: string) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return [];
  }

  const [eventsResult, locationsResult] = await Promise.all([
    adminClient
      .from('events')
      .select('id, title, club_id, organizer_id, organizer_ids, visibility, location_name, latitude, longitude, starts_at')
      .eq('moderation_status', 'approved')
      .neq('status', 'cancelled')
      .or(`title.ilike.%${normalized}%,location_name.ilike.%${normalized}%`)
      .order('starts_at', { ascending: true })
      .limit(6),
    adminClient
      .from('campus_locations')
      .select('id, name, short_name, latitude, longitude, building_type')
      .or(`name.ilike.%${normalized}%,short_name.ilike.%${normalized}%`)
      .order('name', { ascending: true })
      .limit(6),
  ]);

  if (eventsResult.error) {
    throw new HttpError(500, 'internal_error', 'Unable to search events.', eventsResult.error);
  }

  if (locationsResult.error) {
    throw new HttpError(500, 'internal_error', 'Unable to search locations.', locationsResult.error);
  }

  const approvedClubIds =
    viewerId ? await fetchApprovedClubIdsForUser(adminClient, viewerId) : new Set<string>();

  const eventResults = ((eventsResult.data ?? []) as Array<{
    id: string;
    title: string;
    club_id: string | null;
    organizer_id: string;
    organizer_ids: string[] | null;
    visibility: 'public' | 'club_members_only';
    location_name: string;
    latitude: number;
    longitude: number;
    starts_at: string;
  }>)
    .filter((event) =>
      viewerId ? canUserAccessEvent(event, viewerId, approvedClubIds) : event.visibility !== 'club_members_only',
    )
    .map((event) => ({
    id: `event-${event.id}`,
    type: 'event' as const,
    title: event.title,
    subtitle: `${event.location_name} · ${new Date(event.starts_at).toLocaleString()}`,
    latitude: event.latitude,
    longitude: event.longitude,
    event_ids: [event.id],
    }));

  const locationResults = ((locationsResult.data ?? []) as Array<{
    id: string;
    name: string;
    short_name: string;
    latitude: number;
    longitude: number;
    building_type: string;
  }>).map((location) => ({
    id: `location-${location.id}`,
    type: 'location' as const,
    title: location.name,
    subtitle: `${location.short_name} · ${location.building_type}`,
    latitude: location.latitude,
    longitude: location.longitude,
    event_ids: [] as string[],
  }));

  return [...eventResults, ...locationResults];
}
