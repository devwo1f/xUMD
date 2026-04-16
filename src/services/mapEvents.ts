import { buildings } from '../assets/data/buildings';
import type {
  CampusLocation,
  Event,
  EventDetailPayload,
  EventReportReason,
  EventSearchResult,
} from '../shared/types';
import { getEventCatalog } from '../shared/stores/useEventCatalogStore';
import { ensureCurrentUserProfileRow } from './auth';
import { isSupabaseConfigured, supabase, supabaseConfigError } from './supabase';

export type RemoteMapTimeFilter =
  | 'all_today'
  | 'happening_now'
  | 'next_2_hours'
  | 'today'
  | 'this_week'
  | 'custom';

export type RemoteMapSort = 'soonest' | 'most_popular' | 'nearest_to_me';

export interface RemoteMapEventFilters {
  categories?: string[];
  timeFilter?: RemoteMapTimeFilter;
  sortBy?: RemoteMapSort;
  searchQuery?: string;
  customRange?: { start: string; end: string } | null;
  onlyFriendsAttending?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface MapEventsResponse {
  items: Event[];
  generatedAt: string;
  source: string;
}

export interface EventRsvpMutationInput {
  eventId: string;
  status?: 'going' | 'interested';
  action?: 'upsert' | 'remove';
}

export interface CreateMapEventInput {
  title: string;
  description: string;
  category: Event['category'];
  locationName?: string;
  locationId?: string | null;
  latitude: number;
  longitude: number;
  startsAt: string;
  endsAt: string;
  maxCapacity?: number | null;
  tags?: string[];
  coverImage?: {
    base64Data: string;
    fileName: string;
    mimeType: string;
  } | null;
}

function requireConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError);
  }
}

async function getFunctionErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: string;
      context?: {
        error?: { message?: string };
        json?: () => Promise<unknown>;
        text?: () => Promise<string>;
      } | null;
    };

    if (maybeError.context?.error?.message) {
      return maybeError.context.error.message;
    }

    if (typeof maybeError.context?.json === 'function') {
      try {
        const payload = await maybeError.context.json();
        if (
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          payload.error &&
          typeof payload.error === 'object' &&
          'message' in payload.error &&
          typeof payload.error.message === 'string'
        ) {
          return payload.error.message;
        }
      } catch {
        // Fall through to the next available error shape.
      }
    }

    if (typeof maybeError.context?.text === 'function') {
      try {
        const text = await maybeError.context.text();
        if (text.trim().length > 0) {
          return text;
        }
      } catch {
        // Fall through to the generic message.
      }
    }

    if (typeof maybeError.message === 'string' && maybeError.message.trim().length > 0) {
      return maybeError.message;
    }
  }

  return error instanceof Error ? error.message : 'Something went wrong.';
}

function mapEventRecord(record: Partial<Event> & Record<string, unknown>): Event {
  const locationName = String(record.location_name ?? record.location ?? '');
  const attendeeCount = Number(record.attendee_count ?? record.rsvp_count ?? 0);

  return {
    id: String(record.id),
    title: String(record.title ?? ''),
    description: String(record.description ?? ''),
    club_id: (record.club_id as string | null | undefined) ?? null,
    created_by: String(record.created_by ?? ''),
    organizer_name: String(record.organizer_name ?? 'xUMD'),
    category: record.category as Event['category'],
    starts_at: String(record.starts_at),
    ends_at: String(record.ends_at),
    status: (record.status as Event['status']) ?? 'upcoming',
    moderation_status: (record.moderation_status as Event['moderation_status']) ?? 'approved',
    location_name: locationName,
    location_id: (record.location_id as string | null | undefined) ?? null,
    latitude: Number(record.latitude ?? 0),
    longitude: Number(record.longitude ?? 0),
    image_url: (record.image_url as string | null | undefined) ?? null,
    rsvp_count: attendeeCount,
    attendee_count: attendeeCount,
    interested_count: Number(record.interested_count ?? 0),
    max_capacity: (record.max_capacity as number | null | undefined) ?? null,
    is_featured: Boolean(record.is_featured ?? false),
    tags: (record.tags as string[] | undefined) ?? [],
    location: locationName,
    created_at: String(record.created_at ?? new Date().toISOString()),
    updated_at: String(record.updated_at ?? record.created_at ?? new Date().toISOString()),
  };
}

function mapCampusLocationFromBuilding(): CampusLocation[] {
  return buildings.map((building) => ({
    id: building.id,
    name: building.name,
    short_name: building.code,
    latitude: building.latitude,
    longitude: building.longitude,
    building_type:
      building.building_type === 'library'
        ? 'library'
        : building.building_type === 'dining'
          ? 'dining'
          : building.building_type === 'recreation'
            ? 'recreation'
            : building.building_type === 'athletics'
              ? 'arena'
              : building.building_type === 'student_center'
                ? 'admin'
                : 'academic',
    floor_count: null,
    address: null,
  }));
}

function mapUserSummary(
  record:
    | {
        id: string;
        displayName?: string | null;
        avatarUrl?: string | null;
        major?: string | null;
        graduationYear?: number | null;
        bio?: string | null;
      }
    | null
    | undefined,
) {
  if (!record) {
    return null;
  }

  return {
    id: String(record.id),
    display_name: String(record.displayName ?? ''),
    avatar_url: record.avatarUrl ?? null,
    major: record.major ?? null,
    graduation_year: record.graduationYear ?? null,
    bio: record.bio ?? null,
  };
}

export function getFallbackCampusLocations() {
  return mapCampusLocationFromBuilding();
}

export async function fetchMapEventsRemote(filters: RemoteMapEventFilters = {}) {
  requireConfigured();

  const { data, error } = await supabase.functions.invoke('get-map-events', {
    body: filters,
  });

  if (error) {
    throw error;
  }

  const payload = data as { items: Array<Partial<Event> & Record<string, unknown>>; generatedAt: string; source: string };
  return {
    items: (payload.items ?? []).map(mapEventRecord),
    generatedAt: payload.generatedAt,
    source: payload.source,
  } satisfies MapEventsResponse;
}

export async function fetchMapEventDetailRemote(eventId: string) {
  requireConfigured();

  const { data, error } = await supabase.functions.invoke('get-event-detail', {
    body: { eventId },
  });

  if (error) {
    throw error;
  }

  const payload = data as Omit<EventDetailPayload, 'event'> & {
    event: Partial<Event> & Record<string, unknown>;
    organizer?: {
      id: string;
      displayName?: string | null;
      avatarUrl?: string | null;
      major?: string | null;
      graduationYear?: number | null;
      bio?: string | null;
    } | null;
    friends_attending?: Array<{
      id: string;
      displayName?: string | null;
      avatarUrl?: string | null;
      major?: string | null;
      graduationYear?: number | null;
      bio?: string | null;
    }>;
  };
  return {
    ...payload,
    event: mapEventRecord(payload.event),
    organizer: mapUserSummary(payload.organizer),
    friends_attending: (payload.friends_attending ?? [])
      .map((friend) => mapUserSummary(friend))
      .filter((friend): friend is NonNullable<ReturnType<typeof mapUserSummary>> => Boolean(friend)),
  } satisfies EventDetailPayload;
}

export async function submitEventRsvpRemote(input: EventRsvpMutationInput) {
  requireConfigured();

  const ensuredProfile = await ensureCurrentUserProfileRow();
  if (ensuredProfile.error) {
    throw new Error(ensuredProfile.error);
  }

  const { data, error } = await supabase.functions.invoke('rsvp-event', {
    body: input,
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  return data as {
    success: boolean;
    current_user_rsvp: 'going' | 'interested' | null;
    rsvp_stats: { going: number; interested: number };
  };
}

export async function reportMapEventRemote(input: {
  eventId: string;
  reason: EventReportReason;
  details?: string;
}) {
  requireConfigured();

  const { data, error } = await supabase.functions.invoke('report-event', {
    body: input,
  });

  if (error) {
    throw error;
  }

  return data as { success: boolean; reportCount: number; reviewTriggered: boolean };
}

export async function createMapEventRemote(input: CreateMapEventInput) {
  requireConfigured();

  const { data, error } = await supabase.functions.invoke('create-event', {
    body: input,
  });

  if (error) {
    throw error;
  }

  const payload = data as {
    event: Partial<Event> & Record<string, unknown>;
    snappedLocation: CampusLocation | null;
    moderationStatus: 'approved' | 'pending' | 'rejected';
  };

  return {
    ...payload,
    event: mapEventRecord(payload.event),
  };
}

export async function searchMapEventsRemote(query: string, limit = 8) {
  requireConfigured();

  const { data, error } = await supabase.functions.invoke('search-events', {
    body: { query, limit },
  });

  if (error) {
    throw error;
  }

  return (data as { items: EventSearchResult[] }).items ?? [];
}

export function getFallbackMapEvents() {
  return getEventCatalog();
}

export function buildFallbackEventDetail(eventId: string): EventDetailPayload | null {
  const event = getFallbackMapEvents().find((item) => item.id === eventId);
  if (!event) {
    return null;
  }

  return {
    event,
    organizer: null,
    campus_location: null,
    friends_attending: [],
    rsvp_stats: {
      going: event.attendee_count ?? event.rsvp_count,
      interested: event.interested_count ?? 0,
    },
    current_user_rsvp: null,
    reports_count: 0,
  };
}
