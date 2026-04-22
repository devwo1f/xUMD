import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchLatestArticles, fetchArticlesPage } from '../../../services/umdArticles';

export function useTodayNews(limit = 5) {
  const query = useQuery({
    queryKey: ['umd-articles', 'latest', limit],
    queryFn: () => fetchLatestArticles(limit),
    staleTime: 5 * 60_000,
  });

  return {
    articles: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useNewsArchive(category?: string) {
  const query = useInfiniteQuery({
    queryKey: ['umd-articles', 'archive', category ?? 'all'],
    queryFn: ({ pageParam = 1 }) =>
      fetchArticlesPage({ page: pageParam, pageSize: 20, category }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 5 * 60_000,
  });

  const articles = query.data?.pages.flatMap((page) => page.articles) ?? [];

  return {
    articles,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error instanceof Error ? query.error.message : null,
    hasMore: query.hasNextPage ?? false,
    fetchMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
    refetch: query.refetch,
  };
}
