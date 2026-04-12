import { create } from 'zustand';
import { EventCategory } from '../../../shared/types';
import type { MapSortOption, MapTimeFilter } from '../types';

export interface CustomRangeFilter {
  start: string;
  end: string;
}

interface MapFilterState {
  selectedCategories: EventCategory[];
  timeFilter: MapTimeFilter;
  sortBy: MapSortOption;
  onlyFriendsAttending: boolean;
  customRange: CustomRangeFilter | null;
  searchQuery: string;
  isFilterModalOpen: boolean;
  showActivityLayer: boolean;
  setSearchQuery: (query: string) => void;
  setTimeFilter: (timeFilter: MapTimeFilter) => void;
  setSortBy: (sortBy: MapSortOption) => void;
  setCustomRange: (range: CustomRangeFilter | null) => void;
  setOnlyFriendsAttending: (value: boolean) => void;
  setFilterModalOpen: (value: boolean) => void;
  setShowActivityLayer: (value: boolean) => void;
  toggleCategory: (category: EventCategory | 'all') => void;
  reset: () => void;
}

const initialState = {
  selectedCategories: [] as EventCategory[],
  timeFilter: 'this_week' as MapTimeFilter,
  sortBy: 'soonest' as MapSortOption,
  onlyFriendsAttending: false,
  customRange: null as CustomRangeFilter | null,
  searchQuery: '',
  isFilterModalOpen: false,
  showActivityLayer: false,
};

export function isHeatmapMode(selectedCategories: EventCategory[]) {
  return selectedCategories.length === 0;
}

export const useMapFilterStore = create<MapFilterState>((set) => ({
  ...initialState,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTimeFilter: (timeFilter) => set({ timeFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setCustomRange: (customRange) => set({ customRange }),
  setOnlyFriendsAttending: (onlyFriendsAttending) => set({ onlyFriendsAttending }),
  setFilterModalOpen: (isFilterModalOpen) => set({ isFilterModalOpen }),
  setShowActivityLayer: (showActivityLayer) => set({ showActivityLayer }),
  toggleCategory: (category) =>
    set((state) => {
      if (category === 'all') {
        return { selectedCategories: [] };
      }

      const next = state.selectedCategories.includes(category)
        ? state.selectedCategories.filter((item) => item !== category)
        : [...state.selectedCategories, category];

      return {
        selectedCategories: next,
      };
    }),
  reset: () =>
    set({
      ...initialState,
    }),
}));
