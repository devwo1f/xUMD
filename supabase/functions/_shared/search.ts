import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { HttpError } from './errors.ts';
import { getEnv } from './env.ts';
import { searchMeilisearch } from './meilisearch.ts';
import { getRedis } from './upstash.ts';

export type SearchIntent = 'keyword' | 'semantic' | 'hybrid';
export type SearchEntityType = 'person' | 'event' | 'club' | 'location';
export const SEARCH_CATEGORIES = [
  'academic',
  'social',
  'sports',
  'club',
  'career',
  'arts',
  'food',
  'workshop',
  'party',
  'other',
] as const;
export type SearchCategory = (typeof SEARCH_CATEGORIES)[number];

export interface ExtractedSearchFilters {
  category: SearchCategory | null;
  timeframe: 'now' | 'today' | 'tomorrow' | 'this_week' | null;
  cost: 'free' | null;
  entity_type: SearchEntityType | null;
  clean_query: string;
}

interface SearchRef {
  entityType: SearchEntityType;
  entityId: string;
  score: number;
  matchReason: string;
  semantic?: boolean;
}

interface HydratedUserPreview {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  major: string | null;
  bio: string | null;
  pronouns?: string | null;
  mutual_follow_count: number;
  is_following: boolean;
}

interface HydratedEventPreview {
  id: string;
  title: string;
  category: SearchCategory;
  location_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  attendee_count: number;
  cover_image_url: string | null;
  friends_going_count: number;
  latitude: number | null;
  longitude: number | null;
}

interface HydratedClubPreview {
  id: string;
  name: string;
  category: string;
  description: string;
  member_count: number;
  tags: string[];
  cover_image_url: string | null;
}

interface HydratedLocationPreview {
  id: string;
  name: string;
  short_name: string;
  building_type: string;
  active_event_count: number;
  latitude: number;
  longitude: number;
}

export interface UnifiedSearchResponse {
  query: string;
  intent: SearchIntent;
  extracted_filters: ExtractedSearchFilters | null;
  results: {
    people: Array<{ score: number; match_reason: string; data: HydratedUserPreview }>;
    events: Array<{ score: number; match_reason: string; data: HydratedEventPreview }>;
    clubs: Array<{ score: number; match_reason: string; data: HydratedClubPreview }>;
    locations: Array<{ score: number; match_reason: string; data: HydratedLocationPreview }>;
  };
  total_counts: {
    people: number;
    events: number;
    clubs: number;
    locations: number;
  };
}

export interface AutocompleteResponse {
  suggestions: Array<{
    type: SearchEntityType;
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    category_color?: string;
    latitude?: number;
    longitude?: number;
  }>;
}

const INTENT_PATTERNS = [
  /^i want to /,
  /^i('m| am) looking for /,
  /^looking for /,
  /^where can i /,
  /^how do i /,
  /^something (fun|chill|cool|interesting|social)/,
  /^i('m| am) (bored|lonely|stressed|hungry|free)/,
  /^things to do/,
  /^what('s| is) happening/,
  /^anything (about|related|near|for)/,
  /^i (need|like|love|enjoy|miss)/,
];

const VIBE_WORDS = ['chill', 'hype', 'fun', 'relaxing', 'exciting', 'social', 'study', 'creative', 'active', 'free food', 'meet people'];

const CATEGORY_KEYWORDS: Array<{ category: SearchCategory; keywords: string[] }> = [
  { category: 'academic', keywords: ['academic', 'study', 'class', 'course', 'lecture', 'library', 'cs'] },
  { category: 'social', keywords: ['social', 'hangout', 'friends', 'mixer'] },
  { category: 'sports', keywords: ['sports', 'game', 'athletics', 'fitness', 'basketball'] },
  { category: 'club', keywords: ['club', 'org', 'organization', 'association'] },
  { category: 'career', keywords: ['career', 'internship', 'resume', 'networking', 'mentor'] },
  { category: 'arts', keywords: ['arts', 'dance', 'concert', 'creative', 'music', 'photo'] },
  { category: 'food', keywords: ['food', 'free food', 'snack', 'breakfast', 'dining', 'lunch'] },
  { category: 'workshop', keywords: ['workshop', 'learn', 'training', 'build'] },
  { category: 'party', keywords: ['party', 'nightlife', 'dj', 'after dark'] },
];

function normalizeQuery(value: string) {
  return value.toLowerCase().replace(/[@#]/g, ' ').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferKeywordScore(index: number) {
  return Math.max(0.52, 1 - index * 0.08);
}

function mapSemanticEntityType(value: string): SearchEntityType | null {
  if (value === 'user') {
    return 'person';
  }
  if (value === 'event' || value === 'club') {
    return value;
  }
  return null;
}

function matchesEventTimeframe(startsAt: string, endsAt: string, timeframe: ExtractedSearchFilters['timeframe']) {
  if (!timeframe) {
    return true;
  }

  const now = new Date();
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (timeframe === 'now') {
    return start <= now && end > now;
  }
  if (timeframe === 'today') {
    return start.toDateString() === now.toDateString();
  }
  if (timeframe === 'tomorrow') {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return start.toDateString() === tomorrow.toDateString();
  }
  if (timeframe === 'this_week') {
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return start >= now && start <= nextWeek;
  }

  return true;
}

export function classifySearchIntent(query: string): SearchIntent {
  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();

  if (!trimmed) {
    return 'keyword';
  }

  if (INTENT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return 'semantic';
  }

  if (VIBE_WORDS.some((word) => normalized.includes(word) && normalized.split(' ').length <= 4)) {
    return 'semantic';
  }

  if (normalized.startsWith('@') || normalized.startsWith('#')) {
    return 'keyword';
  }

  if (trimmed.split(' ').length <= 2 && /^[A-Z]/.test(trimmed)) {
    return 'keyword';
  }

  return 'hybrid';
}

const SEARCH_FILTER_CACHE_TTL_SECONDS = 60 * 60;
const SEARCH_EMBEDDING_CACHE_TTL_SECONDS = 5 * 60;
const ANTHROPIC_MODEL = 'claude-3-5-haiku-latest';

async function createSearchCacheKey(prefix: string, query: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeQuery(query)));
  const hash = Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}:${hash}`;
}

function normalizeExtractedFilters(
  value: Partial<ExtractedSearchFilters> | null | undefined,
  fallback: ExtractedSearchFilters,
): ExtractedSearchFilters {
  const validTimeframes = new Set(['now', 'today', 'tomorrow', 'this_week']);
  const validEntityTypes = new Set(['person', 'event', 'club', 'location']);
  const validCategories = new Set<SearchCategory>(SEARCH_CATEGORIES);

  return {
    category:
      typeof value?.category === 'string' && validCategories.has(value.category as SearchCategory)
        ? (value.category as SearchCategory)
        : fallback.category,
    timeframe:
      typeof value?.timeframe === 'string' && validTimeframes.has(value.timeframe)
        ? (value.timeframe as ExtractedSearchFilters['timeframe'])
        : fallback.timeframe,
    cost: value?.cost === 'free' ? 'free' : fallback.cost,
    entity_type:
      typeof value?.entity_type === 'string' && validEntityTypes.has(value.entity_type)
        ? (value.entity_type as SearchEntityType)
        : fallback.entity_type,
    clean_query:
      typeof value?.clean_query === 'string' && value.clean_query.trim().length > 0
        ? value.clean_query.trim()
        : fallback.clean_query,
  };
}

async function fetchAnthropicExtractedFilters(query: string, fallback: ExtractedSearchFilters) {
  const env = getEnv();
  if (!env.anthropicApiKey) {
    return fallback;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 200,
      system:
        "Extract search filters from a campus app query. Return JSON only with category, timeframe, cost, entity_type, and clean_query. Use null for unknown values.",
      messages: [{ role: 'user', content: query }],
    }),
  });

  if (!response.ok) {
    return fallback;
  }

  const payload = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
  const text = payload.content?.find((entry) => entry.type === 'text')?.text;
  if (!text) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(text) as Partial<ExtractedSearchFilters>;
    return normalizeExtractedFilters(parsed, fallback);
  } catch {
    return fallback;
  }
}

export async function extractSearchFiltersWithCache(query: string): Promise<ExtractedSearchFilters> {
  const fallback = extractSearchFilters(query);
  const redis = getRedis();
  const cacheKey = redis ? await createSearchCacheKey('search_filters', query) : null;

  if (redis && cacheKey) {
    const cached = await redis.getJson<ExtractedSearchFilters>(cacheKey);
    if (cached) {
      return normalizeExtractedFilters(cached, fallback);
    }
  }

  const resolved = await fetchAnthropicExtractedFilters(query, fallback);

  if (redis && cacheKey) {
    await redis.setJson(cacheKey, resolved, SEARCH_FILTER_CACHE_TTL_SECONDS);
  }

  return resolved;
}

async function fetchCachedQueryEmbedding(query: string) {
  const redis = getRedis();
  const cacheKey = redis ? await createSearchCacheKey('search_embedding', query) : null;

  if (redis && cacheKey) {
    const cached = await redis.getJson<number[]>(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }
  }

  const embedding = await fetchQueryEmbedding(query);
  if (embedding && redis && cacheKey) {
    await redis.setJson(cacheKey, embedding, SEARCH_EMBEDDING_CACHE_TTL_SECONDS);
  }

  return embedding;
}
export function extractSearchFilters(query: string): ExtractedSearchFilters {
  const normalized = normalizeQuery(query);
  let category: SearchCategory | null = null;
  let timeframe: ExtractedSearchFilters['timeframe'] = null;
  let entityType: SearchEntityType | null = null;

  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      category = entry.category;
      break;
    }
  }

  if (/(happening now|right now|live|now)\b/.test(normalized)) {
    timeframe = 'now';
  } else if (/\btomorrow\b/.test(normalized)) {
    timeframe = 'tomorrow';
  } else if (/(this week|week)/.test(normalized)) {
    timeframe = 'this_week';
  } else if (/(today|tonight)/.test(normalized)) {
    timeframe = 'today';
  }

  if (normalized.startsWith('@')) {
    entityType = 'person';
  } else if (/\b(where is|building|library|hall|center|union)\b/.test(normalized)) {
    entityType = 'location';
  } else if (/\b(club|org|organization|team|association)\b/.test(normalized)) {
    entityType = 'club';
  } else if (/\b(person|people|follow|friend)\b/.test(normalized)) {
    entityType = 'person';
  } else if (/\b(event|happening|tonight|today|workshop|meetup)\b/.test(normalized)) {
    entityType = 'event';
  }

  const cleanQuery = normalizeQuery(
    normalized
      .replace(/^i want to\s+/, '')
      .replace(/^i('m| am) looking for\s+/, '')
      .replace(/^looking for\s+/, '')
      .replace(/^where can i\s+/, '')
      .replace(/^how do i\s+/, '')
      .replace(/\b(today|tomorrow|tonight|this week|right now|live|free|club|event|people|person|location|building)\b/g, ' '),
  );

  return {
    category,
    timeframe,
    cost: normalized.includes('free') ? 'free' : null,
    entity_type: entityType,
    clean_query: cleanQuery || normalized,
  };
}

async function searchUsersKeyword(adminClient: SupabaseClient, query: string, limit: number) {
  const meiliHits = await searchMeilisearch<Array<{ id: string }>>('users', query, limit);
  if (meiliHits.length > 0) {
    return meiliHits.map((hit, index) => ({ entityType: 'person' as const, entityId: hit.id, score: inferKeywordScore(index), matchReason: 'Name match' }));
  }

  const { data, error } = await adminClient
    .from('users')
    .select('id')
    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%,major.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to search users.', error);
  }

  return (data ?? []).map((row: { id: string }, index: number) => ({ entityType: 'person' as const, entityId: row.id, score: inferKeywordScore(index), matchReason: 'Name match' }));
}

async function searchEventsKeyword(adminClient: SupabaseClient, query: string, limit: number) {
  const meiliHits = await searchMeilisearch<Array<{ id: string }>>('campus_events', query, limit);
  if (meiliHits.length > 0) {
    return meiliHits.map((hit, index) => ({ entityType: 'event' as const, entityId: hit.id, score: inferKeywordScore(index), matchReason: 'Event title match' }));
  }

  const { data, error } = await adminClient
    .from('events')
    .select('id')
    .eq('moderation_status', 'approved')
    .neq('status', 'cancelled')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,location_name.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to search events.', error);
  }

  return (data ?? []).map((row: { id: string }, index: number) => ({ entityType: 'event' as const, entityId: row.id, score: inferKeywordScore(index), matchReason: 'Event title match' }));
}
async function searchClubsKeyword(adminClient: SupabaseClient, query: string, limit: number) {
  const meiliHits = await searchMeilisearch<Array<{ id: string }>>('clubs', query, limit);
  if (meiliHits.length > 0) {
    return meiliHits.map((hit, index) => ({ entityType: 'club' as const, entityId: hit.id, score: inferKeywordScore(index), matchReason: 'Club match' }));
  }

  const { data, error } = await adminClient
    .from('clubs')
    .select('id')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    return [] as SearchRef[];
  }

  return (data ?? []).map((row: { id: string }, index: number) => ({ entityType: 'club' as const, entityId: row.id, score: inferKeywordScore(index), matchReason: 'Club match' }));
}

async function searchLocationsKeyword(adminClient: SupabaseClient, query: string, limit: number) {
  const meiliHits = await searchMeilisearch<Array<{ id: string }>>('campus_locations', query, limit);
  if (meiliHits.length > 0) {
    return meiliHits.map((hit, index) => ({ entityType: 'location' as const, entityId: hit.id, score: inferKeywordScore(index), matchReason: 'Location match' }));
  }

  const { data, error } = await adminClient
    .from('campus_locations')
    .select('id')
    .or(`name.ilike.%${query}%,short_name.ilike.%${query}%,address.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to search campus locations.', error);
  }

  return (data ?? []).map((row: { id: string }, index: number) => ({ entityType: 'location' as const, entityId: row.id, score: inferKeywordScore(index), matchReason: 'Location match' }));
}

async function fetchQueryEmbedding(query: string) {
  const env = getEnv();
  if (!env.openAiApiKey) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json() as { data?: Array<{ embedding: number[] }> };
  return payload.data?.[0]?.embedding ?? null;
}

async function searchSemantic(adminClient: SupabaseClient, query: string, limit: number, entityTypes: SearchEntityType[]) {
  const embedding = await fetchQueryEmbedding(query);
  if (!embedding) {
    return [] as SearchRef[];
  }

  const vectorEntityTypes = entityTypes
    .filter((entityType) => entityType !== 'location')
    .map((entityType) => (entityType === 'person' ? 'user' : entityType));

  if (vectorEntityTypes.length === 0) {
    return [] as SearchRef[];
  }

  const { data, error } = await adminClient.rpc('semantic_search', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: limit,
    entity_types: vectorEntityTypes,
  });

  if (error) {
    return [] as SearchRef[];
  }

  return ((data ?? []) as Array<{ entity_type: string; entity_id: string; similarity: number }>)
    .map((row) => {
      const mappedType = mapSemanticEntityType(row.entity_type);
      if (!mappedType) {
        return null;
      }

      return {
        entityType: mappedType,
        entityId: row.entity_id,
        score: row.similarity,
        matchReason: 'Similar interests',
        semantic: true,
      } satisfies SearchRef;
    })
    .filter((value): value is SearchRef => Boolean(value));
}

function dedupeRefs(items: SearchRef[]) {
  const seen = new Set<string>();
  const deduped: SearchRef[] = [];

  for (const item of items.sort((left, right) => right.score - left.score)) {
    const key = `${item.entityType}:${item.entityId}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

async function fetchViewerFollowingIds(adminClient: SupabaseClient, userId: string) {
  const { data, error } = await adminClient.from('follows').select('following_id').eq('follower_id', userId);
  if (error) {
    return [] as string[];
  }
  return (data ?? []).map((row: { following_id: string }) => row.following_id);
}

async function hydrateUsers(adminClient: SupabaseClient, userId: string, refs: SearchRef[]) {
  if (refs.length === 0) {
    return [] as UnifiedSearchResponse['results']['people'];
  }

  const viewerFollowingIds = await fetchViewerFollowingIds(adminClient, userId);
  const viewerFollowingSet = new Set(viewerFollowingIds);
  const candidateIds = refs.map((ref) => ref.entityId);

  const [{ data: userRows }, { data: candidateFollowRows }] = await Promise.all([
    adminClient
      .from('users')
      .select('id, username, display_name, avatar_url, bio, major')
      .in('id', candidateIds),
    adminClient.from('follows').select('follower_id, following_id').in('follower_id', candidateIds),
  ]);

  const followingByCandidate = new Map<string, string[]>();
  for (const row of (candidateFollowRows ?? []) as Array<{ follower_id: string; following_id: string }>) {
    const current = followingByCandidate.get(row.follower_id) ?? [];
    current.push(row.following_id);
    followingByCandidate.set(row.follower_id, current);
  }

  const order = new Map(refs.map((ref, index) => [ref.entityId, index]));
  const byId = new Map(refs.map((ref) => [ref.entityId, ref]));

  return ((userRows ?? []) as Array<{ id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; major: string | null }> )
    .map((row) => {
      const ref = byId.get(row.id);
      const mutual = (followingByCandidate.get(row.id) ?? []).filter((candidateId) => viewerFollowingSet.has(candidateId)).length;
      return {
        score: ref?.score ?? 0,
        match_reason: ref?.matchReason ?? 'Name match',
        data: {
          id: row.id,
          username: row.username,
          display_name: row.display_name,
          avatar_url: row.avatar_url,
          major: row.major,
          bio: row.bio,
          mutual_follow_count: mutual,
          is_following: viewerFollowingSet.has(row.id),
        },
      };
    })
    .sort((left, right) => (order.get(left.data.id) ?? 0) - (order.get(right.data.id) ?? 0));
}

async function hydrateEvents(adminClient: SupabaseClient, userId: string, refs: SearchRef[], filters: ExtractedSearchFilters) {
  if (refs.length === 0) {
    return [] as UnifiedSearchResponse['results']['events'];
  }

  const followingIds = await fetchViewerFollowingIds(adminClient, userId);
  const eventIds = refs.map((ref) => ref.entityId);
  const [{ data: eventRows }, { data: friendRows }] = await Promise.all([
    adminClient
      .from('events')
      .select('id, title, category, location_name, starts_at, ends_at, status, attendee_count, cover_image_url, latitude, longitude')
      .in('id', eventIds)
      .eq('moderation_status', 'approved')
      .neq('status', 'cancelled'),
    followingIds.length > 0
      ? adminClient.from('event_rsvps').select('event_id').eq('status', 'going').in('user_id', followingIds).in('event_id', eventIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const friendCounts = new Map<string, number>();
  for (const row of (friendRows ?? []) as Array<{ event_id: string }>) {
    friendCounts.set(row.event_id, (friendCounts.get(row.event_id) ?? 0) + 1);
  }

  const order = new Map(refs.map((ref, index) => [ref.entityId, index]));
  const byId = new Map(refs.map((ref) => [ref.entityId, ref]));

  return ((eventRows ?? []) as Array<{ id: string; title: string; category: SearchCategory; location_name: string; starts_at: string; ends_at: string; status: string; attendee_count: number; cover_image_url: string | null; latitude: number | null; longitude: number | null }> )
    .filter((row) => (!filters.category || row.category === filters.category) && matchesEventTimeframe(row.starts_at, row.ends_at, filters.timeframe))
    .map((row) => {
      const ref = byId.get(row.id);
      const liveBoost = row.status === 'live' ? 0.15 : 0;
      return {
        score: (ref?.score ?? 0) + liveBoost + Math.min(0.1, (friendCounts.get(row.id) ?? 0) * 0.05),
        match_reason: ref?.matchReason ?? 'Event title match',
        data: {
          id: row.id,
          title: row.title,
          category: row.category,
          location_name: row.location_name,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          status: row.status,
          attendee_count: row.attendee_count,
          cover_image_url: row.cover_image_url,
          friends_going_count: friendCounts.get(row.id) ?? 0,
          latitude: row.latitude,
          longitude: row.longitude,
        },
      };
    })
    .sort((left, right) => (order.get(left.data.id) ?? 0) - (order.get(right.data.id) ?? 0));
}
async function hydrateClubs(adminClient: SupabaseClient, refs: SearchRef[]) {
  if (refs.length === 0) {
    return [] as UnifiedSearchResponse['results']['clubs'];
  }

  const clubIds = refs.map((ref) => ref.entityId);
  const { data, error } = await adminClient
    .from('clubs')
    .select('id, name, category, description, member_count, tags, cover_image_url, cover_url')
    .in('id', clubIds);

  if (error) {
    return [] as UnifiedSearchResponse['results']['clubs'];
  }

  const order = new Map(refs.map((ref, index) => [ref.entityId, index]));
  const byId = new Map(refs.map((ref) => [ref.entityId, ref]));

  return ((data ?? []) as Array<{ id: string; name: string; category: string; description: string; member_count: number; tags: string[] | null; cover_image_url: string | null; cover_url: string | null }> )
    .map((row) => ({
      score: (byId.get(row.id)?.score ?? 0) + Math.min(0.08, row.member_count / 2500),
      match_reason: byId.get(row.id)?.matchReason ?? 'Club match',
      data: {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description.length > 120 ? `${row.description.slice(0, 119).trimEnd()}...` : row.description,
        member_count: row.member_count,
        tags: row.tags ?? [],
        cover_image_url: row.cover_image_url ?? row.cover_url,
      },
    }))
    .sort((left, right) => (order.get(left.data.id) ?? 0) - (order.get(right.data.id) ?? 0));
}

async function hydrateLocations(adminClient: SupabaseClient, refs: SearchRef[]) {
  if (refs.length === 0) {
    return [] as UnifiedSearchResponse['results']['locations'];
  }

  const locationIds = refs.map((ref) => ref.entityId);
  const [{ data: locations }, { data: todaysEvents }] = await Promise.all([
    adminClient
      .from('campus_locations')
      .select('id, name, short_name, building_type, latitude, longitude')
      .in('id', locationIds),
    adminClient
      .from('events')
      .select('location_id')
      .eq('moderation_status', 'approved')
      .neq('status', 'cancelled')
      .gte('starts_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .lte('starts_at', new Date(new Date().setHours(23, 59, 59, 999)).toISOString()),
  ]);

  const counts = new Map<string, number>();
  for (const row of (todaysEvents ?? []) as Array<{ location_id: string | null }>) {
    if (!row.location_id) {
      continue;
    }
    counts.set(row.location_id, (counts.get(row.location_id) ?? 0) + 1);
  }

  const order = new Map(refs.map((ref, index) => [ref.entityId, index]));
  const byId = new Map(refs.map((ref) => [ref.entityId, ref]));

  return ((locations ?? []) as Array<{ id: string; name: string; short_name: string; building_type: string; latitude: number; longitude: number }> )
    .map((row) => ({
      score: byId.get(row.id)?.score ?? 0,
      match_reason: byId.get(row.id)?.matchReason ?? 'Location match',
      data: {
        id: row.id,
        name: row.name,
        short_name: row.short_name,
        building_type: row.building_type,
        active_event_count: counts.get(row.id) ?? 0,
        latitude: row.latitude,
        longitude: row.longitude,
      },
    }))
    .sort((left, right) => (order.get(left.data.id) ?? 0) - (order.get(right.data.id) ?? 0));
}

async function runKeywordSearch(adminClient: SupabaseClient, query: string, limit: number, entityTypes: SearchEntityType[]) {
  const normalized = query.trim();
  const searches: Array<Promise<SearchRef[]>> = [];

  if (entityTypes.includes('person')) searches.push(searchUsersKeyword(adminClient, normalized, limit));
  if (entityTypes.includes('event')) searches.push(searchEventsKeyword(adminClient, normalized, limit));
  if (entityTypes.includes('club')) searches.push(searchClubsKeyword(adminClient, normalized, limit));
  if (entityTypes.includes('location')) searches.push(searchLocationsKeyword(adminClient, normalized, limit));

  const resultSets = await Promise.all(searches);
  return dedupeRefs(resultSets.flat()).slice(0, limit * 3);
}

function pickEntityTypes(filters: ExtractedSearchFilters, explicit?: SearchEntityType[]) {
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  if (filters.entity_type) {
    return [filters.entity_type];
  }

  return ['person', 'event', 'club', 'location'] as SearchEntityType[];
}

export async function runUnifiedSearch(adminClient: SupabaseClient, userId: string, query: string, explicitTypes?: SearchEntityType[]) {
  const intent = classifySearchIntent(query);
  const extractedFilters = await extractSearchFiltersWithCache(query);
  const effectiveQuery = extractedFilters.clean_query || query.trim();
  const entityTypes = pickEntityTypes(extractedFilters, explicitTypes);

  const [keywordRefs, semanticRefs] = await Promise.all([
    intent === 'semantic' ? Promise.resolve([] as SearchRef[]) : runKeywordSearch(adminClient, effectiveQuery, 12, entityTypes),
    intent === 'keyword' ? Promise.resolve([] as SearchRef[]) : searchSemantic(adminClient, effectiveQuery, 12, entityTypes),
  ]);

  const merged = dedupeRefs([...keywordRefs, ...semanticRefs]);
  const refsByType = {
    people: merged.filter((ref) => ref.entityType === 'person'),
    events: merged.filter((ref) => ref.entityType === 'event'),
    clubs: merged.filter((ref) => ref.entityType === 'club'),
    locations: merged.filter((ref) => ref.entityType === 'location'),
  };

  const [people, events, clubs, locations] = await Promise.all([
    hydrateUsers(adminClient, userId, refsByType.people),
    hydrateEvents(adminClient, userId, refsByType.events, extractedFilters),
    hydrateClubs(adminClient, refsByType.clubs),
    hydrateLocations(adminClient, refsByType.locations),
  ]);

  return {
    query,
    intent,
    extracted_filters: extractedFilters,
    results: { people, events, clubs, locations },
    total_counts: {
      people: people.length,
      events: events.length,
      clubs: clubs.length,
      locations: locations.length,
    },
  } satisfies UnifiedSearchResponse;
}

export async function runSemanticSearch(
  adminClient: SupabaseClient,
  userId: string,
  query: string,
  explicitTypes?: SearchEntityType[],
) {
  const extractedFilters = await extractSearchFiltersWithCache(query);
  const effectiveQuery = extractedFilters.clean_query || query.trim();
  const entityTypes = pickEntityTypes(extractedFilters, explicitTypes);
  const refs = await searchSemantic(adminClient, effectiveQuery, 20, entityTypes);

  return {
    query,
    intent: 'semantic' as const,
    extracted_filters: extractedFilters,
    items: refs.map((ref) => ({
      entity_type: ref.entityType,
      entity_id: ref.entityId,
      score: ref.score,
      match_reason: ref.matchReason,
    })),
  };
}

export async function runAutocomplete(adminClient: SupabaseClient, query: string, limit = 8) {
  const refs = await runKeywordSearch(adminClient, query, limit, ['person', 'event', 'club', 'location']);
  const [people, events, clubs, locations] = await Promise.all([
    hydrateUsers(adminClient, '00000000-0000-0000-0000-000000000000', refs.filter((ref) => ref.entityType === 'person')),
    hydrateEvents(adminClient, '00000000-0000-0000-0000-000000000000', refs.filter((ref) => ref.entityType === 'event'), extractSearchFilters(query)),
    hydrateClubs(adminClient, refs.filter((ref) => ref.entityType === 'club')),
    hydrateLocations(adminClient, refs.filter((ref) => ref.entityType === 'location')),
  ]);

  const suggestions = [
    ...events.slice(0, 3).map((entry) => ({ type: 'event' as const, id: entry.data.id, title: entry.data.title, subtitle: `${entry.data.location_name} | ${entry.data.category}`, icon: 'calendar-outline', latitude: entry.data.latitude ?? undefined, longitude: entry.data.longitude ?? undefined })),
    ...clubs.slice(0, 2).map((entry) => ({ type: 'club' as const, id: entry.data.id, title: entry.data.name, subtitle: `${entry.data.category} | ${entry.data.member_count} members`, icon: 'people-outline' })),
    ...people.slice(0, 2).map((entry) => ({ type: 'person' as const, id: entry.data.id, title: entry.data.display_name, subtitle: `@${entry.data.username}${entry.data.mutual_follow_count > 0 ? ` | ${entry.data.mutual_follow_count} mutuals` : ''}`, icon: 'person-outline' })),
    ...locations.slice(0, 2).map((entry) => ({ type: 'location' as const, id: entry.data.id, title: entry.data.name, subtitle: `${entry.data.short_name} | ${entry.data.building_type}`, icon: 'location-outline', latitude: entry.data.latitude, longitude: entry.data.longitude })),
  ].slice(0, limit);

  return { suggestions } satisfies AutocompleteResponse;
}



