import type { Post, PostMediaItem, UserProfile } from '../shared/types';
import { supabase, isSupabaseConfigured, supabaseConfigError } from './supabase';

export type RemoteFeedMode = 'for_you' | 'following' | 'trending';

export interface RemoteSocialProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  pronouns?: string | null;
  major: string | null;
  classYear: number | null;
  clubIds: string[];
  interests: string[];
  followerCount: number;
  followingCount: number;
}

export interface RemoteRecommendation {
  recommendedUserId: string;
  score: number;
  reason: string;
  profile: RemoteSocialProfile;
}

export interface RemoteTrendingHashtag {
  tag: string;
  score: number;
}

export interface RemoteFeedResponse {
  items: Array<Post & { suggested_reason?: string | null; score?: number }>;
  nextCursor: string | null;
  generatedAt: string;
  source: string;
}

export interface RemoteSubmitPostResult {
  post: (Post & { suggested_reason?: string | null; score?: number }) | null;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderationSummary?: Record<string, unknown>;
}

interface RawRemoteProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  pronouns?: string | null;
  major: string | null;
  graduationYear: number | null;
  clubs: string[];
  courses: string[];
  followerCount: number;
  followingCount: number;
}

interface RawRemotePost {
  id: string;
  userId: string;
  contentText: string;
  mediaUrls: string[];
  mediaType: 'none' | 'image' | 'video';
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  author: RawRemoteProfile;
  suggestedReason?: string | null;
  score?: number;
}

interface DbUserRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  major: string | null;
  graduation_year: number | null;
  clubs: string[] | null;
  courses: string[] | null;
  follower_count: number;
  following_count: number;
}

interface DbPostRow {
  id: string;
  user_id: string;
  content_text: string;
  media_urls: string[] | null;
  media_type: 'none' | 'image' | 'video';
  hashtags: string[] | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  moderation_status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

function requireConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError);
  }
}

function mapDbUserRow(row: DbUserRow): RawRemoteProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    major: row.major,
    graduationYear: row.graduation_year,
    clubs: row.clubs ?? [],
    courses: row.courses ?? [],
    followerCount: row.follower_count,
    followingCount: row.following_count,
  };
}

function mapRemoteUserToProfile(user: RawRemoteProfile): UserProfile {
  return {
    id: user.id,
    email: '',
    username: user.username,
    display_name: user.displayName,
    avatar_url: user.avatarUrl,
    bio: user.bio,
    major: user.major,
    graduation_year: user.graduationYear,
    clubs: user.clubs,
    courses: user.courses,
    follower_count: user.followerCount,
    following_count: user.followingCount,
    push_token: null,
    created_at: new Date().toISOString(),
  };
}

function mapRemoteUserToSocialProfile(user: RawRemoteProfile): RemoteSocialProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio ?? '',
    pronouns: user.pronouns ?? null,
    major: user.major,
    classYear: user.graduationYear,
    clubIds: user.clubs ?? [],
    interests: user.courses ?? [],
    followerCount: user.followerCount,
    followingCount: user.followingCount,
  };
}

function mapRemotePost(raw: RawRemotePost): Post & { suggested_reason?: string | null; score?: number } {
  return {
    id: raw.id,
    author_id: raw.userId,
    club_id: null,
    author: mapRemoteUserToProfile(raw.author),
    content: raw.contentText,
    media_urls: raw.mediaUrls,
    media_items: raw.mediaUrls.map((uri, index) => ({
      id: `${raw.id}-${index}`,
      uri,
      type: raw.mediaType === 'video' ? 'video' : 'image',
    })),
    like_count: raw.likeCount,
    comment_count: raw.commentCount,
    share_count: raw.shareCount,
    hashtags: raw.hashtags,
    is_pinned: false,
    created_at: raw.createdAt,
    updated_at: raw.createdAt,
    suggested_reason: raw.suggestedReason ?? null,
    score: raw.score,
  };
}

async function signMediaUrls(mediaUrls: string[]) {
  const storagePaths = mediaUrls.filter((value) => value && !/^https?:\/\//i.test(value));
  if (storagePaths.length === 0) {
    return mediaUrls;
  }

  const { data, error } = await supabase.storage.from('social-media').createSignedUrls(storagePaths, 60 * 60);
  if (error) {
    throw error;
  }

  const signedByPath = new Map((data ?? []).map((entry) => [entry.path, entry.signedUrl ?? entry.path]));
  return mediaUrls.map((value) => signedByPath.get(value) ?? value);
}

async function invokeFunction<TRequest, TResponse>(name: string, body?: TRequest) {
  requireConfigured();

  const { data, error } = await supabase.functions.invoke(name, {
    body: body as Record<string, unknown> | string | Blob | ArrayBuffer | FormData | undefined,
  });

  if (error) {
    throw error;
  }

  return data as TResponse;
}

export async function fetchCurrentRemoteUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id ?? null;
}

export async function fetchRemoteFeed(mode: RemoteFeedMode, cursor?: string | null, limit = 20) {
  const response = await invokeFunction<
    { mode: RemoteFeedMode; cursor?: string | null; limit?: number },
    { items: RawRemotePost[]; nextCursor: string | null; generatedAt: string; source: string }
  >('get-feed', {
    mode,
    cursor,
    limit,
  });

  return {
    items: response.items.map(mapRemotePost),
    nextCursor: response.nextCursor,
    generatedAt: response.generatedAt,
    source: response.source,
  } satisfies RemoteFeedResponse;
}

export async function fetchRemoteRecommendations(limit = 10) {
  const response = await invokeFunction<
    { limit?: number },
    { items: Array<{ recommendedUserId: string; score: number; reason: string; profile: RawRemoteProfile }> }
  >('get-recommendations', { limit });

  return response.items.map((entry) => ({
    recommendedUserId: entry.recommendedUserId,
    score: entry.score,
    reason: entry.reason,
    profile: mapRemoteUserToSocialProfile(entry.profile),
  })) satisfies RemoteRecommendation[];
}

export async function fetchTrendingSnapshot() {
  const response = await invokeFunction<void, { posts: RawRemotePost[]; hashtags: RemoteTrendingHashtag[]; generatedAt: string }>('get-trending');

  return {
    posts: response.posts.map(mapRemotePost),
    hashtags: response.hashtags,
    generatedAt: response.generatedAt,
  };
}

async function getProfilesByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return [] as RemoteSocialProfile[];
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, bio, major, graduation_year, clubs, courses, follower_count, following_count')
    .in('id', userIds);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRemoteUserToSocialProfile(mapDbUserRow(row as DbUserRow)));
}

export async function fetchRemoteProfileById(userId: string) {
  requireConfigured();

  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, bio, major, graduation_year, clubs, courses, follower_count, following_count')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return mapRemoteUserToSocialProfile(mapDbUserRow(data as DbUserRow));
}

export async function fetchFollowingProfiles(userId: string) {
  requireConfigured();
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (error) {
    throw error;
  }

  return getProfilesByIds((data ?? []).map((row: { following_id: string }) => row.following_id));
}

export async function fetchFollowerProfiles(userId: string) {
  requireConfigured();
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId);

  if (error) {
    throw error;
  }

  return getProfilesByIds((data ?? []).map((row: { follower_id: string }) => row.follower_id));
}

export async function fetchRemotePostsByUser(userId: string, limit = 40) {
  requireConfigured();
  const currentUserId = await fetchCurrentRemoteUserId();

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, bio, major, graduation_year, clubs, courses, follower_count, following_count')
    .eq('id', userId)
    .single();

  if (userError) {
    throw userError;
  }

  let query = supabase
    .from('posts')
    .select('id, user_id, content_text, media_urls, media_type, hashtags, like_count, comment_count, share_count, moderation_status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (currentUserId !== userId) {
    query = query.eq('moderation_status', 'approved');
  }

  const { data: postRows, error: postsError } = await query;
  if (postsError) {
    throw postsError;
  }

  const author = mapDbUserRow(userRow as DbUserRow);
  const posts = await Promise.all(
    (postRows ?? []).map(async (row) => {
      const postRow = row as DbPostRow;
      const mediaUrls = await signMediaUrls(postRow.media_urls ?? []);
      return mapRemotePost({
        id: postRow.id,
        userId: postRow.user_id,
        contentText: postRow.content_text,
        mediaUrls,
        mediaType: postRow.media_type,
        hashtags: postRow.hashtags ?? [],
        likeCount: postRow.like_count,
        commentCount: postRow.comment_count,
        shareCount: postRow.share_count,
        createdAt: postRow.created_at,
        author,
      });
    }),
  );

  return posts;
}

export async function submitRemotePost(input: {
  contentText: string;
  mediaItems: Array<{ base64Data: string; fileName: string; mimeType: string }>;
}) {
  const response = await invokeFunction<
    {
      contentText: string;
      media: Array<{ base64Data: string; fileName: string; mimeType: string }>;
    },
    {
      post: RawRemotePost | null;
      moderationStatus: 'pending' | 'approved' | 'rejected';
      moderationSummary?: Record<string, unknown>;
    }
  >('submit-post', {
    contentText: input.contentText,
    media: input.mediaItems,
  });

  return {
    post: response.post ? mapRemotePost(response.post) : null,
    moderationStatus: response.moderationStatus,
    moderationSummary: response.moderationSummary,
  } satisfies RemoteSubmitPostResult;
}

export async function toggleRemoteFollow(input: {
  targetUserId: string;
  action: 'follow' | 'unfollow';
  source?: 'recommendation' | 'profile' | 'feed' | 'search';
}) {
  return invokeFunction('follow-user', input);
}

export async function toggleRemotePostLike(postId: string, isLiked: boolean) {
  requireConfigured();
  const currentUserId = await fetchCurrentRemoteUserId();
  if (!currentUserId) {
    throw new Error('You need to be signed in to like a post.');
  }

  if (isLiked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', currentUserId);
    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: currentUserId,
  });
  if (error) {
    throw error;
  }
}

