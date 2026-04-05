import { useQuery } from '@tanstack/react-query';
import { buildFallbackEventDetail, fetchMapEventDetailRemote } from '../../../services/mapEvents';
import { isSupabaseConfigured } from '../../../services/supabase';

export function useMapEventDetail(eventId: string | null) {
  return useQuery({
    queryKey: ['map-event-detail', eventId],
    enabled: Boolean(eventId),
    staleTime: 30_000,
    queryFn: async () => {
      if (!eventId) {
        return null;
      }

      if (!isSupabaseConfigured) {
        return buildFallbackEventDetail(eventId);
      }

      return fetchMapEventDetailRemote(eventId);
    },
  });
}
