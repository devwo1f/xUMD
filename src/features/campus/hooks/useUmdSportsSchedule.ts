import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEventCatalogStore } from '../../../shared/stores/useEventCatalogStore';
import { fetchUmdSportsSchedule, isUmdSportsEventId } from '../../../services/umdSports';

export function useUmdSportsSchedule(enabled = true) {
  const hydrateEvents = useEventCatalogStore((state) => state.hydrateEvents);
  const query = useQuery({
    queryKey: ['umd-sports-schedule'],
    enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: fetchUmdSportsSchedule,
  });

  useEffect(() => {
    if (!query.data?.items?.length) {
      return;
    }

    hydrateEvents(query.data.items.map((item) => item.event));
  }, [hydrateEvents, query.data?.items]);

  const grouped = useMemo(() => {
    const items = query.data?.items ?? [];

    return {
      live: items.filter((item) => item.statusLabel === 'Live now'),
      upcoming: items.filter((item) => item.statusLabel === 'Upcoming'),
      finals: items.filter((item) => item.statusLabel === 'Final'),
      campusOnly: items.filter((item) => item.campusVenue),
      sports: Array.from(new Set(items.map((item) => item.sportTitle))),
    };
  }, [query.data?.items]);

  return {
    ...query,
    items: query.data?.items ?? [],
    grouped,
    getById: (eventId: string) => query.data?.items?.find((item) => item.id === eventId) ?? null,
    sportsEventIds: (query.data?.items ?? []).filter((item) => isUmdSportsEventId(item.id)).map((item) => item.id),
  };
}

