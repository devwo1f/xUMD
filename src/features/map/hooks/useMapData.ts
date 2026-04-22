import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EventCategory, type Event } from '../../../shared/types';
import { useEventCatalogStore } from '../../../shared/stores/useEventCatalogStore';
import { supabase, isSupabaseConfigured } from '../../../services/supabase';
import { fetchMapEventsRemote, getFallbackMapEvents } from '../../../services/mapEvents';
import { isUmdSportsEventId } from '../../../services/umdSports';
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

function uniqueEvents(events: Event[]) {
  return [...new Map(events.map((event) => [event.id, event])).values()].sort(
    (left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
  );
}

export function useMapData(options: UseMapDataOptions = {}): UseMapDataReturn {
  const { timeFilter = 'all', categoryFilter, searchQuery, onlyFriendsAttending = false } = options;
  const queryClient = useQueryClient();
  const hydrateEvents = useEventCatalogStore((state) => state.hydrateEvents);
  const catalogEvents = useEventCatalogStore((state) => state.events);

  const query = useQuery({
    queryKey: ['map-events', 'upcoming-baseline', onlyFriendsAttending],
    staleTime: 60_000,
    queryFn: async () => {
      const buildFallbackResponse = (source: string) => ({
        items: getFallbackMapEvents(),
        generatedAt: new Date().toISOString(),
        source,
      });

      if (!isSupabaseConfigured) {
        return buildFallbackResponse('mock');
      }

      const rangeStart = new Date();
      const rangeEnd = new Date(rangeStart.getTime() + 180 * 24 * 60 * 60 * 1000);

      try {
        const remote = await fetchMapEventsRemote({
          timeFilter: 'custom',
          customRange: {
            start: rangeStart.toISOString(),
            end: rangeEnd.toISOString(),
          },
          onlyFriendsAttending,
        });

        if (remote.items.length > 0) {
          return remote;
        }

        return buildFallbackResponse('mock-fallback-empty');
      } catch {
        return buildFallbackResponse('mock-fallback-error');
      }
    },
  });

  useEffect(() => {
    if (query.data?.items?.length) {
      hydrateEvents(query.data.items);
    }
  }, [hydrateEvents, query.data?.items]);

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

  const supplementalSportsEvents = useMemo(
    () =>
      catalogEvents.filter(
        (event) =>
          isUmdSportsEventId(event.id) &&
          typeof event.latitude === 'number' &&
          typeof event.longitude === 'number',
      ),
    [catalogEvents],
  );
  const rawEvents = useMemo(
    () => uniqueEvents([...(query.data?.items ?? []), ...supplementalSportsEvents]),
    [query.data?.items, supplementalSportsEvents],
  );
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
