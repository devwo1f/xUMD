import { CURRENT_SOCIAL_USER_ID } from '../features/social/data/mockSocialGraph';
import type {
  AutocompleteResponse,
  DiscoveryHubResponse,
  EventPreview,
  ExtractedSearchFilters,
  SearchCategory,
  SearchEntityType,
  SearchIntent,
  SearchResponse,
  SearchResult,
  UnifiedSearchResponse,
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

export type { UnifiedSearchResponse } from '../features/search/types';

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

const SEARCH_CATEGORIES = new Set<SearchCategory>([
  'academic',
  'social',
  'sports',
  'club',
  'career',
  'arts',
  'food',
  'tech',
  'talks',
  'workshop',
  'party',
  'other',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSearchIntent(value: unknown): value is SearchIntent {
  return value === 'keyword' || value === 'semantic' || value === 'hybrid';
}

function isSearchEntityType(value: unknown): value is SearchEntityType {
  return value === 'person' || value === 'event' || value === 'club' || value === 'location';
}

function normalizeExtractedFilters(
  value: unknown,
  fallback: ExtractedSearchFilters | null,
): ExtractedSearchFilters | null {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    category:
      typeof value.category === 'string' && SEARCH_CATEGORIES.has(value.category as SearchCategory)
        ? (value.category as SearchCategory)
        : fallback?.category ?? null,
    timeframe:
      value.timeframe === 'now' ||
      value.timeframe === 'today' ||
      value.timeframe === 'tomorrow' ||
      value.timeframe === 'this_week'
        ? value.timeframe
        : fallback?.timeframe ?? null,
    cost: value.cost === 'free' ? 'free' : fallback?.cost ?? null,
    entity_type: isSearchEntityType(value.entity_type) ? value.entity_type : fallback?.entity_type ?? null,
    clean_query:
      typeof value.clean_query === 'string' && value.clean_query.trim().length > 0
        ? value.clean_query.trim()
        : fallback?.clean_query ?? '',
  };
}

function normalizeSearchResultArray<T>(
  value: unknown,
  fallback: SearchResult<T>[],
): SearchResult<T>[] {
  return Array.isArray(value) ? (value as SearchResult<T>[]) : fallback;
}

function normalizeAutocompleteResponse(
  value: unknown,
  fallback: AutocompleteResponse,
): AutocompleteResponse {
  if (!isRecord(value) || !Array.isArray(value.suggestions)) {
    return fallback;
  }

  return {
    suggestions: value.suggestions as AutocompleteResponse['suggestions'],
  };
}

function normalizeUnifiedSearchResponse(
  value: unknown,
  fallback: UnifiedSearchResponse,
): UnifiedSearchResponse {
  if (!isRecord(value)) {
    return fallback;
  }

  const results = isRecord(value.results) ? value.results : {};
  const totalCounts = isRecord(value.total_counts) ? value.total_counts : {};

  const people = normalizeSearchResultArray<UserPreview>(results.people, fallback.results.people);
  const events = normalizeSearchResultArray<EventPreview>(results.events, fallback.results.events);
  const clubs = normalizeSearchResultArray(results.clubs, fallback.results.clubs);
  const locations = normalizeSearchResultArray(results.locations, fallback.results.locations);

  return {
    query: typeof value.query === 'string' ? value.query : fallback.query,
    intent: isSearchIntent(value.intent) ? value.intent : fallback.intent,
    extracted_filters: normalizeExtractedFilters(value.extracted_filters, fallback.extracted_filters),
    results: {
      people,
      events,
      clubs,
      locations,
    },
    total_counts: {
      people: typeof totalCounts.people === 'number' ? totalCounts.people : people.length,
      events: typeof totalCounts.events === 'number' ? totalCounts.events : events.length,
      clubs: typeof totalCounts.clubs === 'number' ? totalCounts.clubs : clubs.length,
      locations: typeof totalCounts.locations === 'number' ? totalCounts.locations : locations.length,
    },
  };
}

async function resolveLocalSearchViewerId() {
  if (!isSupabaseConfigured) {
    return CURRENT_SOCIAL_USER_ID;
  }

  try {
    return (await fetchCurrentRemoteUserId()) ?? CURRENT_SOCIAL_USER_ID;
  } catch {
    return CURRENT_SOCIAL_USER_ID;
  }
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

async function invokeSearchFunction<TRequest>(name: string, body: TRequest) {
  const { data, error } = await supabase.functions.invoke(name, {
    body: body as Record<string, unknown>,
  });

  if (error) {
    throw error;
  }

  return data as unknown;
}

export async function fetchAutocomplete(query: string, limit = 8): Promise<AutocompleteResponse> {
  const viewerId = await resolveLocalSearchViewerId();
  const fallback = buildLocalAutocomplete(query, limit, viewerId);
  if (!isSupabaseConfigured || query.trim().length < 2) {
    return fallback;
  }

  try {
    const response = await invokeSearchFunction<AutocompleteRequest>('search-autocomplete', {
      query,
      limit,
    });
    return normalizeAutocompleteResponse(response, fallback);
  } catch {
    return fallback;
  }
}

export async function fetchUnifiedSearch(
  query: string,
  entityTypes?: SearchEntityType[],
): Promise<SearchResponse> {
  const viewerId = await resolveLocalSearchViewerId();
  const fallback = buildLocalUnifiedSearch(query, viewerId);
  if (!isSupabaseConfigured || query.trim().length < 2) {
    return fallback;
  }

  try {
    const response = await invokeSearchFunction<UnifiedSearchRequest>('unified-search', {
      query,
      entity_types: entityTypes,
    });
    return normalizeUnifiedSearchResponse(response, fallback);
  } catch {
    return fallback;
  }
}

export async function fetchDiscoveryHub(): Promise<DiscoveryHubResponse> {
  const viewerId = await resolveLocalSearchViewerId();
  const fallback = buildLocalDiscoveryHub(viewerId);

  if (!isSupabaseConfigured) {
    return fallback;
  }

  try {
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
