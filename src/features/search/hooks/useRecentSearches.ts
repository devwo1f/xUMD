import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecentSearch, SearchEntityType } from '../types';

const STORAGE_KEY = 'xumd:recent-searches';
const MAX_RECENT_SEARCHES = 20;

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

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
  }, []);

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
    await AsyncStorage.removeItem(STORAGE_KEY);
    setRecentSearches([]);
  }, []);

  return {
    recentSearches,
    hydrated,
    addSearch,
    removeSearch,
    clearAll,
  };
}
