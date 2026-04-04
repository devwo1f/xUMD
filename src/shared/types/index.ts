/**
 * xUMD Shared Type Definitions
 *
 * Central type definitions used across all service layers
 * and UI components. Mirrors the Supabase database schema.
 */

// ---------------------------------------------------------------
//  Enums
// ---------------------------------------------------------------

export enum ClubCategory {
  Academic = 'academic',
  Sports = 'sports',
  Cultural = 'cultural',
  Professional = 'professional',
  Social = 'social',
  Arts = 'arts',
  Service = 'service',
  Greek = 'greek',
  Other = 'other',
}

export enum EventCategory {
  Social = 'social',
  Academic = 'academic',
  Career = 'career',
  Sports = 'sports',
  Arts = 'arts',
  Workshop = 'workshop',
  Other = 'other',
}

export enum MemberRole {
  Member = 'member',
  Officer = 'officer',
  President = 'president',
  Admin = 'admin',
}

export enum MemberStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

// ---------------------------------------------------------------
//  Utility Types
// ---------------------------------------------------------------

/** Standard paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Generic service result for operations that may fail */
export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

// ---------------------------------------------------------------
//  Database Entities
// ---------------------------------------------------------------

// -- User ------------------------------------------------------

export interface NotificationPrefs {
  push_enabled: boolean;
  email_enabled: boolean;
  club_updates: boolean;
  event_reminders: boolean;
  feed_activity: boolean;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  display_name: string;
  avatar_url: string | null;
  major: string | null;
  graduation_year: number | null;
  bio: string | null;
  clubs?: string[];
  courses?: string[];
  follower_count?: number;
  following_count?: number;
  notification_prefs?: NotificationPrefs;
  push_token?: string | null;
  created_at: string;
  updated_at?: string;
}

export type UserUpdate = Partial<
  Pick<
    User,
    'display_name' | 'avatar_url' | 'bio' | 'major' | 'graduation_year'
  > & { notification_prefs: Partial<NotificationPrefs> }
>;

export type UserProfile = User;
export type UserProfileUpdate = UserUpdate;

// -- Club ------------------------------------------------------

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  discord?: string;
  website?: string;
  linkedin?: string;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: ClubCategory;
  logo_url: string | null;
  cover_url: string | null;
  meeting_schedule: string | null;
  contact_email: string | null;
  social_links: SocialLinks;
  member_count: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export type ClubUpdate = Partial<
  Pick<
    Club,
    | 'name'
    | 'description'
    | 'short_description'
    | 'category'
    | 'logo_url'
    | 'cover_url'
    | 'contact_email'
    | 'social_links'
    | 'meeting_schedule'
    | 'is_active'
  >
>;

export interface ClubFilters {
  category?: ClubCategory;
  search?: string;
  sort?: 'name' | 'member_count' | 'created_at';
}

// -- Club Member -----------------------------------------------

export interface ClubMember {
  club_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
}

// -- Event -----------------------------------------------------

export interface Event {
  id: string;
  title: string;
  description: string;
  club_id: string | null;
  created_by: string;
  category: EventCategory;
  starts_at: string;
  ends_at: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  rsvp_count: number;
  max_capacity: number | null;
  is_featured: boolean;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export type EventCreate = Pick<
  Event,
  | 'title'
  | 'description'
  | 'category'
  | 'club_id'
  | 'image_url'
  | 'location_name'
  | 'latitude'
  | 'longitude'
  | 'starts_at'
  | 'ends_at'
  | 'max_capacity'
>;

export interface EventFilters {
  category?: EventCategory;
  dateRange?: { start: string; end: string };
  clubId?: string;
}

// -- Event RSVP ------------------------------------------------

export interface EventRSVP {
  event_id: string;
  user_id: string;
  created_at: string;
}

// -- Post ------------------------------------------------------

export interface Post {
  id: string;
  author_id: string;
  club_id: string | null;
  author?: User;
  club?: Club;
  type?: string;
  content: string;
  media_urls: string[];
  media_items?: PostMediaItem[];
  hashtags?: string[];
  like_count: number;
  comment_count: number;
  share_count?: number;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
  is_liked?: boolean;
  suggested_reason?: string | null;
  score?: number;
}

export type PostCreate = Pick<Post, 'club_id' | 'content' | 'media_urls'>;

export interface PostMediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  mime_type?: string | null;
  file_name?: string | null;
  width?: number;
  height?: number;
  file_size?: number;
  duration_ms?: number | null;
  base64_data?: string | null;
}

// -- Comment ---------------------------------------------------

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author?: User;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at?: string;
  like_count?: number;
}

// -- Dining Location -------------------------------------------

export interface DiningHours {
  open: string;
  close: string;
}

export interface DiningLocation {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  hours: Record<string, DiningHours>;
  accepts_meal_plan: boolean;
  image_url: string | null;
  is_open: boolean;
}

// -- Safety Contact --------------------------------------------

export interface SafetyContact {
  id: string;
  name: string;
  description: string | null;
  phone_number: string;
  is_emergency: boolean;
  display_order: number;
}

// -- Campus Building -------------------------------------------

export interface CampusBuilding {
  id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  image_url: string | null;
  building_type: string;
}

// -- Marketplace Listing ---------------------------------------

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type ListingStatus = 'active' | 'sold' | 'reserved' | 'removed';

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  condition: ListingCondition;
  category: string;
  image_urls: string[];
  status: ListingStatus;
  created_at: string;
}

// -- Study Spot ------------------------------------------------

export type NoiseLevel = 'silent' | 'quiet' | 'moderate' | 'loud';

export interface StudySpot {
  id: string;
  name: string;
  building_id: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  noise_level: NoiseLevel;
  has_outlets: boolean;
  has_wifi: boolean;
  capacity: number | null;
  image_url: string | null;
}

// ---------------------------------------------------------------
//  Joined / Derived Types (commonly used in UI)
// ---------------------------------------------------------------

/** Post with the author record attached */
export interface PostWithAuthor extends Post {
  author: User;
  /** Whether the current user has liked this post (populated client-side) */
  is_liked?: boolean;
}

/** Comment with the author record attached */
export interface CommentWithAuthor extends Comment {
  author: User;
}

/** Event with optional club info */
export interface EventWithClub extends Event {
  club?: Pick<Club, 'id' | 'name' | 'logo_url'>;
}

/** Club membership enriched with the user profile */
export interface ClubMemberWithUser extends ClubMember {
  user: User;
}

// ---------------------------------------------------------------
//  Notifications
// ---------------------------------------------------------------

export type NotificationType =
  | 'event_reminder'
  | 'club_update'
  | 'join_request'
  | 'join_approved'
  | 'new_comment'
  | 'post_like'
  | 'general';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  is_read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------
//  Content Reports
// ---------------------------------------------------------------

export type ReportType = 'post' | 'comment' | 'user' | 'club';

export interface ContentReport {
  id: string;
  reporter_id: string;
  content_type: ReportType;
  content_id: string;
  reason: string;
  created_at: string;
}

// ---------------------------------------------------------------
//  Navigation Param Lists
// ---------------------------------------------------------------

// Navigation param types live in src/navigation/types.ts so the active app shell
// has a single source of truth for routes.
