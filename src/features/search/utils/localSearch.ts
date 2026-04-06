import { addDays, endOfDay, format, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import { buildings } from '../../../assets/data/buildings';
import { mockClubs, mockClubEvents, mockUsers } from '../../../assets/data/mockClubs';
import { authorHandles, mockPosts } from '../../../assets/data/mockFeed';
import { mockCampusEvents } from '../../../assets/data/mockEvents';
import { EventCategory, type Event } from '../../../shared/types';
import {
  CURRENT_SOCIAL_USER_ID,
  initialFollowingByUser,
  socialProfiles,
} from '../../social/data/mockSocialGraph';
import type {
  AutocompleteResponse,
  AutocompleteSuggestion,
  ClubPreview,
  DiscoveryHubResponse,
  DiscoverySectionEvent,
  EventPreview,
  ExtractedSearchFilters,
  LocationPreview,
  SearchEntityType,
  SearchIntent,
  SearchResponse,
  SearchResult,
  UserPreview,
} from '../types';

const intentPatterns = [
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

const vibeWords = [
  'chill',
  'hype',
  'fun',
  'relaxing',
  'exciting',
  'social',
  'study',
  'creative',
  'active',
  'free food',
  'meet people',
  'dance',
  'music',
  'career',
  'fitness',
  'late night',
];

const semanticExpansions: Record<string, string[]> = {
  dance: ['dance', 'salsa', 'ballroom', 'music', 'social', 'arts'],
  food: ['food', 'dining', 'truck', 'snack', 'breakfast', 'free'],
  study: ['study', 'library', 'quiet', 'focus', 'academic', 'workshop'],
  career: ['career', 'internship', 'resume', 'networking', 'mentor'],
  fun: ['social', 'party', 'music', 'hangout', 'community'],
  chill: ['quiet', 'study', 'library', 'sunset', 'wellness'],
  sports: ['sports', 'game', 'athletics', 'basketball', 'fitness'],
  creative: ['arts', 'design', 'photo', 'music', 'performance'],
  people: ['community', 'social', 'club', 'friends'],
  coding: ['coding', 'hackathon', 'builders', 'cs', 'workshop'],
};

const categoryKeywordMap: Array<{ category: EventCategory; keywords: string[] }> = [
  { category: EventCategory.Academic, keywords: ['academic', 'study', 'class', 'course', 'cs', 'lecture', 'library'] },
  { category: EventCategory.Social, keywords: ['social', 'meet people', 'hangout', 'friends', 'mixer'] },
  { category: EventCategory.Sports, keywords: ['sports', 'game', 'athletics', 'fitness', 'basketball'] },
  { category: EventCategory.Club, keywords: ['club', 'org', 'organization', 'student org'] },
  { category: EventCategory.Career, keywords: ['career', 'internship', 'resume', 'networking', 'mentor'] },
  { category: EventCategory.Arts, keywords: ['arts', 'music', 'creative', 'concert', 'photo', 'dance'] },
  { category: EventCategory.Food, keywords: ['food', 'free food', 'snack', 'breakfast', 'dining', 'lunch'] },
  { category: EventCategory.Workshop, keywords: ['workshop', 'learn', 'build', 'training'] },
  { category: EventCategory.Party, keywords: ['party', 'nightlife', 'dj', 'after dark'] },
];

const categoryChipOrder: Array<{ label: string; category: EventCategory | null }> = [
  { label: 'Academic', category: EventCategory.Academic },
  { label: 'Social', category: EventCategory.Social },
  { label: 'Sports', category: EventCategory.Sports },
  { label: 'Club', category: EventCategory.Club },
  { label: 'Career', category: EventCategory.Career },
  { label: 'Arts', category: EventCategory.Arts },
  { label: 'Food', category: EventCategory.Food },
  { label: 'Workshop', category: EventCategory.Workshop },
  { label: 'Party', category: EventCategory.Party },
];

const clubTagsById: Record<string, string[]> = {
  'club-001': ['coding', 'hackathon', 'builders', 'startup', 'workshop'],
  'club-002': ['racing', 'engineering', 'maker', 'competition'],
  'club-003': ['outdoors', 'hiking', 'camping', 'social'],
  'club-004': ['government', 'leadership', 'community', 'policy'],
  'club-005': ['music', 'performance', 'arts', 'creative'],
  'club-006': ['culture', 'food', 'community', 'social'],
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[@#]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function intersects(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.some((value) => rightSet.has(value));
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function extractHashtags(value: string) {
  return Array.from(value.matchAll(/#([A-Za-z0-9_]+)/g)).map((match) => match[1].toLowerCase());
}

function getEventStatus(event: Event): NonNullable<Event['status']> {
  if (event.status) {
    if (event.status === 'cancelled') {
      return 'cancelled';
    }
    if (event.status === 'completed') {
      return 'completed';
    }
  }

  const now = new Date();
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);

  if (isBefore(now, start)) {
    return 'upcoming';
  }

  if (isAfter(now, end)) {
    return 'completed';
  }

  return 'live';
}

function formatEventSubtitle(event: Event) {
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);

  if (isSameDay(start, new Date())) {
    return `Today ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')} | ${event.location_name}`;
  }

  return `${format(start, 'EEE h:mm a')} | ${event.location_name}`;
}

function buildPeopleDataset() {
  const socialPeople = Object.values(socialProfiles).map((profile) => ({
    id: profile.id,
    username: profile.username,
    display_name: profile.displayName,
    avatar_url: profile.avatarUrl,
    major: profile.major,
    bio: profile.bio,
    pronouns: profile.pronouns ?? null,
    clubs: profile.clubIds,
    interests: profile.interests,
  }));

  const clubPeople = mockUsers.map((user) => ({
    id: user.id,
    username: user.username || user.email.split('@')[0],
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    major: user.major,
    bio: user.bio ?? '',
    pronouns: null,
    clubs: [],
    interests: user.courses ?? [],
  }));

  const merged = [...socialPeople];
  const existingIds = new Set(merged.map((person) => person.id));
  for (const person of clubPeople) {
    if (!existingIds.has(person.id)) {
      merged.push(person);
    }
  }

  return merged;
}

function buildClubPreview(club: (typeof mockClubs)[number]): ClubPreview {
  return {
    id: club.id,
    name: club.name,
    category: club.category,
    description: truncate(club.short_description || club.description, 120),
    member_count: club.member_count,
    tags: clubTagsById[club.id] ?? [club.category],
    cover_image_url: club.cover_url,
  };
}

function buildEventPreview(event: Event): EventPreview {
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    location_name: event.location_name,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    status: getEventStatus(event),
    attendee_count: event.attendee_count ?? event.rsvp_count,
    cover_image_url: event.image_url,
    friends_going_count: 0,
    latitude: event.latitude,
    longitude: event.longitude,
  };
}

function buildLocationPreview(building: (typeof buildings)[number], events: Event[]): LocationPreview {
  const activeEventCount = events.filter((event) => {
    const eventLocation = normalizeText(event.location_name);
    const buildingName = normalizeText(building.name);
    const buildingCode = normalizeText(building.code);
    return eventLocation.includes(buildingName) || eventLocation.includes(buildingCode);
  }).length;

  return {
    id: building.id,
    name: building.name,
    short_name: building.code,
    building_type: building.building_type,
    active_event_count: activeEventCount,
    latitude: building.latitude,
    longitude: building.longitude,
  };
}

function getViewerFollowingIds(viewerId: string) {
  return initialFollowingByUser[viewerId] ?? [];
}

function getMutualFollowCount(targetId: string, viewerId: string) {
  const viewerFollowing = getViewerFollowingIds(viewerId);
  const targetFollowing = getViewerFollowingIds(targetId);
  const targetSet = new Set(targetFollowing);
  return viewerFollowing.filter((candidate) => targetSet.has(candidate)).length;
}

function buildUserPreview(person: ReturnType<typeof buildPeopleDataset>[number], viewerId: string): UserPreview {
  return {
    id: person.id,
    username: person.username,
    display_name: person.display_name,
    avatar_url: person.avatar_url,
    major: person.major,
    bio: person.bio,
    pronouns: person.pronouns,
    mutual_follow_count: getMutualFollowCount(person.id, viewerId),
    is_following: getViewerFollowingIds(viewerId).includes(person.id),
  };
}

function keywordScore(query: string, fields: string[]) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const queryTokens = tokenize(normalizedQuery);
  let score = 0;

  for (const field of fields) {
    const normalizedField = normalizeText(field);
    if (!normalizedField) {
      continue;
    }

    if (normalizedField === normalizedQuery) {
      score = Math.max(score, 1);
      continue;
    }

    if (normalizedField.startsWith(normalizedQuery)) {
      score = Math.max(score, 0.92);
    }

    if (normalizedField.includes(normalizedQuery)) {
      score = Math.max(score, 0.82);
    }

    const fieldTokens = tokenize(normalizedField);
    const overlap = queryTokens.filter((token) => fieldTokens.includes(token)).length;
    if (overlap > 0) {
      score = Math.max(score, Math.min(0.74, overlap / Math.max(queryTokens.length, 1)));
    }
  }

  return score;
}

function expandSemanticTokens(query: string) {
  const rawTokens = tokenize(query);
  const expanded = [...rawTokens];
  for (const token of rawTokens) {
    expanded.push(...(semanticExpansions[token] ?? []));
  }
  return unique(expanded);
}

function semanticScore(query: string, fields: string[]) {
  const expandedTokens = expandSemanticTokens(query);
  if (expandedTokens.length === 0) {
    return 0;
  }

  const fieldTokens = unique(fields.flatMap((field) => tokenize(field)));
  const overlap = expandedTokens.filter((token) => fieldTokens.includes(token)).length;
  return overlap === 0 ? 0 : Math.min(0.86, overlap / Math.max(expandedTokens.length, 1) * 1.6);
}

function matchReasonForKeyword(kind: SearchEntityType) {
  switch (kind) {
    case 'person':
      return 'Name match';
    case 'event':
      return 'Event title match';
    case 'club':
      return 'Club match';
    case 'location':
      return 'Location match';
    default:
      return 'Match';
  }
}

function matchReasonForSemantic(kind: SearchEntityType, query: string) {
  switch (kind) {
    case 'person':
      return `Similar interests to ${query}`;
    case 'event':
      return `Fits the vibe of "${query}"`;
    case 'club':
      return `Related to ${query}`;
    case 'location':
      return `Helpful for ${query}`;
    default:
      return `Related to ${query}`;
  }
}

export function classifySearchIntent(query: string): SearchIntent {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return 'keyword';
  }

  if (intentPatterns.some((pattern) => pattern.test(trimmed))) {
    return 'semantic';
  }

  if (vibeWords.some((word) => trimmed.includes(word) && trimmed.split(' ').length <= 4)) {
    return 'semantic';
  }

  if (trimmed.startsWith('@')) {
    return 'keyword';
  }

  if (trimmed.startsWith('#')) {
    return 'keyword';
  }

  if (query.trim().split(' ').length <= 2 && /^[A-Z]/.test(query.trim())) {
    return 'keyword';
  }

  return 'hybrid';
}

export function extractSearchFilters(query: string): ExtractedSearchFilters {
  const normalized = normalizeText(query);
  let category: EventCategory | null = null;
  let timeframe: ExtractedSearchFilters['timeframe'] = null;
  let entityType: SearchEntityType | null = null;
  let cost: 'free' | null = normalized.includes('free') ? 'free' : null;

  for (const entry of categoryKeywordMap) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      category = entry.category;
      break;
    }
  }

  if (/(happening now|right now|live|now)\b/.test(normalized)) {
    timeframe = 'now';
  } else if (/\btomorrow\b/.test(normalized)) {
    timeframe = 'tomorrow';
  } else if (/(this week|next few days|week)/.test(normalized)) {
    timeframe = 'this_week';
  } else if (/(today|tonight|later today)/.test(normalized)) {
    timeframe = 'today';
  }

  if (normalized.startsWith('@')) {
    entityType = 'person';
  } else if (normalized.startsWith('#')) {
    entityType = 'event';
  } else if (/\b(where is|find|building|library|hall|center|union)\b/.test(normalized)) {
    entityType = 'location';
  } else if (/\b(club|org|organization|team|association)\b/.test(normalized)) {
    entityType = 'club';
  } else if (/\b(person|people|friend|follow)\b/.test(normalized)) {
    entityType = 'person';
  } else if (/\b(event|happening|tonight|today|meetup|workshop)\b/.test(normalized)) {
    entityType = 'event';
  }

  const cleanQuery = normalizeText(
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
    cost,
    entity_type: entityType,
    clean_query: cleanQuery || normalized,
  };
}

function matchesTimeframe(event: Event, timeframe: ExtractedSearchFilters['timeframe']) {
  if (!timeframe) {
    return true;
  }

  const now = new Date();
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);

  switch (timeframe) {
    case 'now':
      return isBefore(start, now) && isAfter(end, now);
    case 'today':
      return isSameDay(start, now);
    case 'tomorrow':
      return isSameDay(start, addDays(now, 1));
    case 'this_week': {
      const endOfWindow = endOfDay(addDays(now, 7));
      return isAfter(start, startOfDay(now)) && isBefore(start, endOfWindow);
    }
    default:
      return true;
  }
}

function getEventCorpus(event: Event) {
  return [
    event.title,
    event.description,
    event.location_name,
    event.organizer_name ?? '',
    ...(event.tags ?? []),
    event.category,
  ];
}

function getClubCorpus(club: (typeof mockClubs)[number]) {
  return [club.name, club.short_description, club.description, ...(clubTagsById[club.id] ?? []), club.category];
}

function getLocationCorpus(location: (typeof buildings)[number]) {
  return [location.name, location.code, location.description, location.building_type];
}

function getPeopleCorpus(person: ReturnType<typeof buildPeopleDataset>[number]) {
  return [person.display_name, person.username, person.bio ?? '', person.major ?? '', ...(person.interests ?? []), ...(person.clubs ?? [])];
}

function buildPeopleResults(query: string, intent: SearchIntent, viewerId: string) {
  const people = buildPeopleDataset();
  const results: SearchResult<UserPreview>[] = [];

  for (const person of people) {
    const keyword = keywordScore(query, getPeopleCorpus(person));
    const semantic = intent === 'keyword' ? 0 : semanticScore(query, getPeopleCorpus(person));
    const score = Math.max(keyword, semantic * 0.92) + Math.min(0.2, getMutualFollowCount(person.id, viewerId) * 0.05);
    if (score < 0.3) {
      continue;
    }

    results.push({
      score,
      semantic: semantic > keyword,
      match_reason: semantic > keyword ? matchReasonForSemantic('person', query) : matchReasonForKeyword('person'),
      data: buildUserPreview(person, viewerId),
    });
  }

  return results.sort((left, right) => right.score - left.score).slice(0, 12);
}

function buildEventResults(query: string, intent: SearchIntent, filters: ExtractedSearchFilters) {
  const events = unique([...mockCampusEvents, ...mockClubEvents].map((event) => event.id))
    .map((eventId) => [...mockCampusEvents, ...mockClubEvents].find((event) => event.id === eventId))
    .filter((event): event is Event => Boolean(event));

  const results: SearchResult<EventPreview>[] = [];

  for (const event of events) {
    if (filters.category && event.category !== filters.category) {
      continue;
    }

    if (!matchesTimeframe(event, filters.timeframe)) {
      continue;
    }

    const corpus = getEventCorpus(event);
    const keyword = keywordScore(query, corpus.concat(extractHashtags(event.description)));
    const semantic = intent === 'keyword' ? 0 : semanticScore(query, corpus);
    const liveBoost = getEventStatus(event) === 'live' ? 0.15 : 0;
    const recencyBoost = Math.max(0, 0.12 - Math.abs(new Date(event.starts_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 10));
    const score = Math.max(keyword, semantic * 0.9) + liveBoost + recencyBoost;
    if (score < 0.28) {
      continue;
    }

    results.push({
      score,
      semantic: semantic > keyword,
      match_reason: semantic > keyword ? matchReasonForSemantic('event', query) : matchReasonForKeyword('event'),
      data: buildEventPreview(event),
    });
  }

  return results.sort((left, right) => right.score - left.score).slice(0, 12);
}

function buildClubResults(query: string, intent: SearchIntent) {
  const results: SearchResult<ClubPreview>[] = [];

  for (const club of mockClubs) {
    const corpus = getClubCorpus(club);
    const keyword = keywordScore(query, corpus);
    const semantic = intent === 'keyword' ? 0 : semanticScore(query, corpus);
    const score = Math.max(keyword, semantic * 0.9) + Math.min(0.12, club.member_count / 4000);
    if (score < 0.25) {
      continue;
    }

    results.push({
      score,
      semantic: semantic > keyword,
      match_reason: semantic > keyword ? matchReasonForSemantic('club', query) : matchReasonForKeyword('club'),
      data: buildClubPreview(club),
    });
  }

  return results.sort((left, right) => right.score - left.score).slice(0, 12);
}

function buildLocationResults(query: string) {
  const events = [...mockCampusEvents, ...mockClubEvents];
  const results: SearchResult<LocationPreview>[] = [];

  for (const building of buildings) {
    const score = keywordScore(query, getLocationCorpus(building));
    if (score < 0.24) {
      continue;
    }

    results.push({
      score,
      match_reason: matchReasonForKeyword('location'),
      data: buildLocationPreview(building, events),
    });
  }

  return results.sort((left, right) => right.score - left.score).slice(0, 12);
}

function flattenToSuggestions(results: SearchResponse, limit: number) {
  const buckets: Record<SearchEntityType, AutocompleteSuggestion[]> = {
    event: results.results.events.slice(0, 3).map((entry) => ({
      type: 'event',
      id: entry.data.id,
      title: entry.data.title,
      subtitle: formatEventSubtitle({
        id: entry.data.id,
        title: entry.data.title,
        description: '',
        club_id: null,
        created_by: '',
        category: entry.data.category as EventCategory,
        starts_at: entry.data.starts_at,
        ends_at: entry.data.ends_at,
        location_name: entry.data.location_name,
        latitude: entry.data.latitude,
        longitude: entry.data.longitude,
        image_url: entry.data.cover_image_url,
        rsvp_count: entry.data.attendee_count,
        attendee_count: entry.data.attendee_count,
        max_capacity: null,
        is_featured: false,
      }),
      icon: 'calendar-outline',
      category_color: undefined,
      latitude: entry.data.latitude ?? undefined,
      longitude: entry.data.longitude ?? undefined,
    })),
    club: results.results.clubs.slice(0, 2).map((entry) => ({
      type: 'club',
      id: entry.data.id,
      title: entry.data.name,
      subtitle: `${entry.data.category} | ${entry.data.member_count} members`,
      icon: 'people-outline',
    })),
    person: results.results.people.slice(0, 2).map((entry) => ({
      type: 'person',
      id: entry.data.id,
      title: entry.data.display_name,
      subtitle: `@${entry.data.username}${entry.data.mutual_follow_count > 0 ? ` | ${entry.data.mutual_follow_count} mutuals` : ''}`,
      icon: 'person-outline',
    })),
    location: results.results.locations.slice(0, 2).map((entry) => ({
      type: 'location',
      id: entry.data.id,
      title: entry.data.name,
      subtitle: `${entry.data.short_name} | ${entry.data.building_type}`,
      icon: 'location-outline',
      latitude: entry.data.latitude,
      longitude: entry.data.longitude,
    })),
  };

  const orderedTypes = (Object.entries(buckets) as Array<[SearchEntityType, AutocompleteSuggestion[]]>)
    .sort((left, right) => right[1].length - left[1].length)
    .map(([type]) => type);

  const suggestions: AutocompleteSuggestion[] = [];
  for (const type of orderedTypes) {
    suggestions.push(...buckets[type]);
  }

  return suggestions.slice(0, limit);
}

function buildPeopleRecommendations(viewerId: string) {
  const viewer = socialProfiles[viewerId];
  const following = new Set(getViewerFollowingIds(viewerId));

  if (!viewer) {
    return [] as SearchResult<UserPreview>[];
  }

  return Object.values(socialProfiles)
    .filter((profile) => profile.id !== viewerId && !following.has(profile.id))
    .map((profile) => {
      const sharedClubs = profile.clubIds.filter((clubId) => viewer.clubIds.includes(clubId)).length;
      const sharedInterests = profile.interests.filter((interest) => viewer.interests.includes(interest)).length;
      const mutual = getMutualFollowCount(profile.id, viewerId);
      const score = sharedClubs * 0.35 + sharedInterests * 0.2 + mutual * 0.15 + (profile.major && viewer.major === profile.major ? 0.18 : 0);
      return {
        score,
        match_reason:
          mutual > 0
            ? `${mutual} mutual${mutual === 1 ? '' : 's'} in your orbit`
            : sharedClubs > 0
              ? 'Common clubs on campus'
              : sharedInterests > 0
                ? 'Similar interests'
                : 'Worth knowing on campus',
        data: buildUserPreview(
          {
            id: profile.id,
            username: profile.username,
            display_name: profile.displayName,
            avatar_url: profile.avatarUrl,
            major: profile.major,
            bio: profile.bio,
            pronouns: profile.pronouns ?? null,
            clubs: profile.clubIds,
            interests: profile.interests,
          },
          viewerId,
        ),
      } satisfies SearchResult<UserPreview>;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);
}

function buildTrendingHashtags() {
  const counts = new Map<string, number>();
  for (const post of mockPosts) {
    for (const tag of unique([...(post.hashtags ?? []), ...extractHashtags(post.content)])) {
      counts.set(tag, (counts.get(tag) ?? 0) + 2);
    }
  }

  for (const event of mockCampusEvents) {
    for (const tag of event.tags ?? []) {
      counts.set(tag.toLowerCase(), (counts.get(tag.toLowerCase()) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([hashtag, count]) => ({ hashtag, count, velocity: Number((count * 1.35).toFixed(2)) }))
    .sort((left, right) => right.velocity - left.velocity)
    .slice(0, 10);
}

export function buildLocalDiscoveryHub(viewerId = CURRENT_SOCIAL_USER_ID): DiscoveryHubResponse {
  const allEvents = [...mockCampusEvents, ...mockClubEvents].map(buildEventPreview);
  const liveEvents = allEvents
    .filter((event) => event.status === 'live')
    .sort((left, right) => right.attendee_count - left.attendee_count)
    .slice(0, 4)
    .map((event) => ({ ...event, badge: 'LIVE' })) satisfies DiscoverySectionEvent[];

  const trendingEvents = allEvents
    .filter((event) => event.status !== 'completed')
    .sort((left, right) => right.attendee_count - left.attendee_count)
    .slice(0, 6)
    .map((event, index) => ({
      ...event,
      badge: index === 0 ? 'Trending' : event.status === 'live' ? 'Live' : 'Popular',
    })) satisfies DiscoverySectionEvent[];

  return {
    trending_events: trendingEvents,
    trending_hashtags: buildTrendingHashtags(),
    live_events: liveEvents,
    people_you_may_know: buildPeopleRecommendations(viewerId),
  };
}

export function buildLocalUnifiedSearch(query: string, viewerId = CURRENT_SOCIAL_USER_ID): SearchResponse {
  const extractedFilters = extractSearchFilters(query);
  const intent = classifySearchIntent(query);
  const effectiveQuery = extractedFilters.clean_query || query.trim();

  const people = extractedFilters.entity_type && extractedFilters.entity_type !== 'person'
    ? []
    : buildPeopleResults(effectiveQuery, intent, viewerId);
  const events = extractedFilters.entity_type && extractedFilters.entity_type !== 'event'
    ? []
    : buildEventResults(effectiveQuery, intent, extractedFilters);
  const clubs = extractedFilters.entity_type && extractedFilters.entity_type !== 'club'
    ? []
    : buildClubResults(effectiveQuery, intent);
  const locations = extractedFilters.entity_type && extractedFilters.entity_type !== 'location'
    ? []
    : buildLocationResults(effectiveQuery);

  return {
    query,
    intent,
    extracted_filters: extractedFilters,
    results: {
      people,
      events,
      clubs,
      locations,
    },
    total_counts: {
      people: people.length,
      events: events.length,
      clubs: clubs.length,
      locations: locations.length,
    },
  };
}

export function buildLocalAutocomplete(
  query: string,
  limit = 8,
  viewerId = CURRENT_SOCIAL_USER_ID,
): AutocompleteResponse {
  if (query.trim().length < 2) {
    return { suggestions: [] };
  }

  const search = buildLocalUnifiedSearch(query, viewerId);
  return {
    suggestions: flattenToSuggestions(search, limit),
  };
}

export function getBrowseCategoryQueries() {
  return categoryChipOrder;
}

export function getRecentSearchSuggestions() {
  return [
    'free food today',
    'mckeldin',
    'bitcamp',
    '@fearTheTurtle',
    'something fun tonight',
  ];
}

export function getHashtagSearchQueries() {
  return buildTrendingHashtags().slice(0, 6).map((entry) => `#${entry.hashtag}`);
}

export function getSearchMapLocationById(locationId: string) {
  return buildings.find((building) => building.id === locationId) ?? null;
}

export function getSearchEventById(eventId: string) {
  return [...mockCampusEvents, ...mockClubEvents].find((event) => event.id === eventId) ?? null;
}

export function getPeopleSubtitle(user: UserPreview) {
  const handle = `@${user.username}`;
  if (user.mutual_follow_count > 0) {
    return `${handle} | ${user.mutual_follow_count} mutual${user.mutual_follow_count === 1 ? '' : 's'}`;
  }

  if (user.major) {
    return `${handle} | ${user.major}`;
  }

  return handle;
}

export function getEventContextLabel(event: EventPreview) {
  if (event.status === 'live') {
    return 'Happening now';
  }

  return formatEventSubtitle({
    id: event.id,
    title: event.title,
    description: '',
    club_id: null,
    created_by: '',
    category: event.category as EventCategory,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    location_name: event.location_name,
    latitude: event.latitude,
    longitude: event.longitude,
    image_url: event.cover_image_url,
    rsvp_count: event.attendee_count,
    attendee_count: event.attendee_count,
    max_capacity: null,
    is_featured: false,
  });
}

export function getLocationContextLabel(location: LocationPreview) {
  if (location.active_event_count > 0) {
    return `${location.short_name} | ${location.active_event_count} event${location.active_event_count === 1 ? '' : 's'} today`;
  }

  return `${location.short_name} | ${location.building_type}`;
}

export function getClubContextLabel(club: ClubPreview) {
  return `${club.category} | ${club.member_count} members`;
}

export function buildLocalSuggestedQueries(query: string) {
  const normalized = normalizeText(query);
  if (normalized.includes('food')) {
    return ['late night breakfast', 'free food today', 'stamp dining'];
  }
  if (normalized.includes('study')) {
    return ['mckeldin', 'study jam', 'quiet spots'];
  }
  if (normalized.includes('dance')) {
    return ['salsa night', 'arts events', 'something fun tonight'];
  }
  return getRecentSearchSuggestions().slice(0, 3);
}

