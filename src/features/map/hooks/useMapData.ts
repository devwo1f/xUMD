import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EventCategory, type Event } from '../../../shared/types';
import { supabase, isSupabaseConfigured } from '../../../services/supabase';
import { fetchMapEventsRemote, getFallbackMapEvents } from '../../../services/mapEvents';
import { filterAndSortEvents } from '../utils/eventDiscovery';

export type TimeFilter = 'all' | 'happening_now' | 'next_2_hours' | 'today' | 'this_week';

interface UseMapDataOptions {
  timeFilter?: TimeFilter;
  categoryFilter?: EventCategory;
  searchQuery?: string;
  onlyFriendsAttending?: boolean;
}

interface UseMapDataReturn {
  events: Event[];
  rawEvents: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  source: string;
}

export function useMapData(options: UseMapDataOptions = {}): UseMapDataReturn {
  const { timeFilter = 'all', categoryFilter, searchQuery, onlyFriendsAttending = false } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['map-events', 'upcoming-baseline', onlyFriendsAttending],
    staleTime: 60_000,
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return {
          items: getFallbackMapEvents(),
          generatedAt: new Date().toISOString(),
          source: 'mock',
        };
      }

      const rangeStart = new Date();
      const rangeEnd = new Date(rangeStart.getTime() + 180 * 24 * 60 * 60 * 1000);

      return fetchMapEventsRemote({
        timeFilter: 'custom',
        customRange: {
          start: rangeStart.toISOString(),
          end: rangeEnd.toISOString(),
        },
        onlyFriendsAttending,
      });
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const channel = supabase
      .channel('xumd-map-events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['map-events'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const rawEvents = query.data?.items ?? [];
  const events = useMemo(
    () =>
      filterAndSortEvents(rawEvents, {
        searchQuery: searchQuery ?? '',
        selectedCategories: categoryFilter ? [categoryFilter] : [],
        timeFilter,
        sortBy: 'soonest',
      }),
    [categoryFilter, rawEvents, searchQuery, timeFilter],
  );

  return {
    events,
    rawEvents,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: () => {
      void query.refetch();
    },
    source: query.data?.source ?? 'mock',
  };
}
