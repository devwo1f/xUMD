import { create } from 'zustand';

export type PendingMapFocus =
  | {
      type: 'event';
      eventId: string;
      latitude: number;
      longitude: number;
    }
  | {
      type: 'location';
      locationId: string;
      label: string;
      latitude: number;
      longitude: number;
    };

export type PendingCalendarFocus = {
  date: string;
  entryId?: string;
  showConflicts?: boolean;
};

interface CrossTabNavState {
  pendingMapFocus: PendingMapFocus | null;
  pendingCalendarFocus: PendingCalendarFocus | null;
  setPendingMapFocus: (focus: PendingMapFocus) => void;
  setPendingCalendarFocus: (focus: PendingCalendarFocus) => void;
  clearPendingMapFocus: () => void;
  clearPendingCalendarFocus: () => void;
}

export const useCrossTabNavStore = create<CrossTabNavState>((set) => ({
  pendingMapFocus: null,
  pendingCalendarFocus: null,
  setPendingMapFocus: (pendingMapFocus) => set({ pendingMapFocus }),
  setPendingCalendarFocus: (pendingCalendarFocus) => set({ pendingCalendarFocus }),
  clearPendingMapFocus: () => set({ pendingMapFocus: null }),
  clearPendingCalendarFocus: () => set({ pendingCalendarFocus: null }),
}));
