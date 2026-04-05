import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Badge from '../../../shared/components/Badge';
import BottomSheet from '../../../shared/components/BottomSheet';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { buildings, type Building } from '../../../assets/data/buildings';
import { useCrossTabNavStore } from '../../../shared/stores/useCrossTabNavStore';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { EventCategory, type Event } from '../../../shared/types';
import type { MapStackParamList } from '../../../navigation/types';
import { isSupabaseConfigured } from '../../../services/supabase';
import {
  createMapEventRemote,
  reportMapEventRemote,
  submitEventRsvpRemote,
} from '../../../services/mapEvents';
import CampusMap from '../components/CampusMap';
import { campusMapCenter } from '../config/campusMapStyle';
import {
  buildingTypeMeta,
  campusRoutes,
  diningZones,
  type CampusRoute,
  type DiningZone,
} from '../data/campusOverlays';
import { useMapData } from '../hooks/useMapData';
import { useMapEventDetail } from '../hooks/useMapEventDetail';
import { useMapSearchResults } from '../hooks/useMapSearchResults';
import { useUserLocation } from '../hooks/useUserLocation';
import { useMapFilterStore } from '../stores/useMapFilterStore';
import type {
  EventLocationGroup,
  MapCoordinate,
  MapFocusRequest,
  MapTimeFilter,
  WayfindingJourney,
} from '../types';
import {
  MAP_CATEGORY_OPTIONS,
  buildEventLocationGroups,
  filterAndSortEvents,
  getContextualTimeLabel,
  getLiveEventCounter,
  getNearestLiveEvent,
  isEventLive,
} from '../utils/eventDiscovery';
import {
  buildFocusRequestForCoordinate,
  buildFocusRequestFromCoordinates,
  buildWayfindingJourney,
  getDistanceMeters,
  toMapCoordinate,
} from '../utils/wayfinding';

type Props = NativeStackScreenProps<MapStackParamList, 'MapHome'>;

const QUICK_LENSES = [
  { id: 'open_now', label: 'Open now', icon: 'flash-outline' as const },
  { id: 'food', label: 'Food', icon: 'restaurant-outline' as const },
  { id: 'study', label: 'Study', icon: 'book-outline' as const },
  { id: 'tonight', label: 'Tonight', icon: 'moon-outline' as const },
] as const;

const TIME_FILTER_OPTIONS: Array<{ value: MapTimeFilter; label: string }> = [
  { value: 'happening_now', label: 'Happening Now' },
  { value: 'next_2_hours', label: 'Next 2 Hours' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
];

type CreateEventDraft = {
  title: string;
  description: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string;
  maxCapacity: string;
  tags: string;
};

function buildCreateEventDraft(): CreateEventDraft {
  const now = new Date();
  const startsAt = new Date(now.getTime() + 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);

  return {
    title: '',
    description: '',
    category: EventCategory.Other,
    startsAt: startsAt.toISOString().slice(0, 16),
    endsAt: endsAt.toISOString().slice(0, 16),
    maxCapacity: '',
    tags: '',
  };
}

function getMapsUrl(label: string, coordinate: MapCoordinate) {
  const [longitude, latitude] = coordinate;
  const query = encodeURIComponent(label);

  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w&q=${query}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking&dir_action=navigate`;
}

function findNearestBuilding(coordinate: MapCoordinate) {
  return buildings
    .map((building) => ({
      building,
      distance: getDistanceMeters(coordinate, [building.longitude, building.latitude]),
    }))
    .sort((left, right) => left.distance - right.distance)[0] ?? null;
}

function findBuildingEvents(target: Building, events: Event[]) {
  const buildingCoordinate: MapCoordinate = [target.longitude, target.latitude];

  return events.filter((event) => {
    if (event.latitude === null || event.longitude === null) {
      return false;
    }

    const byDistance =
      getDistanceMeters(buildingCoordinate, [event.longitude, event.latitude]) <= 135;
    const byName = event.location_name.toLowerCase().includes(target.name.toLowerCase());

    return byDistance || byName;
  });
}

function getDensityMap(events: Event[]) {
  return Object.fromEntries(
    events.map((event) => {
      if (event.latitude === null || event.longitude === null) {
        return [event.id, 1] as const;
      }

      const coordinate: MapCoordinate = [event.longitude, event.latitude];
      const density = events.reduce((count, otherEvent) => {
        if (otherEvent.latitude === null || otherEvent.longitude === null) {
          return count;
        }

        const otherCoordinate: MapCoordinate = [otherEvent.longitude, otherEvent.latitude];
        return getDistanceMeters(coordinate, otherCoordinate) <= 100 ? count + 1 : count;
      }, 0);

      return [event.id, density] as const;
    }),
  );
}

function EventListItem({
  event,
  isSaved,
  isGoing,
  onPress,
}: {
  event: Event;
  isSaved: boolean;
  isGoing: boolean;
  onPress: () => void;
}) {
  const categoryColor =
    colors.eventCategory[event.category as keyof typeof colors.eventCategory] ??
    colors.eventCategory.other;

  return (
    <Pressable onPress={onPress} style={styles.eventListItem}>
      <View style={styles.eventListHeader}>
        <Badge label={event.category} color={categoryColor} />
        <View style={styles.eventStateRow}>
          {isGoing ? <Text style={styles.goingText}>Going</Text> : null}
          {isSaved ? <Text style={styles.savedText}>Interested</Text> : null}
        </View>
      </View>
      <Text style={styles.eventListTitle}>{event.title}</Text>
      <Text style={styles.eventListMeta}>{getContextualTimeLabel(event)}</Text>
      <Text style={styles.eventListMeta}>{event.location_name}</Text>
    </Pressable>
  );
}

export default function MapHomeScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const { userLocation, isLocating, locationError, requestUserLocation } = useUserLocation();
  const {
    selectedCategories,
    timeFilter,
    sortBy,
    customRange,
    onlyFriendsAttending,
    searchQuery,
    isFilterModalOpen,
    setSearchQuery,
    setTimeFilter,
    setSortBy,
    setOnlyFriendsAttending,
    setFilterModalOpen,
    toggleCategory,
    reset,
  } = useMapFilterStore();
  const { rawEvents, loading, refetch: refetchMapData } = useMapData({
    onlyFriendsAttending,
  });
  const { savedEventIds, goingEventIds, setEventRsvpStatus } = useDemoAppStore();
  const pendingMapFocus = useCrossTabNavStore((state) => state.pendingMapFocus);
  const clearPendingMapFocus = useCrossTabNavStore((state) => state.clearPendingMapFocus);

  const [showBuildings, setShowBuildings] = useState(true);
  const [showWalkingRoutes, setShowWalkingRoutes] = useState(true);
  const [showDiningZones, setShowDiningZones] = useState(true);
  const [showListView, setShowListView] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventGroupId, setSelectedEventGroupId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedDiningZoneId, setSelectedDiningZoneId] = useState<string | null>(null);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [wayfindingJourney, setWayfindingJourney] = useState<WayfindingJourney | null>(null);
  const [createEventCoordinate, setCreateEventCoordinate] =
    useState<MapCoordinate | null>(null);
  const [createEventDraft, setCreateEventDraft] = useState<CreateEventDraft>(
    buildCreateEventDraft,
  );
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const detailEventQuery = useMapEventDetail(detailEventId);
  const { results: searchResults, isLoading: isSearchLoading } = useMapSearchResults({
    query: searchQuery,
    events: rawEvents,
    buildings,
  });

  const isHeatmapMode = selectedCategories.length === 0;
  const filteredEvents = useMemo(
    () =>
      filterAndSortEvents(rawEvents, {
        searchQuery,
        selectedCategories,
        timeFilter,
        sortBy,
        customRange,
        onlyFriendsAttending: onlyFriendsAttending && !isSupabaseConfigured,
        userLocation,
      }),
    [
      customRange,
      onlyFriendsAttending,
      rawEvents,
      searchQuery,
      selectedCategories,
      sortBy,
      timeFilter,
      userLocation,
    ],
  );
  const eventById = useMemo(
    () => new Map(rawEvents.map((event) => [event.id, event])),
    [rawEvents],
  );
  const eventGroups = useMemo(
    () => buildEventLocationGroups(filteredEvents, isHeatmapMode ? 'heatmap' : 'category'),
    [filteredEvents, isHeatmapMode],
  );
  const densityByEventId = useMemo(() => getDensityMap(filteredEvents), [filteredEvents]);
  const liveCounter = useMemo(() => getLiveEventCounter(filteredEvents), [filteredEvents]);

  const selectedGroup = useMemo(
    () => eventGroups.find((group) => group.id === selectedEventGroupId) ?? null,
    [eventGroups, selectedEventGroupId],
  );
  const selectedEvent = useMemo(
    () => (selectedEventId ? eventById.get(selectedEventId) ?? null : null),
    [eventById, selectedEventId],
  );
  const detailEvent = useMemo(
    () =>
      detailEventQuery.data?.event ??
      (detailEventId ? eventById.get(detailEventId) ?? null : null),
    [detailEventId, detailEventQuery.data?.event, eventById],
  );
  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId) ?? null,
    [selectedBuildingId],
  );
  const selectedRoute = useMemo(
    () => campusRoutes.find((route) => route.id === selectedRouteId) ?? null,
    [selectedRouteId],
  );
  const selectedDiningZone = useMemo(
    () => diningZones.find((zone) => zone.id === selectedDiningZoneId) ?? null,
    [selectedDiningZoneId],
  );
  const selectedBuildingEvents = useMemo(
    () => (selectedBuilding ? findBuildingEvents(selectedBuilding, filteredEvents) : []),
    [filteredEvents, selectedBuilding],
  );
  const nearestCreateLocation = useMemo(
    () => (createEventCoordinate ? findNearestBuilding(createEventCoordinate) : null),
    [createEventCoordinate],
  );

  useEffect(() => {
    if (selectedEventId && !filteredEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [filteredEvents, selectedEventId]);

  useEffect(() => {
    if (
      selectedEventGroupId &&
      !eventGroups.some((group) => group.id === selectedEventGroupId)
    ) {
      setSelectedEventGroupId(null);
    }
  }, [eventGroups, selectedEventGroupId]);

  useEffect(() => {
    if (locationError) {
      Alert.alert('Location unavailable', locationError);
    }
  }, [locationError]);

  useEffect(() => {
    if (createEventCoordinate) {
      setCreateEventDraft(buildCreateEventDraft());
    }
  }, [createEventCoordinate]);

  const clearSelections = () => {
    setSelectedEventId(null);
    setSelectedEventGroupId(null);
    setSelectedBuildingId(null);
    setSelectedRouteId(null);
    setSelectedDiningZoneId(null);
    setDetailEventId(null);
    setWayfindingJourney(null);
  };

  const focusEvent = (event: Event) => {
    const group = eventGroups.find((item) =>
      item.events.some((groupEvent) => groupEvent.id === event.id),
    );
    setSelectedBuildingId(null);
    setSelectedRouteId(null);
    setSelectedDiningZoneId(null);
    setWayfindingJourney(null);
    setSelectedEventGroupId(group?.id ?? null);
    setSelectedEventId(event.id);
    setShowListView(false);
    setFocusRequest(
      buildFocusRequestForCoordinate(
        `event-${event.id}`,
        group?.coordinate ?? [
          event.longitude ?? campusMapCenter[0],
          event.latitude ?? campusMapCenter[1],
        ],
        16.65,
      ),
    );
  };

  const focusGroup = (group: EventLocationGroup) => {
    setSelectedBuildingId(null);
    setSelectedRouteId(null);
    setSelectedDiningZoneId(null);
    setWayfindingJourney(null);
    setSelectedEventGroupId(group.id);
    setFocusRequest(buildFocusRequestForCoordinate(`group-${group.id}`, group.coordinate, 16.35));

    if (group.events.length === 1) {
      setSelectedEventId(group.events[0].id);
      setShowListView(false);
      return;
    }

    setSelectedEventId(null);
    setShowListView(false);
  };

  useEffect(() => {
    if (!pendingMapFocus) {
      return;
    }

    if (pendingMapFocus.type === 'event') {
      const event = eventById.get(pendingMapFocus.eventId);
      if (event) {
        focusEvent(event);
      } else {
        clearSelections();
        setShowListView(false);
        setDetailEventId(pendingMapFocus.eventId);
        setFocusRequest(
          buildFocusRequestForCoordinate(
            `event-${pendingMapFocus.eventId}`,
            [pendingMapFocus.longitude, pendingMapFocus.latitude],
            16.65,
          ),
        );
      }

      clearPendingMapFocus();
      return;
    }

    const building =
      buildings.find((candidate) => candidate.id === pendingMapFocus.locationId) ??
      buildings.find((candidate) => candidate.name === pendingMapFocus.label) ??
      null;

    clearSelections();
    setShowListView(false);
    setSelectedBuildingId(building?.id ?? null);
    setFocusRequest(
      buildFocusRequestForCoordinate(
        `location-${pendingMapFocus.locationId}`,
        [pendingMapFocus.longitude, pendingMapFocus.latitude],
        16.45,
      ),
    );
    clearPendingMapFocus();
  }, [clearPendingMapFocus, eventById, pendingMapFocus]);

  const handleRouteToEvent = async (event: Event) => {
    if (event.latitude === null || event.longitude === null) {
      return;
    }

    const origin = userLocation ?? (await requestUserLocation());
    const journey = buildWayfindingJourney({
      destinationId: event.id,
      destinationType: 'event',
      destinationLabel: event.title,
      destinationCoordinate: [event.longitude, event.latitude],
      subtitle: event.location_name,
      originCoordinate: origin ? toMapCoordinate(origin) : undefined,
      startLabel: origin ? 'Your location' : undefined,
    });

    setWayfindingJourney(journey);
    setFocusRequest(
      buildFocusRequestFromCoordinates(journey.id, journey.coordinates, {
        padding: 72,
        zoomLevel: 16.2,
      }),
    );
  };

  const handleRouteToBuilding = async (building: Building) => {
    const origin = userLocation ?? (await requestUserLocation());
    const journey = buildWayfindingJourney({
      destinationId: building.id,
      destinationType: 'building',
      destinationLabel: building.name,
      destinationCoordinate: [building.longitude, building.latitude],
      subtitle: building.description,
      originCoordinate: origin ? toMapCoordinate(origin) : undefined,
      startLabel: origin ? 'Your location' : undefined,
    });

    setWayfindingJourney(journey);
    setFocusRequest(
      buildFocusRequestFromCoordinates(journey.id, journey.coordinates, {
        padding: 72,
        zoomLevel: 16.2,
      }),
    );
  };

  const handleDirections = async (label: string, coordinate: MapCoordinate) => {
    const url = getMapsUrl(label, coordinate);

    if (!(await Linking.canOpenURL(url))) {
      Alert.alert('Unable to open directions', 'No maps app was available for this action.');
      return;
    }

    await Linking.openURL(url);
  };

  const handleShare = async (event: Event) => {
    await Share.share({
      message: `${event.title}\n${getContextualTimeLabel(event)}\n${event.location_name}`,
    });
  };

  const handleRsvpAction = async (
    event: Event,
    status: 'going' | 'interested',
  ) => {
    try {
      if (isSupabaseConfigured) {
        await submitEventRsvpRemote({
          eventId: event.id,
          status,
          action: 'upsert',
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['map-events'] }),
          queryClient.invalidateQueries({ queryKey: ['map-event-detail', event.id] }),
        ]);
      }

      setEventRsvpStatus(event.id, status);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update your RSVP right now.';
      Alert.alert('RSVP unavailable', message);
    }
  };

  const handleReportEvent = async (eventId: string) => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Report event',
        'Reporting is ready on the backend once Supabase is configured for this app.',
      );
      return;
    }

    try {
      await reportMapEventRemote({
        eventId,
        reason: 'misleading',
      });
      await queryClient.invalidateQueries({ queryKey: ['map-event-detail', eventId] });

      Alert.alert('Report sent', 'Thanks. The moderation queue has been updated.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to report this event right now.';
      Alert.alert('Report unavailable', message);
    }
  };

  const handleQuickLens = async (lensId: (typeof QUICK_LENSES)[number]['id']) => {
    if (lensId === 'open_now') {
      useMapFilterStore.setState({
        selectedCategories: [],
        timeFilter: 'happening_now',
        searchQuery: '',
      });
      return;
    }

    if (lensId === 'food') {
      useMapFilterStore.setState({
        selectedCategories: [EventCategory.Food],
        timeFilter: 'today',
        searchQuery: '',
      });
      return;
    }

    if (lensId === 'study') {
      useMapFilterStore.setState({
        selectedCategories: [],
        timeFilter: 'today',
        searchQuery: 'study',
      });
      return;
    }

    const location = userLocation ?? (await requestUserLocation());
    useMapFilterStore.setState({
      selectedCategories: [
        EventCategory.Party,
        EventCategory.Social,
        EventCategory.Arts,
      ],
      timeFilter: 'today',
      sortBy: location ? 'nearest' : 'soonest',
      searchQuery: '',
    });
  };

  const handleSearchResult = (resultId: string) => {
    const result = searchResults.find((item) => item.id === resultId);

    if (!result) {
      return;
    }

    setSearchQuery('');

    if (result.type === 'event') {
      const eventId = result.event_ids[0];
      const event = eventId ? eventById.get(eventId) : null;
      if (event) {
        focusEvent(event);
        return;
      }

      clearSelections();
      setDetailEventId(eventId ?? null);
      setFocusRequest(
        buildFocusRequestForCoordinate(result.id, [result.longitude, result.latitude], 16.55),
      );
      return;
    }

    const building =
      buildings.find((item) => item.id === result.id.replace(/^location-/, '')) ??
      buildings.find((item) => item.name === result.title);

    if (building) {
      clearSelections();
      setSelectedBuildingId(building.id);
      setFocusRequest(
        buildFocusRequestForCoordinate(
          `building-${building.id}`,
          [result.longitude, result.latitude],
          16.5,
        ),
      );
      return;
    }

    clearSelections();
    setFocusRequest(
      buildFocusRequestForCoordinate(result.id, [result.longitude, result.latitude], 16.3),
    );
  };

  const handleJumpToLive = () => {
    const event = getNearestLiveEvent(filteredEvents, userLocation);

    if (!event) {
      Alert.alert('No live events', 'There are no live events matching your current filters.');
      return;
    }

    focusEvent(event);
  };

  const handleCreateFromLongPress = (coordinate: MapCoordinate) => {
    clearSelections();
    setCreateEventCoordinate(coordinate);
  };

  const handleSubmitCreateEvent = async () => {
    if (!createEventCoordinate) {
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert(
        'Supabase required',
        'Event creation is ready on the backend, but this app still needs your Supabase env vars and auth session to publish events.',
      );
      return;
    }

    if (!createEventDraft.title.trim()) {
      Alert.alert('Missing title', 'Give your event a title before publishing it.');
      return;
    }

    const startsAt = new Date(createEventDraft.startsAt);
    const endsAt = new Date(createEventDraft.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      Alert.alert(
        'Invalid time',
        'Make sure the end time is after the start time and both fields are valid.',
      );
      return;
    }

    setIsSubmittingEvent(true);

    try {
      const result = await createMapEventRemote({
        title: createEventDraft.title.trim(),
        description: createEventDraft.description.trim(),
        category: createEventDraft.category,
        locationName: nearestCreateLocation?.building.name,
        latitude: createEventCoordinate[1],
        longitude: createEventCoordinate[0],
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        maxCapacity: createEventDraft.maxCapacity
          ? Number(createEventDraft.maxCapacity)
          : null,
        tags: createEventDraft.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setCreateEventCoordinate(null);
      setCreateEventDraft(buildCreateEventDraft());
      await queryClient.invalidateQueries({ queryKey: ['map-events'] });
      await refetchMapData();
      Alert.alert(
        'Event created',
        `${result.event.title} is now pinned on the map${
          result.snappedLocation ? ` near ${result.snappedLocation.name}` : ''
        }.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to publish the event right now.';
      Alert.alert('Create event unavailable', message);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  return (
    <ScreenLayout
      title="Map"
      subtitle="Live campus pulse, density hotspots, and event discovery across UMD."
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="map-outline"
          label="Campus Pulse"
          color={colors.primary.main}
          tintColor={colors.primary.lightest}
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.topControls}>
          <View style={styles.searchCard}>
            <Ionicons name="search" size={18} color={colors.text.tertiary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search events or campus places"
              placeholderTextColor={colors.text.tertiary}
              style={styles.searchInput}
              accessibilityLabel="Search campus events and locations"
            />
            <Pressable
              onPress={() => setFilterModalOpen(true)}
              style={styles.controlIconButton}
            >
              <Ionicons name="options-outline" size={18} color={colors.text.primary} />
            </Pressable>
          </View>

          {searchResults.length > 0 ? (
            <Card style={styles.searchResultsCard}>
              {searchResults.map((result) => (
                <Pressable
                  key={result.id}
                  onPress={() => handleSearchResult(result.id)}
                  style={styles.searchResultRow}
                >
                  <View style={styles.searchResultIcon}>
                    <Ionicons
                      name={
                        result.type === 'event'
                          ? 'sparkles-outline'
                          : 'business-outline'
                      }
                      size={16}
                      color={colors.primary.main}
                    />
                  </View>
                  <View style={styles.searchResultCopy}>
                    <Text style={styles.searchResultTitle}>{result.title}</Text>
                    <Text style={styles.searchResultSubtitle}>{result.subtitle}</Text>
                  </View>
                </Pressable>
              ))}
            </Card>
          ) : isSearchLoading ? (
            <Card style={styles.searchResultsCard}>
              <Text style={styles.helperText}>Searching campus events...</Text>
            </Card>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickLensRow}
          >
            {QUICK_LENSES.map((lens) => (
              <Pressable
                key={lens.id}
                onPress={() => void handleQuickLens(lens.id)}
                style={styles.quickLensChip}
              >
                <Ionicons name={lens.icon} size={14} color={colors.text.primary} />
                <Text style={styles.quickLensLabel}>{lens.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            <Pressable
              onPress={() => useMapFilterStore.setState({ selectedCategories: [] })}
              style={[styles.categoryChip, isHeatmapMode && styles.allChipActive]}
            >
              <View style={styles.allChipDots}>
                {['#42A5F5', '#26A69A', '#FFA726', '#FF5722', '#D32F2F'].map(
                  (color) => (
                    <View key={color} style={[styles.allChipDot, { backgroundColor: color }]} />
                  ),
                )}
              </View>
              <Text
                style={[
                  styles.categoryChipLabel,
                  isHeatmapMode && styles.categoryChipLabelDark,
                ]}
              >
                All
              </Text>
            </Pressable>

            {MAP_CATEGORY_OPTIONS.filter((option) => option.value !== 'all').map((option) => {
              const selected = selectedCategories.includes(option.value as EventCategory);
              return (
                <Pressable
                  key={option.value}
                  onPress={() => toggleCategory(option.value as EventCategory)}
                  style={[
                    styles.categoryChip,
                    { borderColor: option.color },
                    selected && { backgroundColor: option.color },
                  ]}
                >
                  <View
                    style={[
                      styles.categoryDot,
                      {
                        backgroundColor: selected
                          ? colors.brand.white
                          : option.color,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.categoryChipLabel,
                      selected && styles.categoryChipLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.mapShell}>
          <CampusMap
            style={styles.map}
            events={filteredEvents}
            eventGroups={eventGroups}
            densityByEventId={densityByEventId}
            buildings={buildings}
            showEvents
            showBuildings={showBuildings}
            showWalkingRoutes={showWalkingRoutes}
            showDiningZones={showDiningZones}
            clusterEvents
            isHeatmapMode={isHeatmapMode}
            activeBuildingId={selectedBuildingId}
            activeEventGroupId={selectedEventGroupId}
            activeRouteId={selectedRouteId}
            activeDiningZoneId={selectedDiningZoneId}
            userLocation={userLocation}
            focusRequest={focusRequest}
            wayfindingJourney={wayfindingJourney}
            onSelectEventGroup={focusGroup}
            onSelectBuilding={(building) => {
              clearSelections();
              setSelectedBuildingId(building.id);
              setFocusRequest(
                buildFocusRequestForCoordinate(
                  `building-${building.id}`,
                  [building.longitude, building.latitude],
                  16.5,
                ),
              );
            }}
            onSelectRoute={(route) => {
              clearSelections();
              setSelectedRouteId(route.id);
              setFocusRequest(
                buildFocusRequestFromCoordinates(`route-${route.id}`, route.coordinates, {
                  padding: 72,
                }),
              );
            }}
            onSelectDiningZone={(zone) => {
              clearSelections();
              setSelectedDiningZoneId(zone.id);
              setFocusRequest(
                buildFocusRequestFromCoordinates(`zone-${zone.id}`, zone.coordinates, {
                  padding: 72,
                }),
              );
            }}
            onLongPressCoordinate={handleCreateFromLongPress}
          />

          <Pressable onPress={handleJumpToLive} style={styles.liveCounterPill}>
            <View style={styles.liveCounterDot} />
            <Text style={styles.liveCounterText}>
              {liveCounter.liveCount} live · {liveCounter.nextTwoHoursCount} in next 2hrs
            </Text>
          </Pressable>

          <View style={styles.mapFabColumn}>
            <Pressable
              onPress={() =>
                void requestUserLocation().then((location) => {
                  if (!location) {
                    return;
                  }
                  setFocusRequest(
                    buildFocusRequestForCoordinate(
                      `user-${Date.now()}`,
                      [location.longitude, location.latitude],
                      16.5,
                    ),
                  );
                })
              }
              style={styles.fab}
              accessibilityLabel="Center map on my location"
            >
              <Ionicons
                name={isLocating ? 'locate' : 'locate-outline'}
                size={20}
                color={colors.text.primary}
              />
            </Pressable>

            <Pressable
              onPress={() => setShowListView(true)}
              style={styles.fab}
              accessibilityLabel="Open event list view"
            >
              <Ionicons name="list-outline" size={20} color={colors.text.primary} />
            </Pressable>

            <Pressable
              onPress={() => setCreateEventCoordinate(campusMapCenter)}
              style={[styles.fab, styles.primaryFab]}
              accessibilityLabel="Create event"
            >
              <Ionicons name="add" size={22} color={colors.brand.white} />
            </Pressable>
          </View>

          <View style={styles.mapLegend}>
            <Text style={styles.mapLegendTitle}>
              {isHeatmapMode ? 'Heatmap mode' : 'Category mode'}
            </Text>
            <Text style={styles.mapLegendBody}>
              {isHeatmapMode
                ? 'Marker color and size reflect nearby event density. Tap a hotspot to unpack what is happening there.'
                : 'Markers switch to category colors when you filter, so each pin tells you what kind of event it represents.'}
            </Text>
          </View>
        </View>

        {loading ? (
          <Card>
            <Text style={styles.helperText}>Loading today's campus activity...</Text>
          </Card>
        ) : null}
      </View>

      <BottomSheet
        visible={Boolean(selectedGroup && !selectedEvent && selectedGroup.events.length > 1)}
        onClose={() => setSelectedEventGroupId(null)}
        snapPoints={[0.46]}
      >
        {selectedGroup ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetTitle}>{selectedGroup.locationName}</Text>
            <Text style={styles.sheetSubtitle}>
              {selectedGroup.eventCount} events here · {selectedGroup.densityLabel}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetList}
            >
              {selectedGroup.events.map((summary) => {
                const event = eventById.get(summary.id);
                if (!event) {
                  return null;
                }

                return (
                  <EventListItem
                    key={event.id}
                    event={event}
                    isSaved={savedEventIds.includes(event.id)}
                    isGoing={goingEventIds.includes(event.id)}
                    onPress={() => focusEvent(event)}
                  />
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={Boolean(selectedEvent)}
        onClose={() => setSelectedEventId(null)}
        snapPoints={[0.35]}
      >
        {selectedEvent ? (
          <View style={styles.sheetBlock}>
            <View style={styles.previewHeader}>
              <View style={styles.previewCopy}>
                <View style={styles.previewBadges}>
                  <Badge
                    label={selectedEvent.category}
                    color={
                      colors.eventCategory[
                        selectedEvent.category as keyof typeof colors.eventCategory
                      ] ?? colors.primary.main
                    }
                  />
                  {isEventLive(selectedEvent) ? (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveBadgeDot} />
                      <Text style={styles.liveBadgeText}>Happening Now</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.previewTitle}>{selectedEvent.title}</Text>
                <Text style={styles.previewMeta}>
                  {getContextualTimeLabel(selectedEvent)}
                </Text>
                <Text style={styles.previewMeta}>{selectedEvent.location_name}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {(
                    selectedEvent.attendee_count ?? selectedEvent.rsvp_count
                  ).toLocaleString()}
                </Text>
                <Text style={styles.metricLabel}>Going</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {(selectedEvent.interested_count ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.metricLabel}>Interested</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {selectedEvent.organizer_name ?? 'xUMD'}
                </Text>
                <Text style={styles.metricLabel}>Organizer</Text>
              </View>
            </View>

            <View style={styles.sheetActionRow}>
              <Button
                title="Going"
                onPress={() => void handleRsvpAction(selectedEvent, 'going')}
                style={styles.flexButton}
              />
              <Button
                title="Interested"
                onPress={() => void handleRsvpAction(selectedEvent, 'interested')}
                style={styles.flexButton}
                variant="secondary"
              />
            </View>

            <View style={styles.sheetActionRow}>
              <Button
                title="Route"
                onPress={() => void handleRouteToEvent(selectedEvent)}
                style={styles.flexButton}
                variant="ghost"
              />
              <Button
                title="Details"
                onPress={() => {
                  setDetailEventId(selectedEvent.id);
                  setSelectedEventId(null);
                }}
                style={styles.flexButton}
                variant="secondary"
              />
            </View>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={Boolean(detailEvent)}
        onClose={() => setDetailEventId(null)}
        snapPoints={[0.82]}
      >
        {detailEvent ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailSheetContent}
          >
            {detailEvent.image_url ? (
              <Image source={{ uri: detailEvent.image_url }} style={styles.detailHeroImage} />
            ) : null}

            <View style={styles.previewBadges}>
              <Badge
                label={detailEvent.category}
                color={
                  colors.eventCategory[
                    detailEvent.category as keyof typeof colors.eventCategory
                  ] ?? colors.primary.main
                }
              />
              <Text style={styles.detailOrganizer}>
                Hosted by{' '}
                {detailEventQuery.data?.organizer?.display_name ??
                  detailEvent.organizer_name ??
                  'xUMD'}
              </Text>
            </View>

            <Text style={styles.detailTitle}>{detailEvent.title}</Text>
            <Text style={styles.detailMeta}>{getContextualTimeLabel(detailEvent)}</Text>
            <Text style={styles.detailMeta}>{detailEvent.location_name}</Text>
            {detailEventQuery.isLoading ? (
              <Text style={styles.detailMeta}>Loading live event details...</Text>
            ) : null}
            <Text style={styles.detailDescription}>{detailEvent.description}</Text>

            {detailEvent.tags?.length ? (
              <View style={styles.tagRow}>
                {detailEvent.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagLabel}>#{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Card style={styles.detailInfoCard}>
              <Text style={styles.cardHeading}>People pulse</Text>
              <Text style={styles.infoText}>
                {(
                  detailEventQuery.data?.rsvp_stats.going ??
                  detailEvent.attendee_count ??
                  detailEvent.rsvp_count
                ).toLocaleString()}{' '}
                Terps marked going and{' '}
                {(
                  detailEventQuery.data?.rsvp_stats.interested ??
                  detailEvent.interested_count ??
                  0
                ).toLocaleString()}{' '}
                are interested.
              </Text>
            </Card>

            {detailEventQuery.data?.campus_location ? (
              <Card style={styles.detailInfoCard}>
                <Text style={styles.cardHeading}>Pinned building</Text>
                <Text style={styles.infoText}>
                  {detailEventQuery.data.campus_location.name}
                  {detailEventQuery.data.campus_location.address
                    ? ` · ${detailEventQuery.data.campus_location.address}`
                    : ''}
                </Text>
              </Card>
            ) : null}

            {detailEventQuery.data?.friends_attending?.length ? (
              <Card style={styles.detailInfoCard}>
                <Text style={styles.cardHeading}>Friends attending</Text>
                <View style={styles.inlineList}>
                  {detailEventQuery.data.friends_attending.map((friend) => (
                    <View key={friend.id} style={styles.inlineEventRow}>
                      <View style={styles.inlineEventDot} />
                      <View style={styles.inlineEventCopy}>
                        <Text style={styles.inlineEventTitle}>{friend.display_name}</Text>
                        <Text style={styles.inlineEventMeta}>
                          {friend.major ?? 'UMD community'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            <View style={styles.detailButtonGrid}>
              <Button
                title="Open full event"
                onPress={() => navigation.navigate('EventDetail', { eventId: detailEvent.id })}
                fullWidth
              />
              <Button
                title="Get Directions"
                onPress={() =>
                  void handleDirections(detailEvent.location_name, [
                    detailEvent.longitude ?? campusMapCenter[0],
                    detailEvent.latitude ?? campusMapCenter[1],
                  ])
                }
                fullWidth
                variant="secondary"
              />
              <Button
                title="Share"
                onPress={() => void handleShare(detailEvent)}
                fullWidth
                variant="ghost"
              />
              <Button
                title="Report"
                onPress={() => void handleReportEvent(detailEvent.id)}
                fullWidth
                variant="ghost"
              />
            </View>
          </ScrollView>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={Boolean(selectedBuilding)}
        onClose={() => setSelectedBuildingId(null)}
        snapPoints={[0.52]}
      >
        {selectedBuilding ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBlock}
          >
            <Badge
              label={buildingTypeMeta[selectedBuilding.building_type].label}
              color={buildingTypeMeta[selectedBuilding.building_type].color}
            />
            <Text style={styles.sheetTitle}>{selectedBuilding.name}</Text>
            <Text style={styles.sheetDescription}>{selectedBuilding.description}</Text>

            <Card style={styles.detailInfoCard}>
              <Text style={styles.cardHeading}>What's here now</Text>
              {selectedBuildingEvents.length > 0 ? (
                <View style={styles.inlineList}>
                  {selectedBuildingEvents.slice(0, 4).map((event) => (
                    <Pressable
                      key={event.id}
                      onPress={() => focusEvent(event)}
                      style={styles.inlineEventRow}
                    >
                      <View style={styles.inlineEventDot} />
                      <View style={styles.inlineEventCopy}>
                        <Text style={styles.inlineEventTitle}>{event.title}</Text>
                        <Text style={styles.inlineEventMeta}>
                          {getContextualTimeLabel(event)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoText}>
                  No approved events are pinned here right now.
                </Text>
              )}
            </Card>

            <View style={styles.sheetActionRow}>
              <Button
                title="Route Here"
                onPress={() => void handleRouteToBuilding(selectedBuilding)}
                style={styles.flexButton}
              />
              <Button
                title="Directions"
                onPress={() =>
                  void handleDirections(selectedBuilding.name, [
                    selectedBuilding.longitude,
                    selectedBuilding.latitude,
                  ])
                }
                style={styles.flexButton}
                variant="secondary"
              />
            </View>
          </ScrollView>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={Boolean(selectedRoute || wayfindingJourney)}
        onClose={() => {
          setSelectedRouteId(null);
          setWayfindingJourney(null);
        }}
        snapPoints={[0.32]}
      >
        <View style={styles.sheetBlock}>
          <Text style={styles.sheetTitle}>
            {wayfindingJourney?.title ?? selectedRoute?.name ?? 'Route'}
          </Text>
          <Text style={styles.sheetSubtitle}>
            {wayfindingJourney
              ? `${wayfindingJourney.durationLabel} · ${wayfindingJourney.distanceLabel}`
              : selectedRoute?.description ?? 'Campus walking route'}
          </Text>
          <Text style={styles.sheetDescription}>
            {wayfindingJourney?.subtitle ?? selectedRoute?.description ?? ''}
          </Text>
          <Button
            title="Clear Route"
            onPress={() => {
              setSelectedRouteId(null);
              setWayfindingJourney(null);
            }}
            fullWidth
            variant="secondary"
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={Boolean(selectedDiningZone)}
        onClose={() => setSelectedDiningZoneId(null)}
        snapPoints={[0.32]}
      >
        {selectedDiningZone ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetTitle}>{selectedDiningZone.name}</Text>
            <Text style={styles.sheetDescription}>{selectedDiningZone.description}</Text>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={showListView}
        onClose={() => setShowListView(false)}
        snapPoints={[0.72]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBlock}>
          <Text style={styles.sheetTitle}>Event List</Text>
          <Text style={styles.sheetSubtitle}>
            {filteredEvents.length} events match your current map lens
          </Text>
          <View style={styles.sheetList}>
            {filteredEvents.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                isSaved={savedEventIds.includes(event.id)}
                isGoing={goingEventIds.includes(event.id)}
                onPress={() => {
                  setShowListView(false);
                  focusEvent(event);
                }}
              />
            ))}
          </View>
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={isFilterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        snapPoints={[0.62]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBlock}>
          <Text style={styles.sheetTitle}>Refine the map</Text>
          <Text style={styles.sheetSubtitle}>
            Switch lenses without overwhelming the screen.
          </Text>

          <Text style={styles.filterSectionTitle}>Time</Text>
          <View style={styles.optionGrid}>
            {TIME_FILTER_OPTIONS.map((option) => {
              const selected = timeFilter === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setTimeFilter(option.value)}
                  style={[styles.optionChip, selected && styles.optionChipActive]}
                >
                  <Text
                    style={[
                      styles.optionChipLabel,
                      selected && styles.optionChipLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterSectionTitle}>Sort</Text>
          <View style={styles.optionGrid}>
            {[
              { value: 'soonest', label: 'Soonest' },
              { value: 'most_popular', label: 'Most Popular' },
              { value: 'nearest', label: 'Nearest' },
            ].map((option) => {
              const selected = sortBy === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSortBy(option.value as typeof sortBy)}
                  style={[styles.optionChip, selected && styles.optionChipActive]}
                >
                  <Text
                    style={[
                      styles.optionChipLabel,
                      selected && styles.optionChipLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterSectionTitle}>Map layers</Text>
          <View style={styles.toggleCardList}>
            {[
              {
                key: 'buildings',
                label: 'Buildings',
                value: showBuildings,
                onToggle: () => setShowBuildings((current) => !current),
              },
              {
                key: 'routes',
                label: 'Walking routes',
                value: showWalkingRoutes,
                onToggle: () => setShowWalkingRoutes((current) => !current),
              },
              {
                key: 'dining',
                label: 'Dining zones',
                value: showDiningZones,
                onToggle: () => setShowDiningZones((current) => !current),
              },
              {
                key: 'friends',
                label: 'Only friends attending',
                value: onlyFriendsAttending,
                onToggle: () =>
                  setOnlyFriendsAttending(!onlyFriendsAttending),
              },
            ].map((toggle) => (
              <Pressable key={toggle.key} onPress={toggle.onToggle} style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{toggle.label}</Text>
                <View style={[styles.togglePill, toggle.value && styles.togglePillActive]}>
                  <View style={[styles.toggleKnob, toggle.value && styles.toggleKnobActive]} />
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.sheetActionRow}>
            <Button
              title="Reset"
              onPress={() => {
                reset();
                setShowBuildings(true);
                setShowWalkingRoutes(true);
                setShowDiningZones(true);
              }}
              variant="secondary"
              style={styles.flexButton}
            />
            <Button
              title="Done"
              onPress={() => setFilterModalOpen(false)}
              style={styles.flexButton}
            />
          </View>
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={Boolean(createEventCoordinate)}
        onClose={() => setCreateEventCoordinate(null)}
        snapPoints={[0.72]}
      >
        {createEventCoordinate ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBlock}
          >
            <Text style={styles.sheetTitle}>Create Event Here</Text>
            <Text style={styles.sheetDescription}>
              This pin is at {createEventCoordinate[1].toFixed(5)},{' '}
              {createEventCoordinate[0].toFixed(5)}.
            </Text>
            <Card style={styles.detailInfoCard}>
              <Text style={styles.cardHeading}>Nearest campus location</Text>
              {nearestCreateLocation ? (
                <Text style={styles.infoText}>
                  {nearestCreateLocation.building.name} ·{' '}
                  {Math.round(nearestCreateLocation.distance)}m away
                </Text>
              ) : (
                <Text style={styles.infoText}>
                  No major campus location was close enough to suggest.
                </Text>
              )}
            </Card>

            <View style={styles.formSection}>
              <Text style={styles.filterSectionTitle}>Title</Text>
              <TextInput
                value={createEventDraft.title}
                onChangeText={(value) =>
                  setCreateEventDraft((current) => ({ ...current, title: value }))
                }
                placeholder="What is happening?"
                placeholderTextColor={colors.text.tertiary}
                style={styles.formInput}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.filterSectionTitle}>Description</Text>
              <TextInput
                value={createEventDraft.description}
                onChangeText={(value) =>
                  setCreateEventDraft((current) => ({ ...current, description: value }))
                }
                placeholder="Add context, details, and what Terps should expect."
                placeholderTextColor={colors.text.tertiary}
                style={[styles.formInput, styles.formInputMultiline]}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionGridRow}>
                  {MAP_CATEGORY_OPTIONS.filter((option) => option.value !== 'all').map((option) => {
                    const selected = createEventDraft.category === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() =>
                          setCreateEventDraft((current) => ({
                            ...current,
                            category: option.value as EventCategory,
                          }))
                        }
                        style={[
                          styles.optionChip,
                          { borderColor: option.color },
                          selected && { backgroundColor: option.color },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionChipLabel,
                            selected && styles.optionChipLabelActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formSplitRow}>
              <View style={[styles.formSection, styles.formSplitColumn]}>
                <Text style={styles.filterSectionTitle}>Starts</Text>
                <TextInput
                  value={createEventDraft.startsAt}
                  onChangeText={(value) =>
                    setCreateEventDraft((current) => ({ ...current, startsAt: value }))
                  }
                  placeholder="2026-04-04T18:30"
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.formInput}
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.formSection, styles.formSplitColumn]}>
                <Text style={styles.filterSectionTitle}>Ends</Text>
                <TextInput
                  value={createEventDraft.endsAt}
                  onChangeText={(value) =>
                    setCreateEventDraft((current) => ({ ...current, endsAt: value }))
                  }
                  placeholder="2026-04-04T20:30"
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.formInput}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formSplitRow}>
              <View style={[styles.formSection, styles.formSplitColumn]}>
                <Text style={styles.filterSectionTitle}>Capacity</Text>
                <TextInput
                  value={createEventDraft.maxCapacity}
                  onChangeText={(value) =>
                    setCreateEventDraft((current) => ({ ...current, maxCapacity: value }))
                  }
                  placeholder="Optional"
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.formInput}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formSection, styles.formSplitColumn]}>
                <Text style={styles.filterSectionTitle}>Tags</Text>
                <TextInput
                  value={createEventDraft.tags}
                  onChangeText={(value) =>
                    setCreateEventDraft((current) => ({ ...current, tags: value }))
                  }
                  placeholder="club, cs, networking"
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.formInput}
                />
              </View>
            </View>

            <Button
              title={isSubmittingEvent ? 'Publishing…' : 'Publish Event'}
              onPress={() => void handleSubmitCreateEvent()}
              fullWidth
            />
          </ScrollView>
        ) : null}
      </BottomSheet>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  topControls: {
    gap: spacing.sm,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },
  controlIconButton: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  searchResultsCard: {
    paddingVertical: spacing.sm,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchResultIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
  },
  searchResultCopy: {
    flex: 1,
    gap: 2,
  },
  searchResultTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  searchResultSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  quickLensRow: {
    paddingRight: spacing.md,
  },
  quickLensChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  quickLensLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  categoryRow: {
    paddingRight: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 38,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  allChipActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest,
  },
  allChipDots: {
    flexDirection: 'row',
    gap: 2,
    marginRight: 2,
  },
  allChipDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  categoryChipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  categoryChipLabelDark: {
    color: colors.primary.dark,
  },
  categoryChipLabelActive: {
    color: colors.brand.white,
  },
  mapShell: {
    height: 560,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.white,
    ...shadows.lg,
  },
  map: {
    flex: 1,
  },
  liveCounterPill: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(17, 24, 39, 0.86)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  liveCounterDot: {
    width: 9,
    height: 9,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
  },
  liveCounterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.brand.white,
  },
  mapFabColumn: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    gap: spacing.sm,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...shadows.md,
  },
  primaryFab: {
    backgroundColor: colors.primary.main,
  },
  mapLegend: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    maxWidth: 280,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: spacing.md,
    ...shadows.md,
  },
  mapLegendTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  mapLegendBody: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  helperText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  sheetBlock: {
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
  sheetList: {
    gap: spacing.sm,
  },
  eventListItem: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    gap: spacing.xs,
  },
  eventListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eventStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.status.success,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  savedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  eventListTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  eventListMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  previewHeader: {
    gap: spacing.sm,
  },
  previewCopy: {
    gap: spacing.sm,
  },
  previewBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  liveBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
  },
  liveBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.dark,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  previewTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  previewMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
  },
  metricValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  metricLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  detailSheetContent: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  detailHeroImage: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.gray[200],
  },
  detailOrganizer: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  detailTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  detailMeta: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  detailDescription: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  detailInfoCard: {
    gap: spacing.sm,
  },
  cardHeading: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  detailButtonGrid: {
    gap: spacing.sm,
  },
  sheetDescription: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  inlineList: {
    gap: spacing.sm,
  },
  inlineEventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  inlineEventDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    marginTop: 5,
    backgroundColor: colors.primary.main,
  },
  inlineEventCopy: {
    flex: 1,
    gap: 2,
  },
  inlineEventTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  inlineEventMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  filterSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionGridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  optionChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  optionChipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  optionChipLabelActive: {
    color: colors.brand.white,
  },
  formSection: {
    gap: spacing.sm,
  },
  formSplitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formSplitColumn: {
    flex: 1,
  },
  formInput: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },
  formInputMultiline: {
    minHeight: 120,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  toggleCardList: {
    gap: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  togglePill: {
    width: 50,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[300],
    padding: 3,
    justifyContent: 'center',
  },
  togglePillActive: {
    backgroundColor: colors.primary.main,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
});


