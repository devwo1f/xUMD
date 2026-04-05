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

interface CrossTabNavState {
  pendingMapFocus: PendingMapFocus | null;
  setPendingMapFocus: (focus: PendingMapFocus) => void;
  clearPendingMapFocus: () => void;
}

export const useCrossTabNavStore = create<CrossTabNavState>((set) => ({
  pendingMapFocus: null,
  setPendingMapFocus: (pendingMapFocus) => set({ pendingMapFocus }),
  clearPendingMapFocus: () => set({ pendingMapFocus: null }),
}));
