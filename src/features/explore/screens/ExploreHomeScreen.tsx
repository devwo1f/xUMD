import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import CampusMap from '../../map/components/CampusMap';
import EventBottomSheet from '../../map/components/EventBottomSheet';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { mockCampusEvents } from '../../../assets/data/mockEvents';
import {
  eventCategoryOptions,
  type ExploreEventCategoryFilter,
} from '../../map/data/campusOverlays';
import { useMapData, type TimeFilter } from '../../map/hooks/useMapData';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { EventCategory, type Event } from '../../../shared/types';
import type { ExploreStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ExploreStackParamList, 'ExploreHome'>;

export default function ExploreHomeScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [activeEventCategory, setActiveEventCategory] =
    useState<ExploreEventCategoryFilter>('all');
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  const { isWide } = useResponsive();
  const { events } = useMapData({
    timeFilter,
    searchQuery,
    categoryFilter:
      activeEventCategory === 'all' ? undefined : (activeEventCategory as EventCategory),
  });
  const { savedEventIds, toggleSavedEvent } = useDemoAppStore();

  const featuredEvents = useMemo(() => {
    const source =
      events.length > 0
        ? events
        : searchQuery.trim().length === 0 && activeEventCategory === 'all'
          ? mockCampusEvents
          : [];

    return source.slice(0, isWide ? 3 : 2);
  }, [activeEventCategory, events, isWide, searchQuery]);

  const liveNowCount = useMemo(
    () =>
      events.filter(
        (event) =>
          new Date(event.starts_at) <= new Date() && new Date(event.ends_at) >= new Date(),
      ).length,
    [events],
  );

  const openFullMap = () => {
    navigation.getParent()?.navigate('Map' as never);
  };

  return (
    <ScreenLayout
      title="Explore"
      subtitle="A clean event-first view of what is happening around UMD right now."
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
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search registered events..."
            placeholderTextColor={colors.text.tertiary}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbar}
        >
          {(['happening_now', 'today', 'this_week'] as TimeFilter[]).map((option) => {
            const selected = option === timeFilter;
            const label =
              option === 'happening_now' ? 'Now' : option === 'today' ? 'Today' : 'This Week';

            return (
              <Pressable
                key={option}
                onPress={() => setTimeFilter(option)}
                style={[styles.filterChip, selected && styles.filterChipActive]}
              >
                <Text style={[styles.filterLabel, selected && styles.filterLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {eventCategoryOptions.map((option) => {
            const selected = activeEventCategory === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setActiveEventCategory(option.value)}
                style={[
                  styles.categoryChip,
                  selected && { backgroundColor: option.color, borderColor: option.color },
                ]}
              >
                <Text style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.mapCard, isWide && styles.mapCardWide]}>
          <CampusMap
            style={styles.map}
            events={events}
            buildings={[]}
            showEvents
            showBuildings={false}
            showWalkingRoutes={false}
            showDiningZones={false}
            clusterEvents
            activeEventId={activeEvent?.id ?? null}
            onSelectEvent={setActiveEvent}
            onSelectBuilding={() => {}}
          />

          <View style={styles.mapOverlay}>
            <View style={styles.mapStatCard}>
              <Text style={styles.mapStatValue}>{events.length}</Text>
              <Text style={styles.mapStatLabel}>Pins</Text>
            </View>
            <View style={styles.mapStatCard}>
              <Text style={styles.mapStatValue}>{liveNowCount}</Text>
              <Text style={styles.mapStatLabel}>Live now</Text>
            </View>
            <View style={styles.mapStatCard}>
              <Text style={styles.mapStatValue}>{savedEventIds.length}</Text>
              <Text style={styles.mapStatLabel}>Saved</Text>
            </View>
          </View>

          <View style={styles.mapHintPill}>
            <Ionicons name="sparkles-outline" size={16} color={colors.text.primary} />
            <Text style={styles.mapHintText}>Tap any pin to preview an event.</Text>
          </View>
        </View>

        <Card style={styles.fullMapCard}>
          <View style={styles.fullMapHeader}>
            <View>
              <Text style={styles.fullMapTitle}>Want the full campus picture?</Text>
              <Text style={styles.fullMapBody}>
                Open the Map tab for buildings, walking paths, dining zones, near-me mode, and
                route guidance.
              </Text>
            </View>
            <Ionicons name="map-outline" size={24} color={colors.primary.main} />
          </View>
          <View style={styles.fullMapPillRow}>
            {['Buildings', 'Routes', 'Near me'].map((item) => (
              <View key={item} style={styles.fullMapPill}>
                <Text style={styles.fullMapPillText}>{item}</Text>
              </View>
            ))}
          </View>
          <Button title="Open Full Map" onPress={openFullMap} fullWidth />
        </Card>

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

      <EventBottomSheet
        event={activeEvent}
        visible={Boolean(activeEvent)}
        onClose={() => setActiveEvent(null)}
        onViewDetail={(eventId) => {
          setActiveEvent(null);
          navigation.navigate('EventDetail', { eventId });
        }}
        onRSVP={(eventId) => {
          toggleSavedEvent(eventId);
          setActiveEvent(null);
        }}
        secondaryActionLabel="Open in Map"
        onSecondaryAction={() => {
          setActiveEvent(null);
          openFullMap();
        }}
      />
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  toolbar: {
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  filterChip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  filterLabelActive: {
    color: colors.brand.white,
  },
  categoryRow: {
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  categoryChip: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  categoryChipTextActive: {
    color: colors.brand.white,
  },
  mapCard: {
    height: 360,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.brand.white,
    ...shadows.md,
  },
  mapCardWide: {
    height: 440,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    gap: spacing.sm,
  },
  mapStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 88,
  },
  mapStatValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  mapStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  mapHintPill: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapHintText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  fullMapCard: {
    gap: spacing.md,
  },
  fullMapHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  fullMapTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  fullMapBody: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  fullMapPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fullMapPill: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  fullMapPillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
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
});



