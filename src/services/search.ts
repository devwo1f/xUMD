import { CURRENT_SOCIAL_USER_ID } from '../features/social/data/mockSocialGraph';
import type {
  AutocompleteResponse,
  DiscoveryHubResponse,
  EventPreview,
  SearchEntityType,
  SearchResponse,
  SearchResult,
  UserPreview,
} from '../features/search/types';
import {
  buildLocalAutocomplete,
  buildLocalDiscoveryHub,
  buildLocalUnifiedSearch,
} from '../features/search/utils/localSearch';
import type { Event } from '../shared/types';
import { fetchMapEventsRemote } from './mapEvents';
import {
  fetchCurrentRemoteUserId,
  fetchRemoteRecommendations,
  fetchTrendingSnapshot,
} from './social';
import { isSupabaseConfigured, supabase } from './supabase';

interface UnifiedSearchRequest {
  query: string;
  page?: number;
  per_page?: number;
  entity_types?: SearchEntityType[];
}

interface AutocompleteRequest {
  query: string;
  limit?: number;
}

function isEventLive(event: Pick<Event, 'starts_at' | 'ends_at' | 'status'>) {
  if (event.status === 'live') {
    return true;
  }

  const now = Date.now();
  return new Date(event.starts_at).getTime() <= now && new Date(event.ends_at).getTime() > now;
}

function mapEventPreview(event: Event): EventPreview {
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    location_name: event.location_name,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    status: event.status ?? (isEventLive(event) ? 'live' : 'upcoming'),
    attendee_count: event.attendee_count ?? event.rsvp_count,
    cover_image_url: event.image_url,
    friends_going_count: 0,
    latitude: event.latitude,
    longitude: event.longitude,
  };
}

function mapRecommendationToResult(entry: Awaited<ReturnType<typeof fetchRemoteRecommendations>>[number]) {
  return {
    score: entry.score,
    match_reason: entry.reason,
    data: {
      id: entry.profile.id,
      username: entry.profile.username,
      display_name: entry.profile.displayName,
      avatar_url: entry.profile.avatarUrl,
      major: entry.profile.major,
      bio: entry.profile.bio,
      pronouns: entry.profile.pronouns ?? null,
      mutual_follow_count: 0,
      is_following: false,
    },
  } satisfies SearchResult<UserPreview>;
}

async function invokeSearchFunction<TRequest, TResponse>(name: string, body: TRequest) {
  const { data, error } = await supabase.functions.invoke(name, {
    body: body as Record<string, unknown>,
  });

  if (error) {
    throw error;
  }

  return data as TResponse;
}

export async function fetchAutocomplete(query: string, limit = 8): Promise<AutocompleteResponse> {
  const fallback = buildLocalAutocomplete(query, limit);
  if (!isSupabaseConfigured || query.trim().length < 2) {
    return fallback;
  }

  try {
    return await invokeSearchFunction<AutocompleteRequest, AutocompleteResponse>('search-autocomplete', {
      query,
      limit,
    });
  } catch {
    return fallback;
  }
}

export async function fetchUnifiedSearch(
  query: string,
  entityTypes?: SearchEntityType[],
): Promise<SearchResponse> {
  const fallback = buildLocalUnifiedSearch(query, CURRENT_SOCIAL_USER_ID);
  if (!isSupabaseConfigured || query.trim().length < 2) {
    return fallback;
  }

  try {
    return await invokeSearchFunction<UnifiedSearchRequest, SearchResponse>('unified-search', {
      query,
      entity_types: entityTypes,
    });
  } catch {
    return fallback;
  }
}

export async function fetchDiscoveryHub(): Promise<DiscoveryHubResponse> {
  const fallback = buildLocalDiscoveryHub(CURRENT_SOCIAL_USER_ID);

  if (!isSupabaseConfigured) {
    return fallback;
  }

  try {
    const viewerId = (await fetchCurrentRemoteUserId()) ?? CURRENT_SOCIAL_USER_ID;
    const [trendingEventsPayload, trendingSnapshot, recommendations] = await Promise.all([
      fetchMapEventsRemote({ timeFilter: 'today', sortBy: 'most_popular' }),
      fetchTrendingSnapshot(),
      fetchRemoteRecommendations(8),
    ]);

    const liveEvents = trendingEventsPayload.items
      .filter((event) => isEventLive(event))
      .sort((left, right) => (right.attendee_count ?? right.rsvp_count) - (left.attendee_count ?? left.rsvp_count))
      .slice(0, 4)
      .map((event) => ({ ...mapEventPreview(event), badge: 'LIVE' }));

    const trendingEvents = trendingEventsPayload.items
      .filter((event) => (event.status ?? 'upcoming') !== 'completed')
      .sort((left, right) => (right.attendee_count ?? right.rsvp_count) - (left.attendee_count ?? left.rsvp_count))
      .slice(0, 6)
      .map((event, index) => ({
        ...mapEventPreview(event),
        badge: index === 0 ? 'Trending' : isEventLive(event) ? 'Live' : 'Popular',
      }));

    return {
      trending_events: trendingEvents,
      trending_hashtags: trendingSnapshot.hashtags.map((entry) => ({
        hashtag: entry.tag,
        count: Math.max(1, Math.round(entry.score)),
        velocity: entry.score,
      })),
      live_events: liveEvents,
      people_you_may_know: recommendations.map(mapRecommendationToResult).map((entry) => ({
        ...entry,
        data: {
          ...entry.data,
          is_following: false,
        },
      })),
    };
  } catch {
    return fallback;
  }
}

