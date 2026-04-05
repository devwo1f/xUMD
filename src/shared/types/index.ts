/**
 * xUMD Shared Type Definitions
 */

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
  Club = 'club',
  Arts = 'arts',
  Food = 'food',
  Workshop = 'workshop',
  Party = 'party',
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

export type DegreeType = 'bs' | 'ba' | 'ms' | 'phd' | 'mba' | 'other';

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

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
  degree_type?: DegreeType | null;
  minor?: string | null;
  bio: string | null;
  pronouns?: string | null;
  clubs?: string[];
  courses?: string[];
  interests?: string[];
  follower_count?: number;
  following_count?: number;
  profile_completed?: boolean;
  onboarding_step?: number;
  notification_prefs?: NotificationPrefs;
  push_token?: string | null;
  created_at: string;
  updated_at?: string;
}

export type UserUpdate = Partial<
  Pick<
    User,
    | 'display_name'
    | 'username'
    | 'avatar_url'
    | 'bio'
    | 'major'
    | 'graduation_year'
    | 'degree_type'
    | 'minor'
    | 'pronouns'
    | 'courses'
    | 'clubs'
    | 'interests'
    | 'profile_completed'
    | 'onboarding_step'
  > & { notification_prefs: Partial<NotificationPrefs> }
>;

export type UserProfile = User;
export type UserProfileUpdate = UserUpdate;

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

export interface ClubMember {
  club_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
}

export interface ClubMemberWithUser extends ClubMember {
  user: User;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  club_id: string | null;
  created_by: string;
  organizer_name?: string;
  category: EventCategory;
  starts_at: string;
  ends_at: string;
  status?: 'upcoming' | 'live' | 'completed' | 'cancelled';
  moderation_status?: 'pending' | 'approved' | 'rejected';
  location_name: string;
  location_id?: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  rsvp_count: number;
  attendee_count?: number;
  interested_count?: number;
  max_capacity: number | null;
  is_featured: boolean;
  tags?: string[];
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventWithClub extends Event {
  club?: Pick<Club, 'id' | 'name' | 'logo_url'> | null;
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

export interface EventRSVP {
  event_id: string;
  user_id: string;
  status?: 'going' | 'interested';
  created_at: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  short_name: string;
  latitude: number;
  longitude: number;
  building_type:
    | 'academic'
    | 'dining'
    | 'recreation'
    | 'library'
    | 'admin'
    | 'residential'
    | 'outdoor'
    | 'arena'
    | 'other';
  floor_count: number | null;
  address: string | null;
}

export type EventReportReason =
  | 'spam'
  | 'inappropriate'
  | 'misleading'
  | 'harassment'
  | 'other';

export interface EventDetailPayload {
  event: Event;
  organizer: Pick<
    User,
    'id' | 'display_name' | 'avatar_url' | 'bio' | 'major' | 'graduation_year'
  > | null;
  campus_location: CampusLocation | null;
  friends_attending: Array<
    Pick<User, 'id' | 'display_name' | 'avatar_url' | 'bio' | 'major' | 'graduation_year'>
  >;
  rsvp_stats: {
    going: number;
    interested: number;
  };
  current_user_rsvp: 'going' | 'interested' | null;
  reports_count: number;
}

export interface EventSearchResult {
  id: string;
  type: 'event' | 'location';
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  event_ids: string[];
}

export interface Post {
  id: string;
  author_id: string;
  club_id: string | null;
  author?: User | null;
  club?: Club | Pick<Club, 'id' | 'name' | 'logo_url'> | null;
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

export interface PostWithAuthor extends Post {
  author: User | null;
  club?: Pick<Club, 'id' | 'name' | 'logo_url'> | null;
}

export type PostCreate = Pick<Post, 'club_id' | 'content' | 'media_urls'>;

export interface PostMediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  mime_type?: string | null;
  file_name?: string | null;
  width?: number | null;
  height?: number | null;
  file_size?: number | null;
  duration_ms?: number | null;
  caption?: string | null;
  base64_data?: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author?: User | null;
  content: string;
  like_count: number;
  parent_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CommentWithAuthor extends Comment {
  author: User | null;
}

export type ReportType = 'post' | 'comment' | 'event' | 'club' | 'user';

export interface ContentReport {
  id: string;
  type: ReportType;
  target_id: string;
  reason: string;
  details?: string | null;
  reported_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type:
    | 'club_post'
    | 'event_reminder'
    | 'post_like'
    | 'post_comment'
    | 'follow'
    | 'mention';
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}




