/**
 * useFeed Hook
 *
 * State management for the feed feature using Zustand.
 * Provides mock data, optimistic like/unlike, and feed type filtering.
 */

import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import type { Post, Comment, UserProfile, PostMediaItem } from '../../../shared/types';
import {
  mockPosts,
  mockComments,
  mockAuthors,
  authorHandles,
  type CommentWithReplies,
} from '../../../assets/data/mockFeed';
import { useSocialGraph } from '../../social/hooks/useSocialGraph';

// ── Feed Types ──────────────────────────────────────────────

export type FeedTab = 'For You' | 'Following' | 'Trending';

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
    content: string;
    mediaUrls?: string[];
    mediaItems?: PostMediaItem[];
    type?: string;
    isPinned?: boolean;
  }) => void;
  refresh: () => void;
}

// ── Zustand Store ───────────────────────────────────────────

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
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;
    if (post.is_liked) {
      get().unlikePost(postId);
    } else {
      get().likePost(postId);
    }
  },

  addComment: (postId, content) =>
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
    content,
    mediaUrls = [],
    mediaItems = [],
    type = 'club_update',
    isPinned = false,
  }) =>
    set((state) => ({
      posts: [
        {
          id: `post-${Date.now()}`,
          author_id: authorId,
          author,
          club_id: clubId,
          club: undefined,
          type,
          content: content.trim(),
          media_urls: mediaUrls,
          media_items: mediaItems,
          like_count: 0,
          comment_count: 0,
          is_pinned: isPinned,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_liked: false,
        },
        ...state.posts,
      ],
    })),

  refresh: () => {
    set({ refreshing: true });
    setTimeout(() => {
      set({ refreshing: false });
    }, 800);
  },
}));

// ── Convenience Hook ────────────────────────────────────────

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
        // Mock: sort by like count descending
        return [...store.posts].sort((a, b) => b.like_count - a.like_count);
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
    refresh: store.refresh,
  };
}

// ── Comment Helpers ─────────────────────────────────────────

export function getCommentsForPost(postId: string): CommentWithReplies[] {
  return mockComments[postId] ?? [];
}

export function getAuthorHandle(authorId: string): string {
  return authorHandles[authorId] ?? '@unknown';
}

export { mockAuthors, authorHandles };
