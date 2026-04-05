import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type Building } from '../../../assets/data/buildings';
import type { Event, EventSearchResult } from '../../../shared/types';
import { isSupabaseConfigured } from '../../../services/supabase';
import { searchMapEventsRemote } from '../../../services/mapEvents';
import { buildCampusSearchResults } from '../utils/eventDiscovery';

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}

interface UseMapSearchResultsOptions {
  query: string;
  events: Event[];
  buildings: Building[];
}

export function useMapSearchResults({
  query,
  events,
  buildings,
}: UseMapSearchResultsOptions) {
  const debouncedQuery = useDebouncedValue(query.trim(), 180);

  const remoteQuery = useQuery({
    queryKey: ['map-search', debouncedQuery],
    enabled: isSupabaseConfigured && debouncedQuery.length >= 2,
    staleTime: 30_000,
    queryFn: async () => searchMapEventsRemote(debouncedQuery),
  });

  const fallbackResults =
    debouncedQuery.length >= 2 ? buildCampusSearchResults(debouncedQuery, events, buildings) : [];

  const fallbackSearchResults: EventSearchResult[] = fallbackResults.map((result) => ({
    id: result.id,
    type: result.type,
    title: result.title,
    subtitle: result.subtitle,
    latitude: result.coordinate[1],
    longitude: result.coordinate[0],
    event_ids: result.eventIds,
  }));

  const results: EventSearchResult[] = isSupabaseConfigured
    ? remoteQuery.data ?? fallbackSearchResults
    : fallbackSearchResults;

  return {
    results,
    isLoading: remoteQuery.isLoading,
    error: remoteQuery.error instanceof Error ? remoteQuery.error.message : null,
  };
}
