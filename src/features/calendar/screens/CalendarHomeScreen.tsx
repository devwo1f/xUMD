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
  isSameDay,
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

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((value) => `${value}${value}`).join('')
    : normalized;

  const red = parseInt(full.slice(0, 2), 16);
  const green = parseInt(full.slice(2, 4), 16);
  const blue = parseInt(full.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getCalendarBlockPalette(color: string, isDashed?: boolean) {
  return {
    backgroundColor: hexToRgba(color, isDashed ? 0.08 : 0.10),
    borderColor: hexToRgba(color, isDashed ? 0.24 : 0.34),
    accentColor: hexToRgba(color, 0.92),
    overlayColor: isDashed ? 'rgba(255,255,255,0.74)' : 'rgba(255,255,255,0.78)',
    glowColor: hexToRgba(color, isDashed ? 0.05 : 0.10),
    titleColor: colors.text.primary,
    metaColor: colors.text.secondary,
  };
}

function getCurrentTimeIndicatorTop(date: Date, currentTime: Date) {
  if (!isSameDay(date, currentTime)) {
    return null;
  }

  const totalHours = currentTime.getHours() + currentTime.getMinutes() / 60;

  if (totalHours < DAY_START_HOUR || totalHours > DAY_END_HOUR + 1) {
    return null;
  }

  return ((totalHours - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR + 1)) * ((DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT);
}

interface TimelineBlock {
  entry: CalendarEntry;
  metrics: ReturnType<typeof getTimelineMetrics>;
  lane: number;
  laneCount: number;
  span: number;
  width: number;
  left: number;
  highlighted: boolean;
  compactMeta: boolean;
  compressed: boolean;
  palette: ReturnType<typeof getCalendarBlockPalette>;
}

function buildOverlapClusters(entries: CalendarEntry[]) {
  const sorted = entries
    .slice()
    .sort((left, right) => parseISO(left.startsAt).getTime() - parseISO(right.startsAt).getTime());

  const clusters: CalendarEntry[][] = [];
  let activeCluster: CalendarEntry[] = [];
  let clusterEnd = new Date(0);

  sorted.forEach((entry) => {
    const startsAt = parseISO(entry.startsAt);
    const endsAt = parseISO(entry.endsAt);

    if (activeCluster.length === 0 || startsAt < clusterEnd) {
      activeCluster.push(entry);
      clusterEnd = clusterEnd > endsAt ? clusterEnd : endsAt;
      return;
    }

    clusters.push(activeCluster);
    activeCluster = [entry];
    clusterEnd = endsAt;
  });

  if (activeCluster.length > 0) {
    clusters.push(activeCluster);
  }

  return clusters;
}

function buildTimelineBlockClusters({
  entries,
  layout,
  columnWidth,
  innerInset,
  laneGap,
  highlightedEntryId,
  minReadableWidth,
  minReadableHeight,
}: {
  entries: CalendarEntry[];
  layout: Map<string, { lane: number; laneCount: number; span: number }>;
  columnWidth: number;
  innerInset: number;
  laneGap: number;
  highlightedEntryId: string | null;
  minReadableWidth: number;
  minReadableHeight: number;
}) {
  return buildOverlapClusters(entries)
    .map((cluster) => {
      const blocks = cluster
        .map((entry) => {
          const metrics = getTimelineMetrics(entry, DAY_START_HOUR, HOUR_HEIGHT, DAY_END_HOUR);
          if (metrics.isHidden) {
            return null;
          }

          const lane = layout.get(entry.id)?.lane ?? 0;
          const laneCount = layout.get(entry.id)?.laneCount ?? 1;
          const span = layout.get(entry.id)?.span ?? 1;
          const totalGap = laneGap * Math.max(0, laneCount - 1);
          const availableWidth = Math.max(columnWidth - innerInset * 2 - totalGap, 0);
          const laneWidth = availableWidth / laneCount;
          const width = Math.max(laneWidth * span + laneGap * Math.max(0, span - 1), 36);
          const left = innerInset + lane * (laneWidth + laneGap);

          return {
            entry,
            metrics,
            lane,
            laneCount,
            span,
            width,
            left,
            highlighted: highlightedEntryId === entry.id,
            compactMeta: laneCount > 1 || width < minReadableWidth + 24 || metrics.height < minReadableHeight + 18,
            compressed: laneCount > 2 || width < minReadableWidth || metrics.height < minReadableHeight,
            palette: getCalendarBlockPalette(entry.color, entry.isDashed),
          } satisfies TimelineBlock;
        })
        .filter((value): value is TimelineBlock => Boolean(value));

      if (blocks.length === 0) {
        return null;
      }

      const laneCount = Math.max(...blocks.map((block) => block.laneCount), 1);
      const isTwoWaySplit = blocks.length === 2 && laneCount === 2;
      const shouldGroup =
        blocks.length > 1 &&
        (laneCount > 2
          || (isTwoWaySplit
            ? blocks.some((block) => block.width < 68 || block.metrics.height < 78)
            : blocks.some((block) => block.width < minReadableWidth || block.metrics.height < minReadableHeight)));

      return { cluster, blocks, shouldGroup };
    })
    .filter((value): value is { cluster: CalendarEntry[]; blocks: TimelineBlock[]; shouldGroup: boolean } => Boolean(value));
}

function TimelineEntryBlock({
  block,
  onPress,
}: {
  block: TimelineBlock;
  onPress: (entry: CalendarEntry) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${block.entry.title} at ${formatCalendarTime(block.entry)}`}
      onPress={() => onPress(block.entry)}
      style={[
        styles.calendarBlock,
        block.metrics.startsBeforeVisible && styles.calendarBlockClippedTop,
        block.metrics.endsAfterVisible && styles.calendarBlockClippedBottom,
        {
          top: block.metrics.startsBeforeVisible ? block.metrics.top + 4 : block.metrics.top,
          left: block.left,
          width: block.width,
          height: Math.max(block.metrics.height - (block.metrics.startsBeforeVisible ? 4 : 0), 48),
          minHeight: Math.max(block.metrics.height - (block.metrics.startsBeforeVisible ? 4 : 0), 48),
          backgroundColor: block.palette.backgroundColor,
          borderColor: block.highlighted ? colors.primary.main : block.palette.borderColor,
          borderStyle: getEntryBorderStyle(block.entry),
          shadowColor: block.palette.glowColor,
          shadowOpacity: block.highlighted ? 0.16 : 0.08,
          shadowRadius: block.highlighted ? 14 : 8,
        },
        block.highlighted && styles.calendarBlockHighlighted,
      ]}
    >
      <View pointerEvents="none" style={[styles.calendarBlockAccent, { backgroundColor: block.palette.accentColor }]} />
      <View pointerEvents="none" style={[styles.calendarBlockGlass, { backgroundColor: block.palette.overlayColor }]} />
      <View style={styles.calendarBlockContent}>
        {block.metrics.startsBeforeVisible ? (
          <Text style={[styles.calendarContinuationLabel, { color: block.palette.metaColor }]} numberOfLines={1}>
            Continues
          </Text>
        ) : null}
        <Text
          style={[
            styles.calendarBlockTitle,
            block.width < 92 && styles.calendarBlockTitleCompact,
            { color: block.palette.titleColor },
          ]}
          numberOfLines={2}>
          {block.entry.title}
        </Text>
        <Text style={[styles.calendarBlockMeta, styles.calendarBlockMetaStrong, { color: block.palette.metaColor }]} numberOfLines={1}>
          {block.width < 112 ? format(parseISO(block.entry.startsAt), 'h:mm a') : formatCalendarTime(block.entry)}
        </Text>
        {!block.compactMeta ? (
          <Text style={[styles.calendarBlockMeta, { color: block.palette.metaColor }]} numberOfLines={block.width < 136 ? 1 : 2}>
            {block.entry.locationName}
          </Text>
        ) : null}
        <View style={styles.calendarBlockFooter}>
          <Ionicons
            name={block.entry.icon as React.ComponentProps<typeof Ionicons>['name']}
            size={block.width < 92 ? 13 : 15}
            color={block.palette.accentColor}
          />
        </View>
      </View>
    </Pressable>
  );
}

function OverlapClusterCard({
  blocks,
  columnWidth,
  innerInset,
  onPress,
}: {
  blocks: TimelineBlock[];
  columnWidth: number;
  innerInset: number;
  onPress: (entries: CalendarEntry[]) => void;
}) {
  const top = Math.min(...blocks.map((block) => block.metrics.top));
  const bottom = Math.max(...blocks.map((block) => block.metrics.top + block.metrics.height));
  const height = Math.max(bottom - top, 72);
  const entries = blocks.map((block) => block.entry);
  const earliest = entries.reduce((current, entry) =>
    parseISO(entry.startsAt).getTime() < parseISO(current.startsAt).getTime() ? entry : current,
  entries[0]);
  const latest = entries.reduce((current, entry) =>
    parseISO(entry.endsAt).getTime() > parseISO(current.endsAt).getTime() ? entry : current,
  entries[0]);
  const condensed = height < 112;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entries.length} overlapping events`}
      accessibilityHint="Opens a list of overlapping calendar entries"
      onPress={() => onPress(entries)}
      style={[
        styles.overlapClusterCard,
        {
          top,
          left: innerInset,
          width: Math.max(columnWidth - innerInset * 2, 0),
          height,
        },
      ]}
    >
      <View style={styles.overlapClusterHeader}>
        <Text style={styles.overlapClusterTitle}>{entries.length} overlapping events</Text>
        <Text style={styles.overlapClusterTime}>{`${format(parseISO(earliest.startsAt), 'h:mm a')} - ${format(parseISO(latest.endsAt), 'h:mm a')}`}</Text>
      </View>
      {!condensed ? (
        <View style={styles.overlapClusterPreviewList}>
          {blocks.slice(0, 2).map((block) => (
            <View key={block.entry.id} style={styles.overlapClusterPreviewRow}>
              <View style={[styles.overlapClusterDot, { backgroundColor: block.palette.accentColor }]} />
              <Text style={styles.overlapClusterPreviewText} numberOfLines={1}>
                {block.entry.title}
              </Text>
            </View>
          ))}
          {blocks.length > 2 ? (
            <Text style={styles.overlapClusterMoreLabel}>+{blocks.length - 2} more</Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.overlapClusterMoreLabel}>Tap to compare</Text>
      )}
    </Pressable>
  );
}

function DayColumn({
  date,
  entries,
  highlightedEntryId,
  onEntryPress,
  onGroupPress,
  columnWidth,
  currentTime,
}: {
  date: Date;
  entries: CalendarEntry[];
  highlightedEntryId: string | null;
  onEntryPress: (entry: CalendarEntry) => void;
  onGroupPress: (entries: CalendarEntry[]) => void;
  columnWidth: number;
  currentTime: Date;
}) {
  const layout = useMemo(() => buildEntryLayout(entries), [entries]);
  const timelineHeight = (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT;
  const currentTimeTop = useMemo(() => getCurrentTimeIndicatorTop(date, currentTime), [currentTime, date]);
  const innerInset = 8;
  const laneGap = 6;
  const clusters = useMemo(
    () =>
      buildTimelineBlockClusters({
        entries,
        layout,
        columnWidth,
        innerInset,
        laneGap,
        highlightedEntryId,
        minReadableWidth: 132,
        minReadableHeight: 84,
      }),
    [entries, layout, columnWidth, highlightedEntryId],
  );

  return (
    <View style={[styles.dayColumn, { width: columnWidth }]}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderLabel}>{format(date, 'EEE')}</Text>
        <Text style={styles.dayHeaderDate}>{format(date, 'd')}</Text>
      </View>
      <View style={[styles.dayTimeline, { height: timelineHeight }]}>
        {HOURS.map((hour, index) => (
          <View
            key={`${format(date, 'yyyy-MM-dd')}-${hour}`}
            pointerEvents="none"
            style={[styles.timelineGuideLine, { top: index * HOUR_HEIGHT }]}
          />
        ))}
        {clusters.map(({ cluster, blocks, shouldGroup }) =>
          shouldGroup ? (
            <OverlapClusterCard
              key={`cluster-${cluster[0]?.id ?? date.toISOString()}`}
              blocks={blocks}
              columnWidth={columnWidth}
              innerInset={innerInset}
              onPress={onGroupPress}
            />
          ) : (
            blocks.map((block) => <TimelineEntryBlock key={block.entry.id} block={block} onPress={onEntryPress} />)
          ),
        )}
      </View>
    </View>
  );
}

function FocusedDayTimeline({
  date,
  entries,
  highlightedEntryId,
  onEntryPress,
  onGroupPress,
  panelWidth,
  currentTime,
}: {
  date: Date;
  entries: CalendarEntry[];
  highlightedEntryId: string | null;
  onEntryPress: (entry: CalendarEntry) => void;
  onGroupPress: (entries: CalendarEntry[]) => void;
  panelWidth: number;
  currentTime: Date;
}) {
  const layout = useMemo(() => buildEntryLayout(entries), [entries]);
  const [columnWidth, setColumnWidth] = useState(panelWidth);
  const timelineHeight = (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT;
  const currentTimeTop = useMemo(() => getCurrentTimeIndicatorTop(date, currentTime), [currentTime, date]);
  const innerInset = 12;
  const laneGap = 8;
  const clusters = useMemo(
    () =>
      buildTimelineBlockClusters({
        entries,
        layout,
        columnWidth,
        innerInset,
        laneGap,
        highlightedEntryId,
        minReadableWidth: 144,
        minReadableHeight: 92,
      }),
    [entries, layout, columnWidth, highlightedEntryId],
  );

  return (
    <View style={[styles.focusedTimelineShell, { width: panelWidth }]}>
      <View style={styles.focusedTimelineHeader}>
        <View>
          <Text style={styles.focusedTimelineLabel}>{format(date, 'EEEE')}</Text>
          <Text style={styles.focusedTimelineTitle}>{format(date, 'MMMM d')}</Text>
        </View>
        <View style={styles.focusedTimelineBadge}>
          <Text style={styles.focusedTimelineBadgeText}>{entries.length} planned</Text>
        </View>
      </View>
      <View
        style={[styles.dayTimeline, styles.focusedDayTimeline, { height: timelineHeight }]}
        onLayout={(event) => {
          const nextWidth = Math.max(280, Math.round(event.nativeEvent.layout.width));
          setColumnWidth((current) => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
        }}
      >
        {HOURS.map((hour, index) => (
          <View
            key={`focused-${format(date, 'yyyy-MM-dd')}-${hour}`}
            pointerEvents="none"
            style={[styles.timelineGuideLine, { top: index * HOUR_HEIGHT }]}
          />
        ))}
        {clusters.map(({ cluster, blocks, shouldGroup }) =>
          shouldGroup ? (
            <OverlapClusterCard
              key={`focused-cluster-${cluster[0]?.id ?? date.toISOString()}`}
              blocks={blocks}
              columnWidth={columnWidth}
              innerInset={innerInset}
              onPress={onGroupPress}
            />
          ) : (
            blocks.map((block) => <TimelineEntryBlock key={block.entry.id} block={block} onPress={onEntryPress} />)
          ),
        )}
        {entries.length === 0 ? (
          <View style={styles.focusedTimelineEmptyState}>
            <Text style={styles.focusedTimelineEmptyTitle}>Nothing stacked here yet</Text>
            <Text style={styles.focusedTimelineEmptyBody}>
              This day is open right now. Join a campus event or add a personal block to shape it.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function CalendarHomeScreen({ navigation }: NativeStackScreenProps<CalendarStackParamList, 'CalendarHome'>) {
  const { isMobile, isWide, isDesktop } = useResponsive();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [selectedOverlapEntries, setSelectedOverlapEntries] = useState<CalendarEntry[] | null>(null);
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
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

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
  const isMobileWeek = viewMode === 'week' && isMobile;
  const activeEntries = viewMode === 'day' || isMobileWeek ? selectedDayEntries : entries;
  const focusedTimelineWidth = isDesktop ? 468 : isWide ? 420 : 308;

  const navigateRange = (direction: 'prev' | 'next') => {
    setSelectedEntry(null);
    setSelectedOverlapEntries(null);
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
    setSelectedOverlapEntries(null);
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
          isMobile ? (
            <View style={styles.mobileWeekLayout}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileWeekStrip}>
                {weekDays.map((date) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const count = countEntriesForDate(entries, date);
                  const selected = anchorDateKey === dateKey;
                  const hasConflict = conflicts.some((conflict) => conflict.date === dateKey);

                  return (
                    <Pressable
                      key={dateKey}
                      onPress={() => setCurrentDate(date)}
                      style={[styles.mobileWeekPill, selected && styles.mobileWeekPillActive]}
                    >
                      <Text style={[styles.mobileWeekPillLabel, selected && styles.mobileWeekPillLabelActive]}>
                        {format(date, 'EEE')}
                      </Text>
                      <Text style={[styles.mobileWeekPillDate, selected && styles.mobileWeekPillDateActive]}>
                        {format(date, 'd')}
                      </Text>
                      {count > 0 ? (
                        <View style={[styles.mobileWeekCountBadge, selected && styles.mobileWeekCountBadgeActive]}>
                          <Text style={[styles.mobileWeekCountText, selected && styles.mobileWeekCountTextActive]}>
                            {count}
                          </Text>
                        </View>
                      ) : hasConflict ? (
                        <Ionicons name="warning" size={12} color={selected ? colors.primary.main : colors.status.warning} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Card style={styles.mobileWeekHintCard}>
                <View style={styles.mobileWeekHintHeader}>
                  <Text style={styles.sectionTitle}>{format(currentDate, 'EEE, MMM d')}</Text>
                  <Text style={styles.sectionMeta}>
                    {selectedDayEntries.length} item{selectedDayEntries.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text style={styles.helperText}>
                  {anchorConflicts.length > 0
                    ? `${anchorConflicts.length} conflict${anchorConflicts.length === 1 ? '' : 's'} need attention.`
                    : selectedDayEntries.length > 0
                      ? 'Tap a block to see details, jump to the map, or get directions.'
                      : 'This day is open right now. Add a personal block or join something on campus.'}
                </Text>
              </Card>

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
                  <FocusedDayTimeline
                    date={currentDate}
                    entries={selectedDayEntries}
                    highlightedEntryId={highlightedEntryId}
                    onEntryPress={openEntryDetail}
                    onGroupPress={setSelectedOverlapEntries}
                    panelWidth={focusedTimelineWidth}
                    currentTime={currentTime}
                  />
                </View>
              </ScrollView>
            </View>
          ) : (
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
                        onGroupPress={setSelectedOverlapEntries}
                        columnWidth={isDesktop ? 184 : 164}
                        currentTime={currentTime}
                      />
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          )
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
              <FocusedDayTimeline
                date={currentDate}
                entries={selectedDayEntries}
                highlightedEntryId={highlightedEntryId}
                onEntryPress={openEntryDetail}
                onGroupPress={setSelectedOverlapEntries}
                panelWidth={focusedTimelineWidth}
                currentTime={currentTime}
              />
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

      <BottomSheet visible={Boolean(selectedOverlapEntries?.length)} onClose={() => setSelectedOverlapEntries(null)} snapPoints={[0.46]}>
        {selectedOverlapEntries?.length ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Overlapping events</Text>
            <Text style={styles.sheetSubtitle}>These entries share the same time window. Tap one to open details.</Text>
            {selectedOverlapEntries.map((entry) => (
              <Pressable
                key={`overlap-choice-${entry.id}`}
                onPress={() => {
                  setSelectedOverlapEntries(null);
                  setSelectedEntry(entry);
                }}
                style={styles.overlapChoiceCard}
              >
                <View style={[styles.overlapChoiceAccent, { backgroundColor: entry.color }]} />
                <View style={styles.overlapChoiceCopy}>
                  <Text style={styles.overlapChoiceTitle}>{entry.title}</Text>
                  <Text style={styles.overlapChoiceMeta}>{formatCalendarTime(entry)}</Text>
                  <Text style={styles.overlapChoiceMeta} numberOfLines={1}>{entry.locationName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
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
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
  },
  calendarSurfaceWide: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  weekLayout: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  weekColumnsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mobileWeekLayout: {
    gap: spacing.md,
  },
  mobileWeekStrip: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  mobileWeekPill: {
    minWidth: 72,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
  },
  mobileWeekPillActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest,
  },
  mobileWeekPillLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  mobileWeekPillLabelActive: {
    color: colors.primary.main,
  },
  mobileWeekPillDate: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  mobileWeekPillDateActive: {
    color: colors.primary.main,
  },
  mobileWeekCountBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.background.secondary,
  },
  mobileWeekCountBadgeActive: {
    backgroundColor: colors.primary.main,
  },
  mobileWeekCountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  mobileWeekCountTextActive: {
    color: colors.brand.white,
  },
  mobileWeekHintCard: {
    gap: spacing.sm,
  },
  mobileWeekHintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeColumn: {
    width: 58,
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
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dayHeader: {
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.brand.white,
  },
  dayHeaderLarge: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.brand.white,
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
  timelineGuideLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border.light,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    zIndex: 0,
  },
  currentTimeIndicatorFocused: {
    paddingHorizontal: spacing.sm,
  },
  currentTimeIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    opacity: 0.68,
  },
  currentTimeIndicatorLine: {
    flex: 1,
    height: 1.5,
    marginLeft: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(226, 24, 51, 0.38)',
  },
  calendarBlock: {
    position: 'absolute',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
    backgroundColor: colors.brand.white,
    ...shadows.sm,
  },
  calendarBlockAccent: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 5,
    borderRadius: borderRadius.full,
  },
  calendarBlockGlass: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  calendarBlockContent: {
    flex: 1,
    gap: 2,
    zIndex: 1,
  },
  calendarBlockFooter: {
    marginTop: 'auto',
    paddingTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlapClusterCard: {
    position: 'absolute',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  overlapClusterHeader: {
    gap: 3,
  },
  overlapClusterTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  overlapClusterTime: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  overlapClusterPreviewList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  overlapClusterPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  overlapClusterDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  overlapClusterPreviewText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  overlapClusterMoreLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  calendarBlockClippedTop: {
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  calendarBlockClippedBottom: {
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  calendarContinuationLabel: {
    marginBottom: 2,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  weekCalendarBlock: {
    justifyContent: 'flex-start',
  },
  focusedCalendarBlock: {
    justifyContent: 'flex-start',
  },
  dayViewLayout: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dayViewColumn: {
    width: 320,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dayViewBlock: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  focusedTimelineShell: {
    width: 336,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  focusedTimelineHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.brand.white,
  },
  focusedTimelineLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  focusedTimelineTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  focusedTimelineBadge: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  focusedTimelineBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  focusedDayTimeline: {
    backgroundColor: colors.background.secondary,
  },
  focusedTimelineEmptyState: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
    padding: spacing.md,
    gap: spacing.xs,
  },
  focusedTimelineEmptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  focusedTimelineEmptyBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  calendarBlockHighlighted: {
    shadowColor: colors.primary.main,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  calendarBlockTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  calendarBlockTitleCompact: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  calendarBlockTitleSoft: {
    color: colors.text.primary,
  },
  calendarBlockMeta: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  calendarBlockMetaStrong: {
    fontWeight: typography.fontWeight.semiBold,
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
    backgroundColor: colors.primary.lightest,
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
  overlapChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
    padding: spacing.md,
  },
  overlapChoiceAccent: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: borderRadius.full,
  },
  overlapChoiceCopy: {
    flex: 1,
    gap: 2,
  },
  overlapChoiceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  overlapChoiceMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});



