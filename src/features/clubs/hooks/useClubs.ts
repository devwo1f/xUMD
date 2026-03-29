/**
 * useClubs Hook
 *
 * Provides filtered, sorted, and searchable club data from mock sources.
 */

import { useMemo, useState, useCallback } from 'react';
import { mockClubs, mockClubMembers, mockClubEvents, mockClubMedia, mockJoinRequests } from '../../../assets/data/mockClubs';
import type { Club, ClubCategory } from '../../../shared/types';

export type ClubSortOption = 'member_count' | 'name' | 'created_at';

interface UseClubsOptions {
  initialCategory?: string;
  initialSort?: ClubSortOption;
}

export function useClubs(options: UseClubsOptions = {}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(options.initialCategory ?? 'All');
  const [sort, setSort] = useState<ClubSortOption>(options.initialSort ?? 'member_count');
  const [refreshing, setRefreshing] = useState(false);

  const filteredClubs = useMemo(() => {
    let result = [...mockClubs];

    // Filter by category
    if (category !== 'All') {
      const categoryLower = category.toLowerCase() as ClubCategory;
      result = result.filter((club) => club.category === categoryLower);
    }

    // Filter by search
    const needle = search.trim().toLowerCase();
    if (needle.length > 0) {
      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(needle) ||
          club.short_description.toLowerCase().includes(needle) ||
          club.description.toLowerCase().includes(needle),
      );
    }

    // Sort
    switch (sort) {
      case 'member_count':
        result.sort((a, b) => b.member_count - a.member_count);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'created_at':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [search, category, sort]);

  const getClubById = useCallback((id: string): Club | undefined => {
    return mockClubs.find((club) => club.id === id || club.slug === id);
  }, []);

  const getClubMembers = useCallback((clubId: string) => {
    return mockClubMembers.filter((m) => m.club_id === clubId);
  }, []);

  const getClubEvents = useCallback((clubId: string) => {
    return mockClubEvents.filter((e) => e.club_id === clubId);
  }, []);

  const getClubMedia = useCallback((clubId: string) => {
    return mockClubMedia.filter((m) => m.club_id === clubId);
  }, []);

  const getJoinRequests = useCallback((clubId: string) => {
    return mockJoinRequests.filter((r) => r.club_id === clubId);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate network delay
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return {
    clubs: filteredClubs,
    search,
    setSearch,
    category,
    setCategory,
    sort,
    setSort,
    refreshing,
    onRefresh,
    getClubById,
    getClubMembers,
    getClubEvents,
    getClubMedia,
    getJoinRequests,
  };
}
