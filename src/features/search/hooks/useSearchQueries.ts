import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { SearchEntityType } from '../types';
import { fetchAutocomplete, fetchDiscoveryHub, fetchUnifiedSearch } from '../../../services/search';

export const SEARCH_FEATURE_FLAGS = {
  voiceSearch: false,
  savedSearchNotifications: false,
} as const;

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

export function useAutocomplete(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ['search', 'autocomplete', query],
    queryFn: () => fetchAutocomplete(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useUnifiedSearch(query: string, entityTypes?: SearchEntityType[]) {
  return useQuery({
    queryKey: ['search', 'results', query, entityTypes ?? []],
    queryFn: () => fetchUnifiedSearch(query, entityTypes),
    enabled: query.trim().length >= 2,
    staleTime: 60_000,
  });
}

export function useDiscoveryHub() {
  return useQuery({
    queryKey: ['search', 'discovery'],
    queryFn: fetchDiscoveryHub,
    staleTime: 5 * 60_000,
  });
}
