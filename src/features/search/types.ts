export type SearchIntent = 'keyword' | 'semantic' | 'hybrid';
export type SearchEntityType = 'person' | 'event' | 'club' | 'location';
export type SearchResultTab = 'all' | 'people' | 'events' | 'clubs' | 'locations';
export type SearchCategory =
  | 'academic'
  | 'social'
  | 'sports'
  | 'club'
  | 'career'
  | 'arts'
  | 'food'
  | 'workshop'
  | 'party'
  | 'other';

export interface ExtractedSearchFilters {
  category: SearchCategory | null;
  timeframe: 'now' | 'today' | 'tomorrow' | 'this_week' | null;
  cost: 'free' | null;
  entity_type: SearchEntityType | null;
  clean_query: string;
}

export interface SearchResult<T> {
  score: number;
  match_reason: string;
  semantic?: boolean;
  data: T;
}

export interface UserPreview {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  major: string | null;
  bio?: string | null;
  pronouns?: string | null;
  mutual_follow_count: number;
  is_following: boolean;
}

export interface EventPreview {
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

export interface ClubPreview {
  id: string;
  name: string;
  category: string;
  description: string;
  member_count: number;
  tags: string[];
  cover_image_url: string | null;
}

export interface LocationPreview {
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
    people: SearchResult<UserPreview>[];
    events: SearchResult<EventPreview>[];
    clubs: SearchResult<ClubPreview>[];
    locations: SearchResult<LocationPreview>[];
  };
  total_counts: {
    people: number;
    events: number;
    clubs: number;
    locations: number;
  };
}

export type SearchResponse = UnifiedSearchResponse;

export interface AutocompleteSuggestion {
  type: SearchEntityType;
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category_color?: string;
  latitude?: number;
  longitude?: number;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
}

export interface RecentSearch {
  query: string;
  timestamp: number;
  result_type?: SearchEntityType;
  result_id?: string;
}

export interface DiscoverySectionEvent extends EventPreview {
  badge?: string;
}

export interface DiscoveryHubResponse {
  trending_events: DiscoverySectionEvent[];
  trending_hashtags: Array<{ hashtag: string; count: number; velocity: number }>;
  live_events: DiscoverySectionEvent[];
  people_you_may_know: SearchResult<UserPreview>[];
}
