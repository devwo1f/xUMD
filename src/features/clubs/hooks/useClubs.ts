import { useMemo, useState, useCallback } from 'react';
import type { Club, ClubCategory } from '../../../shared/types';
import { useMapData } from '../../map/hooks/useMapData';
import { useCampusClubs } from './useCampusClubs';

export type ClubSortOption = 'member_count' | 'name' | 'created_at';

interface UseClubsOptions {
  initialCategory?: string;
  initialSort?: ClubSortOption;
}

export function useClubs(options: UseClubsOptions = {}) {
  const clubDirectory = useCampusClubs();
  const { rawEvents } = useMapData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(options.initialCategory ?? 'All');
  const [sort, setSort] = useState<ClubSortOption>(options.initialSort ?? 'member_count');
  const [refreshing, setRefreshing] = useState(false);

  const filteredClubs = useMemo(() => {
    let result = [...clubDirectory.clubs];

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
  }, [category, clubDirectory.clubs, search, sort]);

  const getClubById = useCallback((id: string): Club | undefined => {
    return clubDirectory.getClubById(id) ?? undefined;
  }, [clubDirectory]);

  const getClubMembers = useCallback((clubId: string) => {
    return clubDirectory.getClubMembers(clubId);
  }, [clubDirectory]);

  const getClubEvents = useCallback((clubId: string) => {
    return rawEvents.filter((event) => event.club_id === clubId);
  }, [rawEvents]);

  const getClubMedia = useCallback((clubId: string) => {
    return clubDirectory.getClubMedia(clubId);
  }, [clubDirectory]);

  const getJoinRequests = useCallback((clubId: string) => {
    return clubDirectory.getClubJoinRequests(clubId);
  }, [clubDirectory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void clubDirectory
      .refetch()
      .finally(() => setTimeout(() => setRefreshing(false), 300));
  }, [clubDirectory]);

  return {
    ...clubDirectory,
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
