import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { useAuth } from '../../auth/hooks/useAuth';
import { useProfile } from '../../profile/hooks/useProfile';
import { useCampusClubs } from '../../clubs/hooks/useCampusClubs';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import {
  buildCalendarConflicts,
  buildCalendarEntries,
  buildMiniCalendarSummary,
  buildTodayEntries,
  getCalendarRange,
  getConflictsForDate,
  getUpNextEntry,
} from '../utils/calendar';
import {
  buildCalendarFeedUrl,
  deletePersonalCalendarBlock,
  loadCalendarSourceData,
  loadCalendarSyncPreferences,
  regenerateCalendarSyncToken,
  saveCalendarSyncPreferences,
  upsertPersonalCalendarBlock,
} from '../services/calendar';
import type { CalendarSyncPreferences, CalendarViewMode, PersonalCalendarBlock } from '../types';

export function useCalendarEntries({
  anchorDate,
  viewMode,
}: {
  anchorDate: Date;
  viewMode: CalendarViewMode;
}) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { user: profileUser } = useProfile();
  const { viewerClubIds } = useCampusClubs();
  const { goingEventIds, savedEventIds } = useDemoAppStore();

  const viewerId = authUser?.id ?? profileUser.id;
  const viewer = authUser ?? null;
  const joinedClubKey = viewerClubIds.slice().sort().join('|');

  const sourceQuery = useQuery({
    queryKey: ['calendar-data', viewerId, joinedClubKey],
    staleTime: 60_000,
    queryFn: () =>
      loadCalendarSourceData({
        viewerId,
        user: viewer,
        joinedClubIds: viewerClubIds,
        goingEventIds,
        interestedEventIds: savedEventIds,
      }),
  });

  const syncQuery = useQuery({
    queryKey: ['calendar-sync', viewerId],
    staleTime: Infinity,
    queryFn: () => loadCalendarSyncPreferences(viewerId),
  });

  const range = useMemo(() => getCalendarRange(anchorDate, viewMode), [anchorDate, viewMode]);
  const sourceData = sourceQuery.data ?? {
    courses: [],
    clubMeetings: [],
    eventRsvps: [],
    personalBlocks: [],
  };
  const entries = useMemo(() => buildCalendarEntries(sourceData, range), [range, sourceData]);
  const conflicts = useMemo(() => buildCalendarConflicts(entries), [entries]);
  const todayEntries = useMemo(() => buildTodayEntries(sourceData), [sourceData]);
  const todayConflicts = useMemo(() => buildCalendarConflicts(todayEntries), [todayEntries]);
  const anchorDateKey = useMemo(() => format(anchorDate, 'yyyy-MM-dd'), [anchorDate]);
  const anchorDayStart = useMemo(() => startOfDay(anchorDate), [anchorDate]);
  const anchorDayEnd = useMemo(() => addDays(anchorDayStart, 1), [anchorDayStart]);
  const selectedDayEntries = useMemo(
    () =>
      entries.filter(
        (entry) => parseISO(entry.startsAt) < anchorDayEnd && parseISO(entry.endsAt) > anchorDayStart,
      ),
    [anchorDateKey, anchorDayEnd, anchorDayStart, entries],
  );
  const upNextEntry = useMemo(() => getUpNextEntry(todayEntries), [todayEntries]);
  const miniSummary = useMemo(() => buildMiniCalendarSummary(todayEntries), [todayEntries]);

  const invalidateCalendar = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['calendar-data', viewerId] }),
      queryClient.invalidateQueries({ queryKey: ['calendar-sync', viewerId] }),
    ]);
  };

  const addOrUpdatePersonalBlock = async (
    block: Omit<PersonalCalendarBlock, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => {
    const next = await upsertPersonalCalendarBlock(viewerId, block);
    await queryClient.invalidateQueries({ queryKey: ['calendar-data', viewerId] });
    return next;
  };

  const removePersonalBlock = async (blockId: string) => {
    await deletePersonalCalendarBlock(viewerId, blockId);
    await queryClient.invalidateQueries({ queryKey: ['calendar-data', viewerId] });
  };

  const updateSyncPreferences = async (updates: Partial<CalendarSyncPreferences>) => {
    const nextPreferences = {
      ...(syncQuery.data ?? {
        token: '',
        includeCourses: true,
        includeEventsGoing: true,
        includeEventsInterested: false,
        includeClubMeetings: true,
        includePersonalBlocks: true,
        lastSyncedAt: null,
      }),
      ...updates,
    } satisfies CalendarSyncPreferences;

    await saveCalendarSyncPreferences(viewerId, nextPreferences);
    await queryClient.invalidateQueries({ queryKey: ['calendar-sync', viewerId] });
    return nextPreferences;
  };

  const regenerateSyncToken = async () => {
    const next = await regenerateCalendarSyncToken(viewerId);
    await queryClient.invalidateQueries({ queryKey: ['calendar-sync', viewerId] });
    return next;
  };

  const feedUrl = syncQuery.data ? buildCalendarFeedUrl(syncQuery.data) : null;

  return {
    viewerId,
    range,
    sourceData,
    entries,
    conflicts,
    todayEntries,
    todayConflicts,
    selectedDayEntries,
    upNextEntry,
    miniSummary,
    sourceLoading: sourceQuery.isLoading,
    sourceError: sourceQuery.error instanceof Error ? sourceQuery.error.message : null,
    syncPreferences: syncQuery.data ?? null,
    syncLoading: syncQuery.isLoading,
    feedUrl,
    addOrUpdatePersonalBlock,
    removePersonalBlock,
    updateSyncPreferences,
    regenerateSyncToken,
    invalidateCalendar,
    refetch: () => {
      void sourceQuery.refetch();
    },
    getConflictsForAnchorDate: () => getConflictsForDate(conflicts, anchorDate),
  };
}
