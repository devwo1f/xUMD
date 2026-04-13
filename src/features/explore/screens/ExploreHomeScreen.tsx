import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import BottomSheet from '../../../shared/components/BottomSheet';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { mockCampusEvents } from '../../../assets/data/mockEvents';
import type { ExploreStackParamList } from '../../../navigation/types';
import { useCrossTabNavStore } from '../../../shared/stores/useCrossTabNavStore';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import MiniCalendarStrip from '../../calendar/components/MiniCalendarStrip';
import { useCalendarEntries } from '../../calendar/hooks/useCalendarEntries';
import type { CalendarEntry } from '../../calendar/types';
import { useMapData } from '../../map/hooks/useMapData';

type Props = NativeStackScreenProps<ExploreStackParamList, 'ExploreHome'>;

export default function ExploreHomeScreen({ navigation }: Props) {
  const [calendarPreviewEntry, setCalendarPreviewEntry] = useState<CalendarEntry | null>(null);

  const { isWide } = useResponsive();
  const { savedEventIds } = useDemoAppStore();
  const setPendingCalendarFocus = useCrossTabNavStore((state) => state.setPendingCalendarFocus);
  const setPendingMapFocus = useCrossTabNavStore((state) => state.setPendingMapFocus);
  const {
    todayEntries,
    todayConflicts,
    miniSummary,
  } = useCalendarEntries({
    anchorDate: new Date(),
    viewMode: 'day',
  });

  const { events } = useMapData({ timeFilter: 'today' });

  const featuredEvents = useMemo(() => {
    const source =
      events.length > 0 ? events : mockCampusEvents;

    return source.slice(0, isWide ? 3 : 2);
  }, [events, isWide]);

  const openFullMap = () => {
    navigation.getParent()?.navigate('Map' as never);
  };

  const openFullCalendar = () => {
    navigation.getParent()?.navigate('Calendar' as never);
  };

  const openCalendarWithConflicts = () => {
    setPendingCalendarFocus({
      date: new Date().toISOString(),
      showConflicts: true,
    });
    openFullCalendar();
  };

  const handleCalendarEntryTap = (entry: CalendarEntry) => {
    if ((entry.type === 'event_going' || entry.type === 'event_interested') && entry.eventId) {
      navigation.navigate('EventDetail', { eventId: entry.eventId });
      return;
    }

    if (entry.type === 'club_meeting' && entry.clubId) {
      navigation.navigate('ClubDetail', { clubId: entry.clubId });
      return;
    }

    setCalendarPreviewEntry(entry);
  };

  const openEntryOnMap = (entry: CalendarEntry) => {
    if (typeof entry.latitude !== 'number' || typeof entry.longitude !== 'number') {
      return;
    }

    setPendingMapFocus({
      type: 'location',
      locationId: entry.locationId ?? entry.sourceId,
      label: entry.locationName,
      latitude: entry.latitude,
      longitude: entry.longitude,
    });
    setCalendarPreviewEntry(null);
    openFullMap();
  };

  return (
    <ScreenLayout
      title="Explore"
      subtitle="Discovery, events, and your day in one calm campus hub."
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="compass-outline"
          label="Event Discovery"
          color={colors.primary.main}
          tintColor={colors.primary.lightest}
        />
      }
      headerStyle={styles.headerShell}
    >
      <View style={styles.container}>
        <MiniCalendarStrip
          entries={todayEntries}
          conflicts={todayConflicts}
          summary={miniSummary}
          onViewFullCalendar={openFullCalendar}
          onEntryTap={handleCalendarEntryTap}
          onConflictTap={openCalendarWithConflicts}
          onEmptyTap={() => navigation.getParent()?.navigate('Search' as never)}
        />


        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionEyebrow}>Featured today</Text>
            <Text style={styles.sectionTitle}>Best bets before you head out</Text>
          </View>
        </View>

        <View style={[styles.featuredList, isWide && styles.featuredListWide]}>
          {featuredEvents.length > 0 ? (
            featuredEvents.map((event) => {
              const isSaved = savedEventIds.includes(event.id);

              return (
                <Card
                  key={event.id}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  style={[styles.featuredCard, isWide && styles.featuredCardWide]}
                >
                  <View style={styles.featuredTopRow}>
                    <Badge
                      label={event.category}
                      color={
                        colors.eventCategory[
                          event.category as keyof typeof colors.eventCategory
                        ] ?? colors.primary.main
                      }
                    />
                    {isSaved ? <Text style={styles.savedTag}>Saved</Text> : null}
                  </View>
                  <Text style={styles.featuredTitle}>{event.title}</Text>
                  <Text style={styles.featuredMeta}>
                    {format(new Date(event.starts_at), 'EEE, h:mm a')} | {event.location_name}
                  </Text>
                  <Text numberOfLines={2} style={styles.featuredDescription}>
                    {event.description}
                  </Text>
                </Card>
              );
            })
          ) : (
            <Card style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No events match this lens yet</Text>
              <Text style={styles.emptyStateBody}>
                Try a broader time range or switch back to all events.
              </Text>
            </Card>
          )}
        </View>
      </View>


      <BottomSheet
        visible={Boolean(calendarPreviewEntry)}
        onClose={() => setCalendarPreviewEntry(null)}
        snapPoints={[0.4]}
      >
        {calendarPreviewEntry ? (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{calendarPreviewEntry.title}</Text>
            <Text style={styles.sheetSubtitle}>{calendarPreviewEntry.sourceLabel}</Text>
            <Card style={styles.sheetInfoCard}>
              <Text style={styles.sheetInfoLabel}>Time</Text>
              <Text style={styles.sheetInfoValue}>{format(new Date(calendarPreviewEntry.startsAt), 'EEE, h:mm a')} - {format(new Date(calendarPreviewEntry.endsAt), 'h:mm a')}</Text>
              <Text style={styles.sheetInfoMeta}>{calendarPreviewEntry.locationName}</Text>
            </Card>
            {calendarPreviewEntry.detail ? (
              <Text style={styles.sheetBody}>{calendarPreviewEntry.detail}</Text>
            ) : null}
            <View style={styles.sheetButtonStack}>
              <Button title="Open Full Calendar" onPress={() => {
                setPendingCalendarFocus({ date: calendarPreviewEntry.startsAt, entryId: calendarPreviewEntry.id });
                setCalendarPreviewEntry(null);
                openFullCalendar();
              }} fullWidth />
              {typeof calendarPreviewEntry.latitude === 'number' && typeof calendarPreviewEntry.longitude === 'number' ? (
                <Button title="Show on Map" variant="secondary" onPress={() => openEntryOnMap(calendarPreviewEntry)} fullWidth />
              ) : null}
            </View>
          </View>
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
  container: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionCopy: {
    gap: spacing.xs,
  },
  sectionEyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  featuredList: {
    gap: spacing.md,
  },
  featuredListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featuredCard: {
    gap: spacing.sm,
  },
  featuredCardWide: {
    flex: 1,
    minWidth: 220,
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedTag: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },
  featuredTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  featuredMeta: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  featuredDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  emptyStateCard: {
    gap: spacing.sm,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyStateBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  sheetContent: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  sheetInfoCard: {
    gap: spacing.xs,
  },
  sheetInfoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  sheetInfoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sheetInfoMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  sheetBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  sheetButtonStack: {
    gap: spacing.sm,
  },
});
