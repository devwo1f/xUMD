import { create } from 'zustand';
import type { CreateEventLocationSelection } from '../utils/createEventDraft';

interface CreateEventLocationState {
  selectedLocation: CreateEventLocationSelection | null;
  lastUpdatedAt: number;
  setSelectedLocation: (location: CreateEventLocationSelection) => void;
  clearSelectedLocation: () => void;
}

export const useCreateEventLocationStore = create<CreateEventLocationState>((set) => ({
  selectedLocation: null,
  lastUpdatedAt: 0,
  setSelectedLocation: (selectedLocation) =>
    set({
      selectedLocation,
      lastUpdatedAt: Date.now(),
    }),
  clearSelectedLocation: () =>
    set({
      selectedLocation: null,
      lastUpdatedAt: 0,
    }),
}));
