import type { Post, PostMediaItem, UserProfile } from '../shared/types';
import { supabase, isSupabaseConfigured, supabaseConfigError } from './supabase';
import { mockUsers } from '../assets/data/mockClubs';
import { socialProfiles } from '../features/social/data/mockSocialGraph';

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
  clubId?: string | null;
  eventId?: string | null;
  contentText: string;
  mediaUrls: string[];
  mediaType: 'none' | 'image' | 'video';
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isPinned?: boolean;
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
  club_id: string | null;
  event_id: string | null;
  content_text: string;
  media_urls: string[] | null;
  media_type: 'none' | 'image' | 'video';
  hashtags: string[] | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_pinned: boolean;
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
    club_id: raw.clubId ?? null,
    event_id: raw.eventId ?? null,
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
    is_pinned: Boolean(raw.isPinned),
    created_at: raw.createdAt,
    updated_at: raw.createdAt,
    suggested_reason: raw.suggestedReason ?? null,
    score: raw.score,
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function scoreMentionProfile(profile: RemoteSocialProfile, query: string) {
  const normalizedQuery = query.trim().replace(/^@+/, '').toLowerCase();
  if (!normalizedQuery) {
    return profile.followerCount + profile.followingCount * 0.25;
  }

  const username = profile.username.toLowerCase();
  const displayName = profile.displayName.toLowerCase();
  const major = (profile.major ?? '').toLowerCase();

  let score = 0;

  if (username === normalizedQuery) {
    score += 100;
  } else if (username.startsWith(normalizedQuery)) {
    score += 60;
  } else if (username.includes(normalizedQuery)) {
    score += 35;
  }

  if (displayName === normalizedQuery) {
    score += 90;
  } else if (displayName.startsWith(normalizedQuery)) {
    score += 55;
  } else if (displayName.includes(normalizedQuery)) {
    score += 28;
  }

  if (major.includes(normalizedQuery)) {
    score += 12;
  }

  return score + profile.followerCount * 0.08 + profile.followingCount * 0.02;
}

function mapMockUserToSocialProfile(user: (typeof mockUsers)[number]): RemoteSocialProfile {
  return {
    id: user.id,
    username: user.username ?? user.email.split('@')[0],
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    bio: user.bio ?? '',
    pronouns: user.pronouns ?? null,
    major: user.major ?? null,
    classYear: user.graduation_year ?? null,
    clubIds: user.clubs ?? [],
    interests: user.courses ?? [],
    followerCount: user.follower_count ?? 0,
    followingCount: user.following_count ?? 0,
  };
}

function buildMentionableProfilesFallback(query = '', limit = 12) {
  const merged = new Map<string, RemoteSocialProfile>();

  Object.values(socialProfiles).forEach((profile) => {
    merged.set(profile.id, {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      pronouns: profile.pronouns ?? null,
      major: profile.major,
      classYear: profile.classYear,
      clubIds: profile.clubIds,
      interests: profile.interests,
      followerCount: 0,
      followingCount: 0,
    });
  });

  mockUsers.forEach((user) => {
    if (!merged.has(user.id)) {
      merged.set(user.id, mapMockUserToSocialProfile(user));
    }
  });

  return Array.from(merged.values())
    .filter((profile) => {
      const normalizedQuery = query.trim().replace(/^@+/, '').toLowerCase();
      if (!normalizedQuery) {
        return true;
      }

      return [profile.username, profile.displayName, profile.major ?? ''].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    })
    .sort((left, right) => scoreMentionProfile(right, query) - scoreMentionProfile(left, query))
    .slice(0, limit);
}

async function fetchApprovedClubIdsByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string[]>();
  }

  const { data, error } = await supabase
    .from('club_members')
    .select('user_id, club_id')
    .eq('status', 'approved')
    .in('user_id', unique(userIds));

  if (error) {
    throw error;
  }

  const mapping = new Map<string, string[]>();
  (data ?? []).forEach((row: { user_id: string; club_id: string }) => {
    const current = mapping.get(row.user_id) ?? [];
    mapping.set(row.user_id, [...current, row.club_id]);
  });

  return mapping;
}

async function fetchUsersByIdsDirect(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, RawRemoteProfile>();
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, bio, major, graduation_year, clubs, courses, follower_count, following_count')
    .in('id', unique(userIds));

  if (error) {
    throw error;
  }

  const clubIdsByUserId = await fetchApprovedClubIdsByUserIds(unique(userIds));

  return new Map(
    (data ?? []).map((row) => {
      const profile = mapDbUserRow(row as DbUserRow);
      return [
        profile.id,
        {
          ...profile,
          clubs: clubIdsByUserId.get(profile.id) ?? profile.clubs,
        },
      ];
    }),
  );
}

async function hydrateDbPosts(
  rows: DbPostRow[],
  metadataById: Record<string, { score?: number; suggestedReason?: string | null } | undefined> = {},
) {
  const authorsById = await fetchUsersByIdsDirect(rows.map((row) => row.user_id));

  return Promise.all(
    rows.map(async (row) => {
      const mediaUrls = await signMediaUrls(row.media_urls ?? []);
      const author = authorsById.get(row.user_id);

      return mapRemotePost({
        id: row.id,
        userId: row.user_id,
        clubId: row.club_id,
        eventId: row.event_id,
        contentText: row.content_text,
        mediaUrls,
        mediaType: row.media_type,
        hashtags: row.hashtags ?? [],
        likeCount: row.like_count,
        commentCount: row.comment_count,
        shareCount: row.share_count,
        isPinned: row.is_pinned,
        createdAt: row.created_at,
        author: author ?? {
          id: row.user_id,
          username: 'terp',
          displayName: 'UMD Student',
          avatarUrl: null,
          bio: null,
          major: null,
          graduationYear: null,
          clubs: [],
          courses: [],
          followerCount: 0,
          followingCount: 0,
        },
        suggestedReason: metadataById[row.id]?.suggestedReason ?? null,
        score: metadataById[row.id]?.score,
      });
    }),
  );
}

async function fetchRemoteFeedFallback(mode: RemoteFeedMode, limit = 20): Promise<RemoteFeedResponse> {
  requireConfigured();

  const currentUserId = await fetchCurrentRemoteUserId();
  if (!currentUserId) {
    throw new Error('You need to be signed in to load the feed.');
  }

  const { data: followingRows, error: followingError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId);

  if (followingError) {
    throw followingError;
  }

  const followingIds = (followingRows ?? []).map((row: { following_id: string }) => row.following_id);
  const followingSet = new Set(followingIds);

  if (mode === 'following' && followingIds.length === 0) {
    return {
      items: [],
      nextCursor: null,
      generatedAt: new Date().toISOString(),
      source: 'client-fallback',
    };
  }

  let query = supabase
    .from('posts')
    .select('id, user_id, club_id, event_id, content_text, media_urls, media_type, hashtags, like_count, comment_count, share_count, is_pinned, moderation_status, created_at')
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(Math.max(limit * 3, 40));

  if (mode === 'following') {
    query = query.in('user_id', followingIds);
  } else if (mode === 'trending') {
    query = query.gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString());
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  let rows = (data ?? []) as DbPostRow[];
  if (mode === 'trending') {
    rows = [...rows].sort((left, right) => {
      const leftScore = left.like_count + left.comment_count * 2 + left.share_count * 3;
      const rightScore = right.like_count + right.comment_count * 2 + right.share_count * 3;
      return rightScore - leftScore;
    });
  }

  const metadataById = Object.fromEntries(
    rows.map((row) => [
      row.id,
      {
        score:
          mode === 'trending'
            ? row.like_count + row.comment_count * 2 + row.share_count * 3
            : new Date(row.created_at).getTime(),
        suggestedReason:
          mode === 'trending'
            ? 'Trending across campus'
            : !followingSet.has(row.user_id) && row.user_id !== currentUserId
              ? 'Fresh on campus'
              : null,
      },
    ]),
  );

  const items = await hydrateDbPosts(rows.slice(0, limit), metadataById);

  return {
    items,
    nextCursor: null,
    generatedAt: new Date().toISOString(),
    source: 'client-fallback',
  };
}

async function fetchTrendingSnapshotFallback() {
  requireConfigured();

  const { data, error } = await supabase
    .from('posts')
    .select('id, user_id, club_id, event_id, content_text, media_urls, media_type, hashtags, like_count, comment_count, share_count, is_pinned, moderation_status, created_at')
    .eq('moderation_status', 'approved')
    .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as DbPostRow[];
  const metadataById = Object.fromEntries(
    rows.map((row) => [
      row.id,
      {
        score: row.like_count + row.comment_count * 2 + row.share_count * 3,
        suggestedReason: 'Trending across campus',
      },
    ]),
  );

  const hashtagScores = new Map<string, number>();
  rows.forEach((row) => {
    (row.hashtags ?? []).forEach((tag) => {
      hashtagScores.set(tag, (hashtagScores.get(tag) ?? 0) + 1);
    });
  });

  return {
    posts: await hydrateDbPosts(rows, metadataById),
    hashtags: Array.from(hashtagScores.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([tag, score]) => ({ tag, score })),
    generatedAt: new Date().toISOString(),
  };
}

async function fetchRemoteRecommendationsFallback(limit = 10) {
  requireConfigured();

  const currentUserId = await fetchCurrentRemoteUserId();
  if (!currentUserId) {
    return [] satisfies RemoteRecommendation[];
  }

  const { data: rows, error } = await supabase
    .from('people_recommendations')
    .select('recommended_user_id, score, reason')
    .eq('user_id', currentUserId)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const usersById = await fetchUsersByIdsDirect(
    (rows ?? []).map((row: { recommended_user_id: string }) => row.recommended_user_id),
  );

  return (rows ?? [])
    .map((row: { recommended_user_id: string; score: number; reason: string }) => {
      const profile = usersById.get(row.recommended_user_id);
      if (!profile) {
        return null;
      }

      return {
        recommendedUserId: row.recommended_user_id,
        score: row.score,
        reason: row.reason,
        profile: mapRemoteUserToSocialProfile(profile),
      };
    })
    .filter(Boolean) as RemoteRecommendation[];
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
    const maybeError = error as {
      message?: string;
      context?: {
        error?: { message?: string };
        json?: () => Promise<unknown>;
        text?: () => Promise<string>;
      } | null;
    };

    if (maybeError.context?.error?.message) {
      throw new Error(maybeError.context.error.message);
    }

    let parsedMessage: string | null = null;

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
          parsedMessage = payload.error.message;
        }
      } catch {
        // Fall through to the remaining error shapes.
      }
    }

    if (parsedMessage) {
      throw new Error(parsedMessage);
    }

    if (typeof maybeError.context?.text === 'function') {
      try {
        const text = await maybeError.context.text();
        if (text.trim().length > 0) {
          parsedMessage = text;
        }
      } catch {
        // Fall through to the generic message.
      }
    }

    if (parsedMessage) {
      throw new Error(parsedMessage);
    }

    throw new Error(maybeError.message ?? 'Something went wrong.');
  }

  return data as TResponse;
}

async function resolveRemoteLinkedEventId(eventId?: string | null) {
  if (!eventId) {
    return null;
  }

  const { data, error } = await supabase.from('events').select('id').eq('id', eventId).maybeSingle();
  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

export async function fetchCurrentRemoteUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id ?? null;
}

export async function fetchRemoteFeed(mode: RemoteFeedMode, cursor?: string | null, limit = 20) {
  try {
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
  } catch {
    return fetchRemoteFeedFallback(mode, limit);
  }
}

export async function fetchRemoteRecommendations(limit = 10) {
  try {
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
  } catch {
    return fetchRemoteRecommendationsFallback(limit);
  }
}

export async function fetchTrendingSnapshot() {
  try {
    const response = await invokeFunction<void, { posts: RawRemotePost[]; hashtags: RemoteTrendingHashtag[]; generatedAt: string }>('get-trending');

    return {
      posts: response.posts.map(mapRemotePost),
      hashtags: response.hashtags,
      generatedAt: response.generatedAt,
    };
  } catch {
    return fetchTrendingSnapshotFallback();
  }
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

  const clubIdsByUserId = await fetchApprovedClubIdsByUserIds(userIds);

  return (data ?? []).map((row) =>
    mapRemoteUserToSocialProfile({
      ...mapDbUserRow(row as DbUserRow),
      clubs: clubIdsByUserId.get((row as DbUserRow).id) ?? mapDbUserRow(row as DbUserRow).clubs,
    }),
  );
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

  const clubIdsByUserId = await fetchApprovedClubIdsByUserIds([userId]);
  const mapped = mapDbUserRow(data as DbUserRow);
  return mapRemoteUserToSocialProfile({
    ...mapped,
    clubs: clubIdsByUserId.get(userId) ?? mapped.clubs,
  });
}

export async function fetchMentionableProfiles(query = '', limit = 12) {
  if (!isSupabaseConfigured) {
    return buildMentionableProfilesFallback(query, limit);
  }

  try {
    const normalizedQuery = query.trim().replace(/^@+/, '');
    let request = supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio, major, graduation_year, clubs, courses, follower_count, following_count')
      .order('display_name', { ascending: true })
      .limit(Math.max(limit * 5, 40));

    if (normalizedQuery) {
      request = request.or(
        `username.ilike.%${normalizedQuery}%,display_name.ilike.%${normalizedQuery}%,major.ilike.%${normalizedQuery}%`,
      );
    }

    const { data, error } = await request;

    if (error) {
      throw error;
    }

    const userIds = (data ?? []).map((row) => (row as DbUserRow).id);
    const clubIdsByUserId = await fetchApprovedClubIdsByUserIds(userIds);

    return (data ?? [])
      .map((row) => {
        const mapped = mapDbUserRow(row as DbUserRow);
        return mapRemoteUserToSocialProfile({
          ...mapped,
          clubs: clubIdsByUserId.get(mapped.id) ?? mapped.clubs,
        });
      })
      .sort((left, right) => scoreMentionProfile(right, query) - scoreMentionProfile(left, query))
      .slice(0, limit);
  } catch {
    return buildMentionableProfilesFallback(query, limit);
  }
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

/**
 * For each target in `targetIds`, returns how many people are connected to BOTH
 * the viewer and the target (mutual connections). Makes 3 Supabase queries total:
 * viewer's following, viewer's followers, and a batch follows lookup.
 */
export async function fetchMutualCounts(
  viewerId: string,
  targetIds: string[],
): Promise<Map<string, number>> {
  if (!isSupabaseConfigured || targetIds.length === 0) {
    return new Map(targetIds.map((id) => [id, 0]));
  }

  const [followingRes, followersRes] = await Promise.all([
    supabase.from('follows').select('following_id').eq('follower_id', viewerId),
    supabase.from('follows').select('follower_id').eq('following_id', viewerId),
  ]);

  const targetSet = new Set(targetIds);
  const neighborhoodIds = unique([
    ...(followingRes.data ?? []).map((r: { following_id: string }) => r.following_id),
    ...(followersRes.data ?? []).map((r: { follower_id: string }) => r.follower_id),
  ].filter((id) => id !== viewerId && !targetSet.has(id)));

  if (neighborhoodIds.length === 0) {
    return new Map(targetIds.map((id) => [id, 0]));
  }

  // Fetch all follows edges between neighborhood members and targets in one query.
  const allRelevantIds = [...neighborhoodIds, ...targetIds];
  const { data: edges } = await supabase
    .from('follows')
    .select('follower_id, following_id')
    .in('follower_id', allRelevantIds)
    .in('following_id', allRelevantIds);

  // For each target, collect unique neighborhood members connected to them.
  const mutualsByTarget = new Map<string, Set<string>>(targetIds.map((id) => [id, new Set()]));
  (edges ?? []).forEach((row: { follower_id: string; following_id: string }) => {
    if (!targetSet.has(row.follower_id) && targetSet.has(row.following_id)) {
      // A neighborhood member follows this target.
      mutualsByTarget.get(row.following_id)?.add(row.follower_id);
    }
    if (targetSet.has(row.follower_id) && !targetSet.has(row.following_id)) {
      // This target follows a neighborhood member.
      mutualsByTarget.get(row.follower_id)?.add(row.following_id);
    }
  });

  return new Map(Array.from(mutualsByTarget.entries()).map(([id, mutuals]) => [id, mutuals.size]));
}

export async function fetchRemotePostsByUser(userId: string, limit = 40) {
  requireConfigured();
  const currentUserId = await fetchCurrentRemoteUserId();

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, bio, major, graduation_year, clubs, courses, follower_count, following_count')
    .eq('id', userId)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (!userRow) {
    return [];
  }

  const clubIdsByUserId = await fetchApprovedClubIdsByUserIds([userId]);

  let query = supabase
    .from('posts')
    .select('id, user_id, club_id, event_id, content_text, media_urls, media_type, hashtags, like_count, comment_count, share_count, is_pinned, moderation_status, created_at')
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

  const mappedAuthor = mapDbUserRow(userRow as DbUserRow);
  const author = {
    ...mappedAuthor,
    clubs: clubIdsByUserId.get(userId) ?? mappedAuthor.clubs,
  };
  const posts = await Promise.all(
    (postRows ?? []).map(async (row) => {
      const postRow = row as DbPostRow;
      const mediaUrls = await signMediaUrls(postRow.media_urls ?? []);
      return mapRemotePost({
        id: postRow.id,
        userId: postRow.user_id,
        clubId: postRow.club_id,
        eventId: postRow.event_id,
        contentText: postRow.content_text,
        mediaUrls,
        mediaType: postRow.media_type,
        hashtags: postRow.hashtags ?? [],
        likeCount: postRow.like_count,
        commentCount: postRow.comment_count,
        shareCount: postRow.share_count,
        isPinned: postRow.is_pinned,
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
  clubId?: string | null;
  eventId?: string | null;
  isPinned?: boolean;
}) {
  const resolvedEventId = await resolveRemoteLinkedEventId(input.eventId);
  const response = await invokeFunction<
    {
      contentText: string;
      media: Array<{ base64Data: string; fileName: string; mimeType: string }>;
      clubId?: string | null;
      eventId?: string | null;
      isPinned?: boolean;
    },
    {
      post: RawRemotePost | null;
      moderationStatus: 'pending' | 'approved' | 'rejected';
      moderationSummary?: Record<string, unknown>;
    }
  >('submit-post', {
    contentText: input.contentText,
    media: input.mediaItems,
    clubId: input.clubId ?? null,
    eventId: resolvedEventId,
    isPinned: Boolean(input.isPinned),
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

