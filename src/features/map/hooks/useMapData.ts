import { useCallback, useEffect, useMemo, useState } from 'react';
import { EventCategory, type Event } from '../../../shared/types';
import { mockCampusEvents } from '../../../assets/data/mockEvents';

export type TimeFilter = 'all' | 'happening_now' | 'today' | 'this_week';

function matchesTimeFilter(event: Event, filter: TimeFilter): boolean {
  if (filter === 'all') return true;

  const now = new Date();
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);

  switch (filter) {
    case 'happening_now':
      return start <= now && end >= now;
    case 'today': {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      return start <= todayEnd && end >= todayStart;
    }
    case 'this_week': {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return start <= weekEnd && end >= now;
    }
    default:
      return true;
  }
}

interface UseMapDataOptions {
  timeFilter?: TimeFilter;
  categoryFilter?: EventCategory;
  searchQuery?: string;
}

interface UseMapDataReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMapData(options: UseMapDataOptions = {}): UseMapDataReturn {
  const { timeFilter = 'all', categoryFilter, searchQuery } = options;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawEvents, setRawEvents] = useState<Event[]>([]);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        setRawEvents(mockCampusEvents);
      } catch {
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = fetchEvents();
    return cleanup;
  }, [fetchEvents]);

  const events = useMemo(() => {
    let filtered = rawEvents.filter((event) => matchesTimeFilter(event, timeFilter));

    if (categoryFilter) {
      filtered = filtered.filter((event) => event.category === categoryFilter);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const needle = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(needle) ||
          event.location_name.toLowerCase().includes(needle) ||
          event.description.toLowerCase().includes(needle),
      );
    }

    return filtered;
  }, [rawEvents, timeFilter, categoryFilter, searchQuery]);

  return { events, loading, error, refetch: fetchEvents };
}
