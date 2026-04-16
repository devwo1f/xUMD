/**
 * useFeed Hook
 *
 * State management for the feed feature using Zustand.
 * Provides mock data, optimistic like/unlike, and feed type filtering.
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import type { Post, UserProfile, PostMediaItem } from '../../../shared/types';
import {
  mockPosts,
  mockComments,
  mockAuthors,
  authorHandles,
  type CommentWithReplies,
} from '../../../assets/data/mockFeed';
import { useSocialGraph } from '../../social/hooks/useSocialGraph';

export type FeedTab = 'For You' | 'Following' | 'Trending';

function mergePosts(existing: Post[], incoming: Post[]) {
  const existingById = new Map(existing.map((post) => [post.id, post]));
  const mergedIncoming = incoming.map((post) => ({
    ...(existingById.get(post.id) ?? {}),
    ...post,
  }));
  const incomingIds = new Set(incoming.map((post) => post.id));
  const remainder = existing.filter((post) => !incomingIds.has(post.id));

  return [...mergedIncoming, ...remainder];
}

interface FeedState {
  posts: Post[];
  activeTab: FeedTab;
  refreshing: boolean;
  setActiveTab: (tab: FeedTab) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  createPost: (input: {
    authorId: string;
    author: UserProfile;
    clubId: string | null;
    eventId?: string | null;
    content: string;
    mediaUrls?: string[];
    mediaItems?: PostMediaItem[];
    type?: string;
    isPinned?: boolean;
  }) => Post;
  hydratePosts: (posts: Post[]) => void;
  refresh: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: mockPosts,
  activeTab: 'For You',
  refreshing: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  likePost: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, is_liked: true, like_count: post.like_count + 1 }
          : post,
      ),
    })),

  unlikePost: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, is_liked: false, like_count: Math.max(0, post.like_count - 1) }
          : post,
      ),
    })),

  toggleLike: (postId) => {
    const post = get().posts.find((item) => item.id === postId);
    if (!post) {
      return;
    }

    if (post.is_liked) {
      get().unlikePost(postId);
      return;
    }

    get().likePost(postId);
  },

  addComment: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, comment_count: post.comment_count + 1 }
          : post,
      ),
    })),

  createPost: ({
    authorId,
    author,
    clubId,
    eventId = null,
    content,
    mediaUrls = [],
    mediaItems = [],
    type = 'club_update',
    isPinned = false,
  }) => {
    const nextPost: Post = {
      id: `post-${Date.now()}`,
      author_id: authorId,
      author,
      club_id: clubId,
      event_id: eventId,
      club: undefined,
      type,
      content: content.trim(),
      media_urls: mediaUrls,
      media_items: mediaItems,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      is_pinned: isPinned,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_liked: false,
    };

    set((state) => ({
      posts: [nextPost, ...state.posts],
    }));

    return nextPost;
  },

  hydratePosts: (posts) =>
    set((state) => ({
      posts: mergePosts(state.posts, posts),
    })),

  refresh: () => {
    set({ refreshing: true });
    setTimeout(() => {
      set({ refreshing: false });
    }, 800);
  },
}));

export function useFeed() {
  const store = useFeedStore();
  const { followingIds } = useSocialGraph();

  const filteredPosts = useMemo(() => {
    switch (store.activeTab) {
      case 'For You':
        return store.posts;
      case 'Following':
        return store.posts.filter((post) => followingIds.includes(post.author_id));
      case 'Trending':
        return [...store.posts].sort((left, right) => right.like_count - left.like_count);
      default:
        return store.posts;
    }
  }, [followingIds, store.posts, store.activeTab]);

  return {
    posts: filteredPosts,
    activeTab: store.activeTab,
    refreshing: store.refreshing,
    setActiveTab: store.setActiveTab,
    toggleLike: store.toggleLike,
    addComment: store.addComment,
    createPost: store.createPost,
    hydratePosts: store.hydratePosts,
    refresh: store.refresh,
  };
}

export function getCommentsForPost(postId: string): CommentWithReplies[] {
  return mockComments[postId] ?? [];
}

export function getAuthorHandle(authorId: string): string {
  return authorHandles[authorId] ?? '@unknown';
}

export { mockAuthors, authorHandles };
