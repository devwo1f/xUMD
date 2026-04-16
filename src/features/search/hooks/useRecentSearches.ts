import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecentSearch, SearchEntityType } from '../types';
import { isSupabaseConfigured, supabase } from '../../../services/supabase';

const STORAGE_KEY = 'xumd:recent-searches';
const MAX_RECENT_SEARCHES = 20;

type SavedSearchRow = {
  id: string;
  query: string;
  filters: {
    result_type?: SearchEntityType;
    result_id?: string;
    timestamp?: number;
  } | null;
  created_at: string;
};

function sanitizeRecentSearches(value: unknown): RecentSearch[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is RecentSearch => Boolean(entry) && typeof entry === 'object' && typeof (entry as RecentSearch).query === 'string')
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, MAX_RECENT_SEARCHES);
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        if (isSupabaseConfigured) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user?.id) {
            const nextUserId = session.user.id;
            setRemoteUserId(nextUserId);

            const { data, error } = await supabase
              .from('saved_searches')
              .select('id, query, filters, created_at')
              .eq('user_id', nextUserId)
              .order('created_at', { ascending: false })
              .limit(MAX_RECENT_SEARCHES);

            if (!error && isMounted) {
              setRecentSearches(
                sanitizeRecentSearches(
                  (data ?? []).map((row) => ({
                    query: (row as SavedSearchRow).query,
                    timestamp:
                      (row as SavedSearchRow).filters?.timestamp ??
                      new Date((row as SavedSearchRow).created_at).getTime(),
                    result_type: (row as SavedSearchRow).filters?.result_type,
                    result_id: (row as SavedSearchRow).filters?.result_id,
                  })),
                ),
              );
              return;
            }
          }
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) {
          return;
        }

        setRecentSearches(sanitizeRecentSearches(stored ? JSON.parse(stored) : []));
      } catch {
        if (isMounted) {
          setRecentSearches([]);
        }
      } finally {
        if (isMounted) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const persist = useCallback(async (nextValue: RecentSearch[]) => {
    setRecentSearches(nextValue);
    if (isSupabaseConfigured && remoteUserId) {
      const deduped = sanitizeRecentSearches(nextValue);
      await supabase.from('saved_searches').delete().eq('user_id', remoteUserId);
      if (deduped.length > 0) {
        await supabase.from('saved_searches').insert(
          deduped.map((entry) => ({
            user_id: remoteUserId,
            query: entry.query,
            filters: {
              result_type: entry.result_type,
              result_id: entry.result_id,
              timestamp: entry.timestamp,
            },
          })),
        );
      }
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
  }, [remoteUserId]);

  const addSearch = useCallback(
    async (query: string, resultType?: SearchEntityType, resultId?: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return;
      }

      const nextEntry: RecentSearch = {
        query: trimmed,
        timestamp: Date.now(),
        result_type: resultType,
        result_id: resultId,
      };

      const nextValue = [
        nextEntry,
        ...recentSearches.filter((entry) => entry.query.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES);

      await persist(nextValue);
    },
    [persist, recentSearches],
  );

  const removeSearch = useCallback(
    async (query: string) => {
      const nextValue = recentSearches.filter((entry) => entry.query !== query);
      await persist(nextValue);
    },
    [persist, recentSearches],
  );

  const clearAll = useCallback(async () => {
    if (isSupabaseConfigured && remoteUserId) {
      await supabase.from('saved_searches').delete().eq('user_id', remoteUserId);
      setRecentSearches([]);
      return;
    }

    await AsyncStorage.removeItem(STORAGE_KEY);
    setRecentSearches([]);
  }, [remoteUserId]);

  return {
    recentSearches,
    hydrated,
    addSearch,
    removeSearch,
    clearAll,
  };
}
