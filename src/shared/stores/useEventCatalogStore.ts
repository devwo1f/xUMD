import { create } from 'zustand';
import { mockCampusEvents } from '../../assets/data/mockEvents';
import { mockClubEvents } from '../../assets/data/mockClubs';
import type { Event } from '../types';

function uniqueEvents(events: Event[]) {
  return [...new Map(events.map((event) => [event.id, event])).values()].sort(
    (left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
  );
}

function mergeEvents(existing: Event[], incoming: Event[]) {
  const existingById = new Map(existing.map((event) => [event.id, event]));
  const mergedIncoming = incoming.map((event) => ({
    ...(existingById.get(event.id) ?? {}),
    ...event,
  }));
  const incomingIds = new Set(incoming.map((event) => event.id));
  const remainder = existing.filter((event) => !incomingIds.has(event.id));
  return uniqueEvents([...mergedIncoming, ...remainder]);
}

export function getInitialEventCatalog() {
  return uniqueEvents([...mockCampusEvents, ...mockClubEvents]);
}

interface EventCatalogState {
  events: Event[];
  hydrateEvents: (events: Event[]) => void;
  upsertEvent: (event: Event) => void;
  reset: () => void;
}

export const useEventCatalogStore = create<EventCatalogState>((set) => ({
  events: getInitialEventCatalog(),
  hydrateEvents: (events) =>
    set((state) => ({
      events: mergeEvents(state.events, events),
    })),
  upsertEvent: (event) =>
    set((state) => ({
      events: mergeEvents(state.events, [event]),
    })),
  reset: () =>
    set({
      events: getInitialEventCatalog(),
    }),
}));

export function getEventCatalog() {
  return useEventCatalogStore.getState().events;
}
