import { useEffect, useState } from 'react';
import type { Post } from '../../../shared/types';
import { isSupabaseConfigured } from '../../../services/supabase';
import {
  fetchRemoteFeed,
  fetchTrendingSnapshot,
  toggleRemotePostLike,
  type RemoteFeedMode,
  type RemoteTrendingHashtag,
} from '../../../services/social';
import { useFeed, useFeedStore } from './useFeed';

const feedModeByTab = {
  'For You': 'for_you',
  Following: 'following',
  Trending: 'trending',
} as const;

export function useCampusFeed() {
  const demo = useFeed();
  const hydratePosts = useFeedStore((state) => state.hydratePosts);
  const [activeTab, setActiveTab] = useState<keyof typeof feedModeByTab>('For You');
  const [posts, setPosts] = useState<Array<Post & { suggested_reason?: string | null; score?: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<RemoteTrendingHashtag[]>([]);

  const isRemote = isSupabaseConfigured;
  const remoteMode = feedModeByTab[activeTab] as RemoteFeedMode;

  const loadFeed = async (cursor?: string | null, replace = true) => {
    if (!isRemote) {
      return;
    }

    if (replace) {
      setLoading(true);
    }

    try {
      const [feed, trending] = await Promise.all([
        fetchRemoteFeed(remoteMode, cursor, 20),
        activeTab === 'Trending' || hashtags.length === 0 ? fetchTrendingSnapshot() : Promise.resolve(null),
      ]);

      hydratePosts(feed.items);
      setPosts((current) => (replace ? feed.items : [...current, ...feed.items]));
      setNextCursor(feed.nextCursor);
      if (trending) {
        setHashtags(trending.hashtags);
      }
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load your feed right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isRemote) {
      return;
    }

    void loadFeed(undefined, true);
  }, [activeTab, isRemote]);

  const toggleLike = async (postId: string) => {
    if (!isRemote) {
      demo.toggleLike(postId);
      return;
    }

    const current = posts.find((post) => post.id === postId);
    if (!current) {
      return;
    }

    setPosts((existing) =>
      existing.map((post) =>
        post.id === postId
          ? {
              ...post,
              is_liked: !post.is_liked,
              like_count: Math.max(0, post.like_count + (post.is_liked ? -1 : 1)),
            }
          : post,
      ),
    );
    demo.toggleLike(postId);

    try {
      await toggleRemotePostLike(postId, Boolean(current.is_liked));
    } catch (nextError) {
      setPosts((existing) =>
        existing.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: current.is_liked,
                like_count: current.like_count,
              }
            : post,
        ),
      );
      demo.toggleLike(postId);
      setError(nextError instanceof Error ? nextError.message : 'Unable to update your like.');
    }
  };

  const loadMore = async () => {
    if (!isRemote || !nextCursor || loading) {
      return;
    }

    await loadFeed(nextCursor, false);
  };

  if (!isRemote) {
    return {
      ...demo,
      posts: demo.posts,
      activeTab: demo.activeTab,
      setActiveTab: demo.setActiveTab,
      loading: false,
      error: null,
      hashtags: [] as RemoteTrendingHashtag[],
      hasMore: false,
      loadMore: async () => undefined,
      refresh: () => demo.refresh(),
    };
  }

  return {
    posts,
    activeTab,
    setActiveTab: (tab: keyof typeof feedModeByTab) => {
      setNextCursor(null);
      setActiveTab(tab);
    },
    refreshing,
    loading,
    error,
    hashtags,
    hasMore: Boolean(nextCursor),
    toggleLike,
    addComment: demo.addComment,
    createPost: demo.createPost,
    loadMore,
    refresh: () => {
      setRefreshing(true);
      void loadFeed(undefined, true);
    },
  };
}
