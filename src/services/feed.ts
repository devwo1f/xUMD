import { supabase } from './supabase';
import type {
  CommentWithAuthor,
  ContentReport,
  PaginatedResponse,
  PostCreate,
  PostWithAuthor,
  ReportType,
  ServiceResult,
} from '../shared/types';

const PAGE_SIZE = 15;

/** Supported feed types */
export type FeedType = 'for_you' | 'following' | 'trending';

/**
 * Fetch feed posts by type with pagination.
 */
export async function getFeedPosts(
  type: FeedType,
  page = 1,
): Promise<ServiceResult<PaginatedResponse<PostWithAuthor>>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('posts')
    .select('*, author:users!posts_author_id_fkey(*)', { count: 'exact' });

  switch (type) {
    case 'following': {
      // Posts from clubs the user is a member of
      if (!userId) {
        return {
          data: { data: [], count: 0, page, pageSize: PAGE_SIZE, hasMore: false },
          error: null,
        };
      }

      // Get the user's club IDs first
      const { data: memberships } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', userId)
        .eq('status', 'approved');

      const clubIds = (memberships ?? []).map((m: { club_id: string }) => m.club_id);

      if (clubIds.length === 0) {
        return {
          data: { data: [], count: 0, page, pageSize: PAGE_SIZE, hasMore: false },
          error: null,
        };
      }

      query = query.in('club_id', clubIds);
      break;
    }

    case 'trending':
      // Order by engagement (likes + comments) in the last 7 days
      query = query
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('like_count', { ascending: false });
      break;

    case 'for_you':
    default:
      // Chronological feed of all posts
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Always apply a secondary sort for deterministic ordering
  if (type !== 'trending') {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  let posts = (data ?? []) as PostWithAuthor[];

  // Hydrate `is_liked` for the current user
  if (userId && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    const likedSet = new Set((likes ?? []).map((l: { post_id: string }) => l.post_id));
    posts = posts.map((p) => ({ ...p, is_liked: likedSet.has(p.id) }));
  }

  const total = count ?? 0;

  return {
    data: {
      data: posts,
      count: total,
      page,
      pageSize: PAGE_SIZE,
      hasMore: from + PAGE_SIZE < total,
    },
    error: null,
  };
}

/**
 * Fetch a single post by ID with author info.
 */
export async function getPostById(id: string): Promise<ServiceResult<PostWithAuthor>> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users!posts_author_id_fkey(*)')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Hydrate is_liked
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let post = data as PostWithAuthor;

  if (session?.user) {
    const { data: like } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', session.user.id)
      .maybeSingle();

    post = { ...post, is_liked: !!like };
  }

  return { data: post, error: null };
}

/**
 * Create a new post.
 */
export async function createPost(
  post: PostCreate,
): Promise<ServiceResult<PostWithAuthor>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ ...post, author_id: session.user.id })
    .select('*, author:users!posts_author_id_fkey(*)')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as PostWithAuthor, error: null };
}

/**
 * Like a post. Uses upsert to be idempotent.
 */
export async function likePost(postId: string): Promise<ServiceResult<null>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { error } = await supabase
    .from('post_likes')
    .upsert(
      { post_id: postId, user_id: session.user.id },
      { onConflict: 'post_id,user_id' },
    );

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

/**
 * Remove a like from a post.
 */
export async function unlikePost(postId: string): Promise<ServiceResult<null>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', session.user.id);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

/**
 * Fetch comments for a post, including author profiles.
 * Returns a flat list; threading can be resolved client-side via parent_id.
 */
export async function getComments(
  postId: string,
): Promise<ServiceResult<CommentWithAuthor[]>> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:users!comments_author_id_fkey(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as CommentWithAuthor[], error: null };
}

/**
 * Create a comment on a post, optionally as a reply to another comment.
 */
export async function createComment(
  postId: string,
  content: string,
  parentId?: string,
): Promise<ServiceResult<CommentWithAuthor>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: session.user.id,
      content,
      parent_id: parentId ?? null,
    })
    .select('*, author:users!comments_author_id_fkey(*)')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as CommentWithAuthor, error: null };
}

/**
 * Report a piece of content (post, comment, user, or club).
 */
export async function reportContent(
  type: ReportType,
  id: string,
  reason: string,
): Promise<ServiceResult<ContentReport>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('content_reports')
    .insert({
      reporter_id: session.user.id,
      content_type: type,
      content_id: id,
      reason,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ContentReport, error: null };
}
