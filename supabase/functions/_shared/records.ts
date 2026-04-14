import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { HttpError } from './errors.ts';
import type { FeedAuthorSummary, FeedItem, FeedPostRecord } from './types.ts';

interface RawUserRow {
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

interface RawPostRow {
  id: string;
  user_id: string;
  club_id: string | null;
  content_text: string;
  media_urls: string[] | null;
  media_type: 'none' | 'image' | 'video';
  hashtags: string[] | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_pinned: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export async function fetchUsersByIds(admin: SupabaseClient, userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, FeedAuthorSummary>();
  }

  const { data, error } = await admin
    .from('users')
    .select(
      'id, username, display_name, avatar_url, bio, major, graduation_year, clubs, courses, follower_count, following_count',
    )
    .in('id', userIds);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load user summaries.', error);
  }

  return new Map(
    (data as RawUserRow[]).map((row) => [
      row.id,
      {
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
      },
    ]),
  );
}

async function resolveSignedMediaUrls(admin: SupabaseClient, mediaUrls: string[]) {
  const storagePaths = mediaUrls.filter((value) => value && !/^https?:\/\//i.test(value));
  if (storagePaths.length === 0) {
    return mediaUrls;
  }

  const { data, error } = await admin.storage
    .from('social-media')
    .createSignedUrls(storagePaths, 60 * 60);

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to sign media URLs.', error);
  }

  const signedByPath = new Map(
    (data ?? []).map((entry) => [entry.path, entry.signedUrl ?? entry.path]),
  );

  return mediaUrls.map((value) => signedByPath.get(value) ?? value);
}

export async function fetchPostsByIds(
  admin: SupabaseClient,
  postIds: string[],
  metadataByPostId: Record<
    string,
    {
      score: number;
      suggested?: boolean;
      suggestedReason?: string | null;
      socialProofCount?: number;
      topicAffinity?: number;
    }
  > = {},
) {
  if (postIds.length === 0) {
    return [] as FeedItem[];
  }

  const { data, error } = await admin
    .from('posts')
    .select(
      'id, user_id, club_id, content_text, media_urls, media_type, hashtags, like_count, comment_count, share_count, is_pinned, moderation_status, created_at',
    )
    .in('id', postIds)
    .eq('moderation_status', 'approved');

  if (error) {
    throw new HttpError(500, 'internal_error', 'Unable to load posts.', error);
  }

  const rows = data as RawPostRow[];
  const usersById = await fetchUsersByIds(
    admin,
    Array.from(new Set(rows.map((row) => row.user_id))),
  );

  const hydrated = await Promise.all(
    rows.map(async (row) => {
      const author = usersById.get(row.user_id);
      if (!author) {
        return null;
      }

      const mediaUrls = await resolveSignedMediaUrls(admin, row.media_urls ?? []);
      const meta = metadataByPostId[row.id];

      const baseRecord: FeedPostRecord = {
        id: row.id,
        userId: row.user_id,
        clubId: row.club_id,
        contentText: row.content_text,
        mediaUrls,
        mediaType: row.media_type,
        hashtags: row.hashtags ?? [],
        likeCount: row.like_count,
        commentCount: row.comment_count,
        shareCount: row.share_count,
        isPinned: row.is_pinned,
        moderationStatus: row.moderation_status,
        createdAt: row.created_at,
        author,
      };

      const feedItem: FeedItem = {
        ...baseRecord,
        score: meta?.score ?? 0,
        suggested: meta?.suggested ?? false,
        suggestedReason: meta?.suggestedReason ?? null,
        socialProofCount: meta?.socialProofCount ?? 0,
        topicAffinity: meta?.topicAffinity ?? 0,
      };

      return feedItem;
    }),
  );

  const order = new Map(postIds.map((id, index) => [id, index]));
  return hydrated
    .filter((value): value is FeedItem => Boolean(value))
    .sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
}
