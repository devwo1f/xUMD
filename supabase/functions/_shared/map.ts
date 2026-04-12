import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { HttpError } from './errors.ts';
import type { FeedAuthorSummary } from './types.ts';
import { fetchUsersByIds } from './records.ts';
import type { UpstashRedis } from './upstash.ts';

export type MapTimeFilter =
  | 'all_today'
  | 'happening_now'
  | 'next_2_hours'
  | 'today'
  | 'this_week'
  | 'custom';

export type MapSortOption = 'soonest' | 'most_popular' | 'nearest_to_me';
export type EventRsvpStatus = 'going' | 'interested';

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface CustomRangeInput {
  start: string;
  end: string;
}

export interface MapEventFilters {
  categories?: string[];
  timeFilter?: MapTimeFilter;
  sortBy?: MapSortOption;
  searchQuery?: string;
  customRange?: CustomRangeInput | null;
  onlyFriendsAttending?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CampusLocationRow {
  id: string;
  name: string;
  short_name: string;
  latitude: number;
  longitude: number;
  building_type: string;
  floor_count: number | null;
  address: string | null;
}

export interface EventRow {
  id: string;
  title: string;
  description: string;
  club_id: string | null;
  organizer_id: string;
  organizer_name: string;
  category: string;
  location_name: string;
  location_id: string | null;
  latitude: number;
  longitude: number;
  starts_at: string;
  ends_at: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  cover_image_url: string | null;
  tags: string[] | null;
  attendee_count: number;
  interested_count: number;
  max_capacity: number | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  flagged_categories: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MapEventSummary {
  id: string;
  title: string;
  description: string;
  club_id: string | null;
  created_by: string;
  organizer_name: string;
  category: string;
  starts_at: string;
  ends_at: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  moderation_status: 'pending' | 'approved' | 'rejected';
  location_name: string;
  location_id: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  rsvp_count: number;
  attendee_count: number;
  interested_count: number;
  max_capacity: number | null;
  is_featured: boolean;
  tags: string[];
  location: string;
  created_at: string;
  updated_at: string;
  density: number;
  event_count_at_location: number;
}

export interface EventDetailResponse {
  event: MapEventSummary;
  organizer: FeedAuthorSummary | null;
  campus_location: CampusLocationRow | null;
  friends_attending: FeedAuthorSummary[];
  rsvp_stats: {
    going: number;
    interested: number;
  };
  current_user_rsvp: EventRsvpStatus | null;
  reports_count: number;
}

export interface MapSearchResult {
  id: string;
  type: 'event' | 'location';
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  event_ids: string[];
}

const DENSITY_RADIUS_METERS = 100;
const MAP_CACHE_VERSION_KEY = 'map-events:version';

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMeters(origin: MapCoordinate, destination: MapCoordinate) {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitudeRadians = toRadians(origin.latitude);
  const destinationLatitudeRadians = toRadians(destination.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitudeRadians) *
      Math.cos(destinationLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function buildTimeWindow(
  timeFilter: MapTimeFilter = 'today',
  customRange?: CustomRangeInput | null,
) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  switch (timeFilter) {
    case 'happening_now':
      return { start: now, end: now };
    case 'next_2_hours':
      return { start: now, end: new Date(now.getTime() + 2 * 60 * 60 * 1000) };
    case 'today':
      return { start: startOfToday, end: endOfToday };
    case 'this_week': {
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return { start: now, end };
    }
    case 'custom':
      if (!customRange?.start || !customRange?.end) {
        throw new HttpError(400, 'bad_request', 'Custom range requires start and end values.');
      }

      return {
        start: new Date(customRange.start),
        end: new Date(customRange.end),
      };
    case 'all_today':
    default:
      return { start: now, end: endOfToday };
  }
}

export function doesEventOverlapWindow(
  event: Pick<EventRow, 'starts_at' | 'ends_at'>,
  windowStart: Date,
  windowEnd: Date,
) {
  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);
  return startsAt <= windowEnd && endsAt >= windowStart;
}

export function getLocationGroupingKey(
  event: Pick<EventRow, 'location_name' | 'latitude' | 'longitude'>,
) {
  const normalizedLocation = event.location_name.trim().toLowerCase();
  if (normalizedLocation) {
    return normalizedLocation;
  }

  return `${event.latitude.toFixed(4)}:${event.longitude.toFixed(4)}`;
}

export function computeEventDensityMap(
  events: EventRow[],
  windowStart: Date,
  windowEnd: Date,
) {
  return new Map(
    events.map((event) => {
      const density = events.reduce((count, otherEvent) => {
        const withinRadius =
          distanceMeters(
            { latitude: event.latitude, longitude: event.longitude },
            { latitude: otherEvent.latitude, longitude: otherEvent.longitude },
          ) <= DENSITY_RADIUS_METERS;

        if (!withinRadius) {
          return count;
        }

        return doesEventOverlapWindow(otherEvent, windowStart, windowEnd) ? count + 1 : count;
      }, 0);

      return [event.id, Math.max(1, density)] as const;
    }),
  );
}

export function computeEventsPerLocation(events: EventRow[]) {
  const locationCounts = new Map<string, number>();

  for (const event of events) {
    const key = getLocationGroupingKey(event);
    locationCounts.set(key, (locationCounts.get(key) ?? 0) + 1);
  }

  return locationCounts;
}

export function toMapEventSummary(
  event: EventRow,
  options: {
    density?: number;
    eventCountAtLocation?: number;
    signedCoverUrl?: string | null;
  } = {},
): MapEventSummary {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    club_id: event.club_id,
    created_by: event.organizer_id,
    organizer_name: event.organizer_name,
    category: event.category,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    status: event.status,
    moderation_status: event.moderation_status,
    location_name: event.location_name,
    location_id: event.location_id,
    latitude: event.latitude,
    longitude: event.longitude,
    image_url: options.signedCoverUrl ?? event.cover_image_url,
    rsvp_count: event.attendee_count,
    attendee_count: event.attendee_count,
    interested_count: event.interested_count,
    max_capacity: event.max_capacity,
    is_featured: event.attendee_count >= 60 || event.interested_count >= 80,
    tags: event.tags ?? [],
    location: event.location_name,
    created_at: event.created_at,
    updated_at: event.updated_at,
    density: options.density ?? 1,
    event_count_at_location: options.eventCountAtLocation ?? 1,
  };
}

export function normalizeSearchQuery(query = '') {
  return query.trim().toLowerCase();
}

export function filterEventsInMemory(events: EventRow[], filters: MapEventFilters) {
  const query = normalizeSearchQuery(filters.searchQuery);
  const categories = filters.categories?.filter(Boolean) ?? [];
  const { start, end } = buildTimeWindow(filters.timeFilter, filters.customRange);

  return events.filter((event) => {
    if (event.moderation_status !== 'approved' || event.status === 'cancelled') {
      return false;
    }

    if (categories.length > 0 && !categories.includes(event.category)) {
      return false;
    }

    if (!doesEventOverlapWindow(event, start, end)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack =
      `${event.title} ${event.location_name} ${event.description} ${(event.tags ?? []).join(' ')}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function sortEventsInMemory(events: EventRow[], filters: MapEventFilters) {
  const origin =
    typeof filters.latitude === 'number' && typeof filters.longitude === 'number'
      ? { latitude: filters.latitude, longitude: filters.longitude }
      : null;

  return events.slice().sort((left, right) => {
    if (filters.sortBy === 'most_popular') {
      const leftScore = left.attendee_count + left.interested_count * 0.65;
      const rightScore = right.attendee_count + right.interested_count * 0.65;
      return rightScore - leftScore;
    }

    if (filters.sortBy === 'nearest_to_me' && origin) {
      const leftDistance = distanceMeters(origin, {
        latitude: left.latitude,
        longitude: left.longitude,
      });
      const rightDistance = distanceMeters(origin, {
        latitude: right.latitude,
        longitude: right.longitude,
      });
      return leftDistance - rightDistance;
    }

    return new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime();
  });
}

export async function buildMapEventsCacheKey(
  filters: MapEventFilters,
  redis: UpstashRedis | null,
) {
  const version =
    redis ? String((await redis.command<string | null>('GET', MAP_CACHE_VERSION_KEY)) ?? '0') : '0';
  const normalized = JSON.stringify({
    version,
    categories: [...(filters.categories ?? [])].sort(),
    timeFilter: filters.timeFilter ?? 'all_today',
    sortBy: filters.sortBy ?? 'soonest',
    searchQuery: normalizeSearchQuery(filters.searchQuery),
    customRange: filters.customRange ?? null,
    onlyFriendsAttending: Boolean(filters.onlyFriendsAttending),
    latitude:
      typeof filters.latitude === 'number' ? Number(filters.latitude.toFixed(5)) : null,
    longitude:
      typeof filters.longitude === 'number' ? Number(filters.longitude.toFixed(5)) : null,
  });

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const hash = Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 24);

  return `map-events:${hash}`;
}

export async function invalidateMapEventCaches(redis: UpstashRedis | null) {
  if (!redis) {
    return;
  }

  await redis.command('INCR', MAP_CACHE_VERSION_KEY);
}

export function findNearestCampusLocation(
  coordinate: MapCoordinate,
  locations: CampusLocationRow[],
  maxDistanceMeters = 50,
) {
  const nearest = locations
    .map((location) => ({
      location,
      distanceMeters: distanceMeters(coordinate, {
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    }))
    .sort((left, right) => left.distanceMeters - right.distanceMeters)[0];

  if (!nearest || nearest.distanceMeters > maxDistanceMeters) {
    return null;
  }

  return nearest;
}

export async function signEventCoverUrl(
  adminClient: SupabaseClient,
  coverImageUrl: string | null,
) {
  if (!coverImageUrl || /^https?:\/\//i.test(coverImageUrl)) {
    return coverImageUrl;
  }

  const { data, error } = await adminClient.storage
    .from('event-covers')
    .createSignedUrl(coverImageUrl, 60 * 60);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to sign the event cover image.', error);
  }

  return data?.signedUrl ?? coverImageUrl;
}

export async function buildEventDetailResponse(input: {
  adminClient: SupabaseClient;
  event: EventRow;
  campusLocation: CampusLocationRow | null;
  currentUserRsvp: EventRsvpStatus | null;
  rsvpStats: { going: number; interested: number };
  friendsAttending: FeedAuthorSummary[];
  reportCount: number;
  density: number;
  eventCountAtLocation: number;
}) {
  const usersById = await fetchUsersByIds(input.adminClient, [input.event.organizer_id]);
  const organizer = usersById.get(input.event.organizer_id) ?? null;
  const signedCoverUrl = await signEventCoverUrl(input.adminClient, input.event.cover_image_url);

  return {
    event: toMapEventSummary(input.event, {
      density: input.density,
      eventCountAtLocation: input.eventCountAtLocation,
      signedCoverUrl,
    }),
    organizer,
    campus_location: input.campusLocation,
    friends_attending: input.friendsAttending,
    rsvp_stats: input.rsvpStats,
    current_user_rsvp: input.currentUserRsvp,
    reports_count: input.reportCount,
  } satisfies EventDetailResponse;
}
