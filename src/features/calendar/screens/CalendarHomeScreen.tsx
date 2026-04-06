import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameMonth,
  parseISO,
  startOfDay,
  subMonths,
  subWeeks,
} from 'date-fns';
import BottomSheet from '../../../shared/components/BottomSheet';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { useCrossTabNavStore } from '../../../shared/stores/useCrossTabNavStore';
import { createClubUrl, createEventUrl } from '../../../navigation/deepLinks';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CalendarStackParamList } from '../../../navigation/types';
import { useCalendarEntries } from '../hooks/useCalendarEntries';
import type { CalendarEntry, CalendarViewMode } from '../types';
import {
  buildEntryLayout,
  countEntriesForDate,
  formatCalendarTime,
  getEntryBorderStyle,
  getMonthCells,
  getWeekDays,
  getTimelineMetrics,
} from '../utils/calendar';

const VIEW_OPTIONS: CalendarViewMode[] = ['day', 'week', 'month'];
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 23;
const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, index) => DAY_START_HOUR + index);

function formatViewLabel(viewMode: CalendarViewMode, currentDate: Date) {
  if (viewMode === 'day') {
    return format(currentDate, 'EEEE, MMM d, yyyy');
  }

  if (viewMode === 'month') {
    return format(currentDate, 'MMMM yyyy');
  }

  const weekDays = getWeekDays(currentDate);
  return `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;
}

function DayColumn({
  date,
  entries,
  highlightedEntryId,
  onEntryPress,
  compact = false,
}: {
  date: Date;
  entries: CalendarEntry[];
  highlightedEntryId: string | null;
  onEntryPress: (entry: CalendarEntry) => void;
  compact?: boolean;
}) {
  const layout = useMemo(() => buildEntryLayout(entries), [entries]);
  const columnWidth = compact ? 112 : 146;

  return (
    <View style={[styles.dayColumn, { width: columnWidth }]}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderLabel}>{format(date, 'EEE')}</Text>
        <Text style={styles.dayHeaderDate}>{format(date, 'd')}</Text>
      </View>
      <View style={[styles.dayTimeline, { height: (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT }]}> 
        {entries.map((entry) => {
          const metrics = getTimelineMetrics(entry, DAY_START_HOUR, HOUR_HEIGHT);
          const lane = layout.get(entry.id)?.lane ?? 0;
          const laneCount = layout.get(entry.id)?.laneCount ?? 1;
          const horizontalGap = 4;
          const availableWidth = columnWidth - 14;
          const width = availableWidth / laneCount - horizontalGap;
          const left = lane * (availableWidth / laneCount) + 7;
          const highlighted = highlightedEntryId === entry.id;

          return (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={`${entry.title} at ${formatCalendarTime(entry)}`}
              onPress={() => onEntryPress(entry)}
              style={[
                styles.calendarBlock,
                {
                  top: metrics.top,
                  left,
                  width,
                  minHeight: metrics.height,
                  backgroundColor: entry.isDashed ? `${entry.color}18` : entry.color,
                  borderColor: highlighted ? colors.primary.dark : entry.color,
                  borderStyle: getEntryBorderStyle(entry),
                },
                highlighted && styles.calendarBlockHighlighted,
              ]}
            >
              <Text style={[styles.calendarBlockTitle, entry.isDashed && styles.calendarBlockTitleSoft]} numberOfLines={2}>
                {entry.title}
              </Text>
              <Text style={[styles.calendarBlockMeta, entry.isDashed && styles.calendarBlockMetaSoft]} numberOfLines={1}>
                {format(parseISO(entry.startsAt), 'h:mm a')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function CalendarHomeScreen({ navigation }: NativeStackScreenProps<CalendarStackParamList, 'CalendarHome'>) {
  const { isWide, isDesktop } = useResponsive();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [showConflictsSheet, setShowConflictsSheet] = useState(false);
  const [courseNote, setCourseNote] = useState('');
  const pendingCalendarFocus = useCrossTabNavStore((state) => state.pendingCalendarFocus);
  const clearPendingCalendarFocus = useCrossTabNavStore((state) => state.clearPendingCalendarFocus);
  const setPendingMapFocus = useCrossTabNavStore((state) => state.setPendingMapFocus);

  const {
    entries,
    conflicts,
    todayEntries,
    selectedDayEntries,
    todayConflicts,
    upNextEntry,
    sourceLoading,
    sourceError,
    getConflictsForAnchorDate,
    removePersonalBlock,
  } = useCalendarEntries({
    anchorDate: currentDate,
    viewMode,
  });

  useEffect(() => {
    if (!pendingCalendarFocus) {
      return;
    }

    setCurrentDate(new Date(pendingCalendarFocus.date));
    if (pendingCalendarFocus.showConflicts) {
      setShowConflictsSheet(true);
    }
    if (pendingCalendarFocus.entryId) {
      const nextEntry = entries.find((entry) => entry.id === pendingCalendarFocus.entryId || entry.sourceId === pendingCalendarFocus.entryId);
      if (nextEntry) {
        setSelectedEntry(nextEntry);
      }
    }

    clearPendingCalendarFocus();
  }, [clearPendingCalendarFocus, entries, pendingCalendarFocus]);

  const anchorDateKey = currentDate.toISOString().slice(0, 10);
  const highlightedEntryId = selectedEntry?.id ?? null;
  const anchorConflicts = getConflictsForAnchorDate();
  const monthCells = useMemo(() => getMonthCells(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const timelineHeight = (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT;
  const activeEntries = viewMode === 'day' ? selectedDayEntries : entries;

  const navigateRange = (direction: 'prev' | 'next') => {
    setSelectedEntry(null);
    setCurrentDate((current) => {
      if (viewMode === 'day') {
        return addDays(current, direction === 'next' ? 1 : -1);
      }
      if (viewMode === 'month') {
        return direction === 'next' ? addMonths(current, 1) : subMonths(current, 1);
      }
      return direction === 'next' ? addWeeks(current, 1) : subWeeks(current, 1);
    });
  };

  const showEntryOnMap = (entry: CalendarEntry) => {
    if (typeof entry.latitude !== 'number' || typeof entry.longitude !== 'number') {
      Alert.alert('Map unavailable', 'This entry does not have a campus location yet.');
      return;
    }

    if (entry.eventId) {
      setPendingMapFocus({
        type: 'event',
        eventId: entry.eventId,
        latitude: entry.latitude,
        longitude: entry.longitude,
      });
    } else {
      setPendingMapFocus({
        type: 'location',
        locationId: entry.locationId ?? entry.sourceId,
        label: entry.locationName,
        latitude: entry.latitude,
        longitude: entry.longitude,
      });
    }

    navigation.getParent()?.navigate('Map' as never);
  };

  const openEntryDetail = (entry: CalendarEntry) => {
    if (entry.type === 'club_meeting' && entry.clubId) {
      navigation.navigate('ClubDetail', { clubId: entry.clubId });
      return;
    }

    if ((entry.type === 'event_going' || entry.type === 'event_interested') && entry.eventId) {
      navigation.navigate('EventDetail', { eventId: entry.eventId });
      return;
    }

    setSelectedEntry(entry);
  };

  const handleDeletePersonal = async () => {
    if (!selectedEntry || selectedEntry.type !== 'personal') {
      return;
    }

    await removePersonalBlock(selectedEntry.sourceId);
    setSelectedEntry(null);
  };

  const openGoogleDirections = async () => {
    if (!selectedEntry || typeof selectedEntry.latitude !== 'number' || typeof selectedEntry.longitude !== 'number') {
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedEntry.latitude},${selectedEntry.longitude}&travelmode=walking`;
    await Linking.openURL(url);
  };

  const shareEntry = async () => {
    if (!selectedEntry) {
      return;
    }

    const deepLink = selectedEntry.eventId
      ? createEventUrl(selectedEntry.eventId)
      : selectedEntry.clubId
        ? createClubUrl(selectedEntry.clubId)
        : null;

    await Share.share({
      message: `${selectedEntry.title}\n${formatCalendarTime(selectedEntry)}\n${selectedEntry.locationName}${deepLink ? `\n${deepLink}` : ''}`,
    });
  };

  const monthConflictDates = new Set(conflicts.map((conflict) => conflict.date));

  return (
    <ScreenLayout
      title="Calendar"
      subtitle={sourceLoading ? 'Syncing your classes, RSVPs, clubs, and personal blocks...' : 'Everything that owns a piece of your day.'}
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="calendar-outline"
          label="Planner + Conflicts"
          color={colors.primary.main}
          tintColor={colors.primary.lightest}
        />
      }
      headerStyle={styles.headerShell}
      rightAction={
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('AddPersonalBlock')} style={styles.iconButton}>
            <Ionicons name="add" size={20} color={colors.text.primary} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('CalendarSyncSettings')} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={20} color={colors.text.primary} />
          </Pressable>
        </View>
      }
    >
      <View style={[styles.overviewGrid, isWide && styles.overviewGridWide]}>
        <Card style={[styles.segmentedCard, isWide && styles.overviewCardWide]}>
          <View style={styles.segmentedRow}>
            {VIEW_OPTIONS.map((option) => {
              const selected = viewMode === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setViewMode(option)}
                  style={[styles.segmentedButton, selected && styles.segmentedButtonActive]}
                >
                  <Text style={[styles.segmentedLabel, selected && styles.segmentedLabelActive]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.navigatorRow, isDesktop && styles.navigatorRowWide]}>
            <Pressable onPress={() => navigateRange('prev')} style={styles.dateNavButton}>
              <Ionicons name="chevron-back" size={18} color={colors.text.primary} />
            </Pressable>
            <View style={styles.navigatorCopy}>
              <Text style={styles.navigatorLabel}>{formatViewLabel(viewMode, currentDate)}</Text>
              <Text style={styles.navigatorSubtle}>
                {viewMode === 'week' ? `${entries.length} entries in view` : `${activeEntries.length} entries in view`}
              </Text>
            </View>
            <Pressable onPress={() => navigateRange('next')} style={styles.dateNavButton}>
              <Ionicons name="chevron-forward" size={18} color={colors.text.primary} />
            </Pressable>
            <Pressable onPress={() => setCurrentDate(new Date())} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>
          </View>
        </Card>

        <Card style={[styles.upNextCard, isWide && styles.overviewCardWide]}>
          <View style={styles.upNextHeader}>
            <Text style={styles.sectionTitle}>Up Next</Text>
            <Text style={styles.sectionMeta}>{todayEntries.length} today</Text>
          </View>
          {upNextEntry ? (
            <Pressable onPress={() => openEntryDetail(upNextEntry)} style={styles.upNextContent}>
              <View style={[styles.upNextAccent, { backgroundColor: upNextEntry.color }]} />
              <View style={styles.upNextCopy}>
                <Text style={styles.upNextTitle}>{upNextEntry.title}</Text>
                <Text style={styles.upNextSubtitle}>{formatCalendarTime(upNextEntry)}</Text>
                <Text style={styles.upNextSubtitle}>{upNextEntry.locationName}</Text>
              </View>
            </Pressable>
          ) : (
            <Text style={styles.helperText}>
              Nothing is scheduled right now. Add a personal block or RSVP to an event to fill this out.
            </Text>
          )}
        </Card>
      </View>

      {sourceError ? (
        <Card>
          <Text style={styles.errorText}>{sourceError}</Text>
        </Card>
      ) : null}

      <Card style={[styles.calendarSurface, isWide && styles.calendarSurfaceWide]}>
        {viewMode === 'week' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.weekLayout}>
              <View style={styles.timeColumn}>
                <View style={styles.timeColumnSpacer} />
                {HOURS.map((hour) => (
                  <View key={hour} style={[styles.timeSlot, { height: HOUR_HEIGHT }]}> 
                    <Text style={styles.timeSlotLabel}>{format(new Date().setHours(hour, 0, 0, 0), 'ha')}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.weekColumnsRow}>
                {weekDays.map((date) => {
                  const dayEntries = entries.filter((entry) => entry.startsAt.slice(0, 10) === format(date, 'yyyy-MM-dd'));
                  return (
                    <DayColumn
                      key={date.toISOString()}
                      date={date}
                      entries={dayEntries}
                      highlightedEntryId={highlightedEntryId}
                      onEntryPress={openEntryDetail}
                      compact={!isWide}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>
        ) : null}

        {viewMode === 'day' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dayViewLayout}>
              <View style={styles.timeColumn}>
                <View style={styles.timeColumnSpacer} />
                {HOURS.map((hour) => (
                  <View key={hour} style={[styles.timeSlot, { height: HOUR_HEIGHT }]}> 
                    <Text style={styles.timeSlotLabel}>{format(new Date().setHours(hour, 0, 0, 0), 'ha')}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.dayViewColumn, { height: timelineHeight + 64 }]}> 
                <View style={styles.dayHeaderLarge}>
                  <Text style={styles.dayHeaderLabel}>{format(currentDate, 'EEEE')}</Text>
                  <Text style={styles.dayHeaderDate}>{format(currentDate, 'MMM d')}</Text>
                </View>
                <View style={[styles.dayTimeline, { height: timelineHeight }]}> 
                  {selectedDayEntries.map((entry) => {
                    const metrics = getTimelineMetrics(entry, DAY_START_HOUR, HOUR_HEIGHT);
                    const highlighted = highlightedEntryId === entry.id;
                    return (
                      <Pressable
                        key={entry.id}
                        onPress={() => openEntryDetail(entry)}
                        style={[
                          styles.dayViewBlock,
                          {
                            top: metrics.top,
                            height: metrics.height,
                            backgroundColor: entry.isDashed ? `${entry.color}18` : entry.color,
                            borderColor: highlighted ? colors.primary.dark : entry.color,
                            borderStyle: getEntryBorderStyle(entry),
                          },
                          highlighted && styles.calendarBlockHighlighted,
                        ]}
                      >
                        <Text style={[styles.calendarBlockTitle, entry.isDashed && styles.calendarBlockTitleSoft]}>{entry.title}</Text>
                        <Text style={[styles.calendarBlockMeta, entry.isDashed && styles.calendarBlockMetaSoft]}>{formatCalendarTime(entry)}</Text>
                        <Text style={[styles.calendarBlockMeta, entry.isDashed && styles.calendarBlockMetaSoft]} numberOfLines={1}>{entry.locationName}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        ) : null}

        {viewMode === 'month' ? (
          <View style={styles.monthWrap}>
            <View style={styles.monthHeaderRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                <Text key={label} style={styles.monthHeaderLabel}>{label}</Text>
              ))}
            </View>
            <View style={styles.monthGrid}>
              {monthCells.map((date) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const count = countEntriesForDate(entries, date);
                const selected = anchorDateKey === dateKey;
                const hasConflict = monthConflictDates.has(dateKey);
                return (
                  <Pressable
                    key={dateKey}
                    onPress={() => {
                      setCurrentDate(date);
                      setViewMode('day');
                    }}
                    style={[styles.monthCell, !isSameMonth(date, currentDate) && styles.monthCellMuted, selected && styles.monthCellSelected]}
                  >
                    <Text style={[styles.monthCellLabel, selected && styles.monthCellLabelSelected]}>{format(date, 'd')}</Text>
                    <View style={styles.monthDotsRow}>
                      {Array.from({ length: Math.min(3, count) }).map((_, index) => (
                        <View key={`${dateKey}-dot-${index}`} style={[styles.monthDot, { backgroundColor: colors.primary.main }]} />
                      ))}
                      {hasConflict ? <Ionicons name="warning" size={12} color={colors.status.warning} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </Card>

      <Pressable onPress={() => setShowConflictsSheet(true)} style={styles.conflictSummaryBar}>
        <View style={styles.conflictSummaryLeft}>
          <Ionicons name="warning-outline" size={18} color={colors.status.warning} />
          <Text style={styles.conflictSummaryText}>{conflicts.length} conflict{conflicts.length === 1 ? '' : 's'} in this view</Text>
        </View>
        <Ionicons name="chevron-up" size={18} color={colors.text.secondary} />
      </Pressable>

      <BottomSheet visible={showConflictsSheet} onClose={() => setShowConflictsSheet(false)} snapPoints={[0.56]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Conflict Summary</Text>
          <Text style={styles.sheetSubtitle}>We found these overlaps and tight campus transitions.</Text>
          {(viewMode === 'day' ? anchorConflicts : conflicts).length > 0 ? (
            (viewMode === 'day' ? anchorConflicts : conflicts).map((conflict) => (
              <Card key={conflict.id} style={styles.conflictCard}>
                <View style={styles.conflictHeader}>
                  <Text style={styles.conflictTitle}>{conflict.title}</Text>
                  <Text style={styles.conflictDate}>{format(new Date(conflict.date), 'MMM d')}</Text>
                </View>
                <Text style={styles.conflictBody}>{conflict.detail}</Text>
              </Card>
            ))
          ) : (
            <Card>
              <Text style={styles.helperText}>No conflicts in the current range. You are clear.</Text>
            </Card>
          )}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={Boolean(selectedEntry)} onClose={() => setSelectedEntry(null)} snapPoints={[0.6]}>
        {selectedEntry ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{selectedEntry.title}</Text>
            <Text style={styles.sheetSubtitle}>{selectedEntry.sourceLabel}</Text>
            <Card style={styles.detailCard}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{formatCalendarTime(selectedEntry)}</Text>
              <Text style={styles.detailMeta}>{format(parseISO(selectedEntry.startsAt), 'EEEE, MMM d')}</Text>
            </Card>
            <Card style={styles.detailCard}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{selectedEntry.locationName}</Text>
              {selectedEntry.detail ? <Text style={styles.detailMeta}>{selectedEntry.detail}</Text> : null}
            </Card>
            {selectedEntry.type === 'course' ? (
              <TextInput
                value={courseNote}
                onChangeText={setCourseNote}
                placeholder="Quick note for this class"
                placeholderTextColor={colors.text.tertiary}
                style={styles.noteInput}
              />
            ) : null}
            <View style={styles.sheetButtonGrid}>
              {(selectedEntry.type === 'event_going' || selectedEntry.type === 'event_interested') && selectedEntry.eventId ? (
                <Button title="Open Event" onPress={() => openEntryDetail(selectedEntry)} fullWidth />
              ) : null}
              {selectedEntry.type === 'club_meeting' && selectedEntry.clubId ? (
                <Button title="Open Club" onPress={() => openEntryDetail(selectedEntry)} fullWidth />
              ) : null}
              <Button title="Show on Map" variant="secondary" onPress={() => showEntryOnMap(selectedEntry)} fullWidth />
              {typeof selectedEntry.latitude === 'number' && typeof selectedEntry.longitude === 'number' ? (
                <Button title="Directions" variant="ghost" onPress={() => void openGoogleDirections()} fullWidth />
              ) : null}
              <Button title="Share" variant="ghost" onPress={() => void shareEntry()} fullWidth />
              {selectedEntry.type === 'personal' ? (
                <Button title="Delete Block" variant="danger" onPress={() => void handleDeletePersonal()} fullWidth />
              ) : null}
            </View>
          </ScrollView>
        ) : null}
      </BottomSheet>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerShell: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary.lightest,
    backgroundColor: '#FFFDFC',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  overviewGrid: {
    gap: spacing.md,
  },
  overviewGridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  overviewCardWide: {
    flex: 1,
  },
  segmentedCard: {
    gap: spacing.md,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
  },
  segmentedButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedButtonActive: {
    backgroundColor: colors.brand.white,
    ...shadows.sm,
  },
  segmentedLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  segmentedLabelActive: {
    color: colors.text.primary,
  },
  navigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navigatorRowWide: {
    flexWrap: 'nowrap',
  },
  navigatorCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  navigatorLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  navigatorSubtle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  dateNavButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  todayButton: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  todayButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  upNextCard: {
    gap: spacing.md,
  },
  upNextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  upNextContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  upNextAccent: {
    width: 6,
    borderRadius: borderRadius.full,
  },
  upNextCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  upNextTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  upNextSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.status.error,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  calendarSurface: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  calendarSurfaceWide: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  weekLayout: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  weekColumnsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeColumn: {
    width: 56,
  },
  timeColumnSpacer: {
    height: 56,
  },
  timeSlot: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  timeSlotLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  dayColumn: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  dayHeader: {
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dayHeaderLarge: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dayHeaderLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  dayHeaderDate: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  dayTimeline: {
    position: 'relative',
  },
  calendarBlock: {
    position: 'absolute',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  dayViewLayout: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayViewColumn: {
    width: 320,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  dayViewBlock: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  calendarBlockHighlighted: {
    shadowColor: colors.primary.main,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  calendarBlockTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand.white,
  },
  calendarBlockTitleSoft: {
    color: colors.text.primary,
  },
  calendarBlockMeta: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.88)',
  },
  calendarBlockMetaSoft: {
    color: colors.text.secondary,
  },
  monthWrap: {
    gap: spacing.md,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthHeaderLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '14.285%',
    minHeight: 86,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.brand.white,
  },
  monthCellMuted: {
    backgroundColor: colors.background.secondary,
  },
  monthCellSelected: {
    borderColor: colors.primary.main,
  },
  monthCellLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  monthCellLabelSelected: {
    color: colors.primary.main,
  },
  monthDotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  monthDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
  },
  conflictSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  conflictSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  conflictSummaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  sheetContent: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sheetTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sheetSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  conflictCard: {
    gap: spacing.sm,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conflictTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  conflictDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  conflictBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  detailCard: {
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  detailMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  noteInput: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
  },
  sheetButtonGrid: {
    gap: spacing.sm,
  },
});
