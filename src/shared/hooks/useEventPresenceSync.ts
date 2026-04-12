import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getMyRsvps } from '../../services/events';
import { isSupabaseConfigured, supabase } from '../../services/supabase';
import { useDemoAppStore } from '../stores/useDemoAppStore';

export function useEventPresenceSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hydrateEventPresence = useDemoAppStore((state) => state.hydrateEventPresence);

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) {
      return;
    }

    let cancelled = false;

    const syncPresence = async () => {
      const result = await getMyRsvps(user.id);
      if (cancelled || result.error || !result.data) {
        return;
      }

      const goingEventIds = result.data
        .filter((entry) => (entry.status ?? 'going') === 'going')
        .map((entry) => entry.event_id);
      const savedEventIds = result.data
        .filter((entry) => entry.status === 'interested')
        .map((entry) => entry.event_id);

      hydrateEventPresence({ goingEventIds, savedEventIds });
    };

    void syncPresence();

    const rsvpChannel = supabase
      .channel(`xumd-event-rsvps-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_rsvps', filter: `user_id=eq.${user.id}` },
        () => {
          void syncPresence();
          void queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
          void queryClient.invalidateQueries({ queryKey: ['map-events'] });
          void queryClient.invalidateQueries({ queryKey: ['map-event-detail'] });
        },
      )
      .subscribe();

    const eventsChannel = supabase
      .channel('xumd-events-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['map-events'] });
        void queryClient.invalidateQueries({ queryKey: ['map-event-detail'] });
        void queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(rsvpChannel);
      void supabase.removeChannel(eventsChannel);
    };
  }, [hydrateEventPresence, queryClient, user?.id]);
}

export default useEventPresenceSync;
