import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Image, Linking, PanResponder, PixelRatio, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import BottomSheet from '../../../shared/components/BottomSheet';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { buildings, type Building } from '../../../assets/data/buildings';
import { mockClubs } from '../../../assets/data/mockClubs';
import { useAuth } from '../../auth/hooks/useAuth';
import { useProfile } from '../../profile/hooks/useProfile';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { useCrossTabNavStore } from '../../../shared/stores/useCrossTabNavStore';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { EventCategory, type Event, type EventSearchResult } from '../../../shared/types';
import { createEventUrl } from '../../../navigation/deepLinks';
import type { MapStackParamList } from '../../../navigation/types';
import { isSupabaseConfigured } from '../../../services/supabase';
import { campusMapCenter } from '../config/campusMapStyle';
import CampusMap from '../components/CampusMap';
import { buildingDirectoryProfiles } from '../data/campusGeometry';
import { useMapData } from '../hooks/useMapData';
import { useMapEventDetail } from '../hooks/useMapEventDetail';
import { useMapSearchResults } from '../hooks/useMapSearchResults';
import { useUserLocation } from '../hooks/useUserLocation';
import { useMapFilterStore } from '../stores/useMapFilterStore';
import type { EventLocationGroup, MapCoordinate, MapFocusRequest, MapTimeFilter } from '../types';
import { buildActivityWeightMap, buildEventLocationGroups, filterAndSortEvents, getContextualTimeLabel, getLiveEventCounter, getNearestLiveEvent, getUpcomingTimeLabel, isEventLive } from '../utils/eventDiscovery';
import { buildFocusRequestForCoordinate, getDistanceMeters } from '../utils/wayfinding';
import { createMapEventRemote, reportMapEventRemote, submitEventRsvpRemote } from '../../../services/mapEvents';

type Props = NativeStackScreenProps<MapStackParamList, 'MapHome'>;
type SheetMode = 'group' | 'event' | 'building' | 'create' | null;
type RsvpStatus = 'going' | 'interested' | null;

type DraftEvent = {
  title: string;
  description: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string;
  maxCapacity: string;
};

const TIME_CHIPS: Array<{ value: MapTimeFilter; label: string; pulse?: boolean }> = [
  { value: 'happening_now', label: 'Happening Now', pulse: true },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
];

const CATEGORY_CHIPS: Array<{ value: EventCategory; label: string; color: string }> = [
  { value: EventCategory.Academic, label: 'Academic', color: '#1E88E5' },
  { value: EventCategory.Social, label: 'Social', color: '#E21833' },
  { value: EventCategory.Sports, label: 'Sports', color: '#16A34A' },
];

function makeNextDraft(): DraftEvent {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  return {
    title: '',
    description: '',
    category: EventCategory.Social,
    startsAt: start.toISOString().slice(0, 16),
    endsAt: end.toISOString().slice(0, 16),
    maxCapacity: '',
  };
}

function buildDirectionsUrl(label: string, coordinate: MapCoordinate) {
  const [longitude, latitude] = coordinate;
  const encodedLabel = encodeURIComponent(label);

  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w&q=${encodedLabel}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking&dir_action=navigate`;
}

function createFocusRequest(id: string, coordinate: MapCoordinate, zoomLevel = 16.45): MapFocusRequest {
  return {
    ...buildFocusRequestForCoordinate(`${id}-${Date.now()}`, coordinate, zoomLevel),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildSheetSnapPoint(
  viewportHeight: number,
  options: { preferredHeight: number; minHeight: number; maxHeight: number },
) {
  const maxAllowedHeight = Math.min(options.maxHeight, viewportHeight * 0.92);
  const resolvedHeight = clamp(options.preferredHeight, options.minHeight, maxAllowedHeight);
  return Number((resolvedHeight / viewportHeight).toFixed(3));
}

function getCurrentRsvpStatus(eventId: string, goingEventIds: string[], savedEventIds: string[]): RsvpStatus {
  if (goingEventIds.includes(eventId)) {
    return 'going';
  }

  if (savedEventIds.includes(eventId)) {
    return 'interested';
  }

  return null;
}

function patchEventRsvpCounts<T extends Partial<Event> & { id: string }>(
  event: T,
  previousStatus: RsvpStatus,
  nextStatus: RsvpStatus,
): T {
  let attendeeCount = Number(event.attendee_count ?? event.rsvp_count ?? 0);
  let interestedCount = Number(event.interested_count ?? 0);

  if (previousStatus === 'going') {
    attendeeCount = Math.max(0, attendeeCount - 1);
  }

  if (previousStatus === 'interested') {
    interestedCount = Math.max(0, interestedCount - 1);
  }

  if (nextStatus === 'going') {
    attendeeCount += 1;
  }

  if (nextStatus === 'interested') {
    interestedCount += 1;
  }

  return {
    ...event,
    attendee_count: attendeeCount,
    rsvp_count: attendeeCount,
    interested_count: interestedCount,
  };
}

function resolveNearestBuilding(coordinate: MapCoordinate) {
  return (
    buildings
      .map((building) => ({
        building,
        distanceMeters: getDistanceMeters(coordinate, [building.longitude, building.latitude]),
      }))
      .sort((left, right) => left.distanceMeters - right.distanceMeters)[0] ?? null
  );
}

function findBuildingEvents(building: Building, events: Event[]) {
  const anchor: MapCoordinate = [building.longitude, building.latitude];

  return events
    .filter((event) => {
      if (event.latitude === null || event.longitude === null) {
        return false;
      }

      const isNearby = getDistanceMeters(anchor, [event.longitude, event.latitude]) <= 135;
      const sameNamedLocation = event.location_name.toLowerCase().includes(building.name.toLowerCase());
      return isNearby || sameNamedLocation;
    })
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
}

function getCategoryIconName(category: EventCategory) {
  switch (category) {
    case EventCategory.Academic:
      return 'school-outline';
    case EventCategory.Social:
      return 'account-group-outline';
    case EventCategory.Sports:
      return 'basketball';
    case EventCategory.Career:
      return 'briefcase-outline';
    case EventCategory.Arts:
      return 'palette-outline';
    case EventCategory.Food:
      return 'silverware-fork-knife';
    case EventCategory.Workshop:
      return 'hammer-wrench';
    case EventCategory.Party:
      return 'party-popper';
    case EventCategory.Club:
      return 'flag-outline';
    default:
      return 'map-marker-outline';
  }
}

function SearchResultRow({
  result,
  onPress,
}: {
  result: EventSearchResult;
  onPress: () => void;
}) {
  const isEvent = result.type === 'event';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.searchResultRow, pressed ? styles.pressed : null]}>
      <View style={[styles.searchResultIcon, { backgroundColor: isEvent ? colors.primary.lightest : '#EEF2FF' }]}>
        <MaterialCommunityIcons
          name={isEvent ? 'calendar-star' : 'office-building-outline'}
          size={18}
          color={isEvent ? colors.primary.main : colors.text.primary}
        />
      </View>
      <View style={styles.searchResultCopy}>
        <Text style={styles.searchResultTitle} numberOfLines={1}>
          {result.title}
        </Text>
        <Text style={styles.searchResultSubtitle} numberOfLines={1}>
          {result.subtitle}
        </Text>
      </View>
      <Ionicons name="arrow-forward" size={14} color={colors.text.tertiary} />
    </Pressable>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  accentColor,
  pulse,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accentColor?: string;
  pulse?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterChip, active ? styles.filterChipActive : null, pressed ? styles.pressed : null]}>
      {accentColor ? <View style={[styles.filterChipDot, { backgroundColor: accentColor }]} /> : null}
      {pulse ? <View style={styles.filterChipPulse} /> : null}
      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function EventMiniCard({
  event,
  isGoing,
  onPress,
}: {
  event: Event;
  isGoing: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.miniEventCard, pressed ? styles.pressed : null]}>
      {event.image_url ? <Image source={{ uri: event.image_url }} style={styles.miniEventImage} /> : null}
      <View style={styles.miniEventBody}>
        <View style={styles.miniEventHeader}>
          <Text style={styles.miniEventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          {isGoing ? <Badge label="Going" color={colors.status.success} /> : null}
        </View>
        <Text style={styles.miniEventMeta}>{getUpcomingTimeLabel(event)}</Text>
        <Text style={styles.miniEventMeta} numberOfLines={1}>
          {event.organizer_name ?? 'xUMD'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MapHomeScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const { isWide, width: viewportWidth, height: viewportHeight } = useResponsive();
  const insets = useSafeAreaInsets();
  const isNativeMobile = Platform.OS !== 'web';
  const { user: authUser } = useAuth();
  const { user: profileUser } = useProfile();
  const { userLocation, isLocating, locationError, requestUserLocation } = useUserLocation();
  const pendingMapFocus = useCrossTabNavStore((state) => state.pendingMapFocus);
  const clearPendingMapFocus = useCrossTabNavStore((state) => state.clearPendingMapFocus);
  const setPendingCalendarFocus = useCrossTabNavStore((state) => state.setPendingCalendarFocus);
  const {
    selectedCategories,
    timeFilter,
    sortBy,
    customRange,
    onlyFriendsAttending,
    searchQuery,
    showActivityLayer,
    setSearchQuery,
    setTimeFilter,
    toggleCategory,
    setShowActivityLayer,
  } = useMapFilterStore();
  const { rawEvents, loading, refetch } = useMapData({ onlyFriendsAttending });
  const { savedEventIds, goingEventIds, setEventRsvpStatus } = useDemoAppStore();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [createCoordinate, setCreateCoordinate] = useState<MapCoordinate | null>(null);
  const [draftEvent, setDraftEvent] = useState<DraftEvent>(makeNextDraft);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isPeekCollapsed, setIsPeekCollapsed] = useState(false);

  const detailQuery = useMapEventDetail(selectedEventId);
  const { results: searchResults, isLoading: searchLoading } = useMapSearchResults({
    query: searchQuery,
    events: rawEvents,
    buildings,
  });

  const currentViewerId = authUser?.id ?? profileUser.id;
  const currentViewerName = authUser?.display_name ?? profileUser.displayName ?? 'xUMD student';
  const viewerRsvpIds = useMemo(() => new Set([...goingEventIds, ...savedEventIds]), [goingEventIds, savedEventIds]);
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
    [customRange, onlyFriendsAttending, rawEvents, searchQuery, selectedCategories, sortBy, timeFilter, userLocation],
  );
  const eventsById = useMemo(() => new Map(rawEvents.map((event) => [event.id, event])), [rawEvents]);
  const eventGroups = useMemo(
    () =>
      buildEventLocationGroups(filteredEvents, 'category', viewerRsvpIds, {
        viewportWidth,
        viewportHeight,
        pixelRatio: PixelRatio.get(),
      }),
    [filteredEvents, viewerRsvpIds, viewportHeight, viewportWidth],
  );
  const activityWeights = useMemo(() => buildActivityWeightMap(filteredEvents), [filteredEvents]);
  const liveCounter = useMemo(() => getLiveEventCounter(eventGroups), [eventGroups]);
  const selectedGroup = useMemo(
    () => eventGroups.find((group) => group.id === selectedGroupId) ?? null,
    [eventGroups, selectedGroupId],
  );
  const selectedEvent = useMemo(
    () => detailQuery.data?.event ?? (selectedEventId ? eventsById.get(selectedEventId) ?? null : null),
    [detailQuery.data?.event, eventsById, selectedEventId],
  );
  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId) ?? null,
    [selectedBuildingId],
  );
  const selectedBuildingProfile = useMemo(
    () => (selectedBuilding ? buildingDirectoryProfiles[selectedBuilding.id] ?? null : null),
    [selectedBuilding],
  );
  const buildingEvents = useMemo(
    () => (selectedBuilding ? findBuildingEvents(selectedBuilding, filteredEvents) : []),
    [filteredEvents, selectedBuilding],
  );
  const nearestCreateBuilding = useMemo(
    () => (createCoordinate ? resolveNearestBuilding(createCoordinate) : null),
    [createCoordinate],
  );
  const relatedClubEvents = useMemo(() => {
    if (!selectedEvent?.club_id) {
      return [];
    }

    return rawEvents
      .filter(
        (event) =>
          event.club_id === selectedEvent.club_id &&
          event.id !== selectedEvent.id &&
          new Date(event.ends_at).getTime() > Date.now(),
      )
      .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())
      .slice(0, 5);
  }, [rawEvents, selectedEvent?.club_id, selectedEvent?.id]);
  const upcomingEvents = useMemo(
    () =>
      filteredEvents
        .filter((event) => new Date(event.ends_at).getTime() > Date.now())
        .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())
        .slice(0, 3),
    [filteredEvents],
  );
  const selectedEventStats = detailQuery.data?.rsvp_stats ?? {
    going: selectedEvent?.attendee_count ?? selectedEvent?.rsvp_count ?? 0,
    interested: selectedEvent?.interested_count ?? 0,
  };
  const selectedEventRsvp = selectedEvent
    ? getCurrentRsvpStatus(selectedEvent.id, goingEventIds, savedEventIds)
    : null;
  const eventHostClub = selectedEvent?.club_id
    ? mockClubs.find((club) => club.id === selectedEvent.club_id) ?? null
    : null;
  const hasSearchQuery = searchQuery.trim().length >= 2;
  const isAllChipActive = selectedCategories.length === 0 && timeFilter === 'all';
  const activeSheet: SheetMode = createCoordinate
    ? 'create'
    : selectedBuilding
      ? 'building'
      : selectedEvent
        ? 'event'
        : selectedGroup && selectedGroup.events.length > 1
          ? 'group'
          : null;
  const sharedSheetMinHeight = isWide ? 380 : 320;
  const groupSheetSnapPoints = useMemo(
    () => [
      buildSheetSnapPoint(viewportHeight, {
        preferredHeight: viewportHeight * 0.56,
        minHeight: sharedSheetMinHeight,
        maxHeight: isWide ? 620 : 520,
      }),
    ],
    [isWide, sharedSheetMinHeight, viewportHeight],
  );
  const buildingSheetSnapPoints = useMemo(
    () => [
      buildSheetSnapPoint(viewportHeight, {
        preferredHeight: viewportHeight * 0.64,
        minHeight: isWide ? 440 : 360,
        maxHeight: isWide ? 760 : 620,
      }),
    ],
    [isWide, viewportHeight],
  );
  const eventSheetSnapPoints = useMemo(
    () => [
      buildSheetSnapPoint(viewportHeight, {
        preferredHeight: showEventDetails
          ? viewportHeight * (isWide ? 0.8 : 0.82)
          : viewportHeight * (isWide ? 0.58 : 0.56),
        minHeight: showEventDetails ? (isWide ? 620 : 520) : isWide ? 430 : 360,
        maxHeight: showEventDetails ? viewportHeight * 0.9 : isWide ? 620 : 540,
      }),
    ],
    [isWide, showEventDetails, viewportHeight],
  );
  const createSheetSnapPoints = useMemo(
    () => [
      buildSheetSnapPoint(viewportHeight, {
        preferredHeight: viewportHeight * 0.76,
        minHeight: isWide ? 560 : 460,
        maxHeight: viewportHeight * 0.9,
      }),
    ],
    [isWide, viewportHeight],
  );
  const sheetContentStyle = useMemo(
    () => [styles.sheetContent, isWide ? styles.sheetContentWide : null],
    [isWide],
  );

  const peekPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 20) {
          setIsPeekCollapsed(true);
        } else if (gestureState.dy < -20) {
          setIsPeekCollapsed(false);
        }
      },
    }),
  ).current;
  const floatingDockClearance = isNativeMobile ? 60 + Math.max(insets.bottom - 8, 12) + 12 : 0;
  const topOverlayPadding = isNativeMobile ? insets.top + spacing.sm : spacing.md;
  const liveCounterTop = isNativeMobile ? insets.top + 112 : spacing.md + 104;

  useEffect(() => {
    if (locationError) {
      Alert.alert('Location unavailable', locationError);
    }
  }, [locationError]);

  useEffect(() => {
    if (!pendingMapFocus) {
      return;
    }

    if (pendingMapFocus.type === 'event') {
      const event = eventsById.get(pendingMapFocus.eventId);
      if (event) {
        openEvent(event);
      } else {
        clearSelection();
        setSelectedEventId(pendingMapFocus.eventId);
        setFocusRequest(
          createFocusRequest(
            `pending-event-${pendingMapFocus.eventId}`,
            [pendingMapFocus.longitude, pendingMapFocus.latitude],
            16.5,
          ),
        );
      }
    } else {
      const building =
        buildings.find((item) => item.id === pendingMapFocus.locationId) ??
        buildings.find((item) => item.name === pendingMapFocus.label) ??
        null;
      if (building) {
        openBuilding(building);
      }
    }

    clearPendingMapFocus();
  }, [clearPendingMapFocus, eventsById, pendingMapFocus]);

  useEffect(() => {
    setShowEventDetails(false);
  }, [selectedEventId, selectedBuildingId, selectedGroupId]);

  function clearSelection() {
    setSelectedEventId(null);
    setSelectedGroupId(null);
    setSelectedBuildingId(null);
    setCreateCoordinate(null);
    setShowEventDetails(false);
  }

  function openEvent(event: Event) {
    const group = eventGroups.find((candidate) => candidate.events.some((item) => item.id === event.id));
    setSelectedBuildingId(null);
    setCreateCoordinate(null);
    setSelectedGroupId(group?.id ?? null);
    setSelectedEventId(event.id);
    setFocusRequest(
      createFocusRequest(
        `event-${event.id}`,
        group?.coordinate ?? [event.longitude ?? campusMapCenter[0], event.latitude ?? campusMapCenter[1]],
        16.55,
      ),
    );
  }

  function openGroup(group: EventLocationGroup) {
    if (group.events.length === 1) {
      const event = eventsById.get(group.events[0].id);
      if (event) {
        openEvent(event);
      }
      return;
    }

    setSelectedBuildingId(null);
    setCreateCoordinate(null);
    setSelectedEventId(null);
    setSelectedGroupId(group.id);
    setFocusRequest(createFocusRequest(`group-${group.id}`, group.coordinate, 16.25));
  }

  function openBuilding(building: Building) {
    setSelectedEventId(null);
    setSelectedGroupId(null);
    setCreateCoordinate(null);
    setSelectedBuildingId(building.id);
    setFocusRequest(createFocusRequest(`building-${building.id}`, [building.longitude, building.latitude], 16.35));
  }

  function openCreateEvent(coordinate: MapCoordinate) {
    setSelectedEventId(null);
    setSelectedGroupId(null);
    setSelectedBuildingId(null);
    setCreateCoordinate(coordinate);
    setDraftEvent(makeNextDraft());
    setFocusRequest(createFocusRequest('create-event', coordinate, 16.45));
  }

  async function openDirections(label: string, coordinate: MapCoordinate) {
    const url = buildDirectionsUrl(label, coordinate);
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert('Directions unavailable', 'No maps application was available for this action.');
      return;
    }

    await Linking.openURL(url);
  }

  function patchEventQueryCaches(eventId: string, previousStatus: RsvpStatus, nextStatus: RsvpStatus) {
    queryClient.setQueriesData({ queryKey: ['map-events'] }, (current: any) => {
      if (!current?.items) {
        return current;
      }

      return {
        ...current,
        items: current.items.map((event: Event) =>
          event.id === eventId ? patchEventRsvpCounts(event, previousStatus, nextStatus) : event,
        ),
      };
    });

    queryClient.setQueryData(['map-event-detail', eventId], (current: any) => {
      if (!current?.event) {
        return current;
      }

      return {
        ...current,
        event: patchEventRsvpCounts(current.event, previousStatus, nextStatus),
        current_user_rsvp: nextStatus,
        rsvp_stats: {
          going:
            Math.max(
              0,
              Number(current.rsvp_stats?.going ?? current.event.attendee_count ?? current.event.rsvp_count ?? 0) -
                (previousStatus === 'going' ? 1 : 0) +
                (nextStatus === 'going' ? 1 : 0),
            ),
          interested:
            Math.max(
              0,
              Number(current.rsvp_stats?.interested ?? current.event.interested_count ?? 0) -
                (previousStatus === 'interested' ? 1 : 0) +
                (nextStatus === 'interested' ? 1 : 0),
            ),
        },
      };
    });
  }

  async function handleRsvpChange(event: Event, nextStatus: RsvpStatus) {
    const previousStatus = getCurrentRsvpStatus(event.id, goingEventIds, savedEventIds);

    if (previousStatus === nextStatus) {
      return;
    }

    setEventRsvpStatus(event.id, nextStatus);
    patchEventQueryCaches(event.id, previousStatus, nextStatus);

    try {
      if (isSupabaseConfigured) {
        await submitEventRsvpRemote({
          eventId: event.id,
          status: nextStatus ?? undefined,
          action: nextStatus ? 'upsert' : 'remove',
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['map-events'] }),
        queryClient.invalidateQueries({ queryKey: ['map-event-detail', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-data'] }),
      ]);

      if (nextStatus === 'going') {
        Alert.alert(
          'Added to your schedule',
          'This event is now in your shared xUMD schedule. You can sync it to Apple Calendar or Google Calendar from the calendar tab.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Open My Schedule',
              onPress: () => {
                setPendingCalendarFocus({ date: event.starts_at, entryId: event.id });
                navigation.getParent()?.navigate('Calendar' as never);
              },
            },
          ],
        );
      }
    } catch (error) {
      setEventRsvpStatus(event.id, previousStatus);
      patchEventQueryCaches(event.id, nextStatus, previousStatus);
      Alert.alert(
        'RSVP unavailable',
        error instanceof Error ? error.message : 'Unable to update your RSVP right now.',
      );
    }
  }

  async function handleShareEvent(event: Event) {
    await Share.share({
      message: `${event.title}\n${getContextualTimeLabel(event)}\n${event.location_name}\n${createEventUrl(event.id)}`,
    });
  }

  async function handleReportEvent(eventId: string) {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Report queued',
        'The live moderation flow will work once Supabase is configured for this project.',
      );
      return;
    }

    try {
      await reportMapEventRemote({ eventId, reason: 'misleading' });
      await queryClient.invalidateQueries({ queryKey: ['map-event-detail', eventId] });
      Alert.alert('Report sent', 'Thanks. This event was sent to moderation review.');
    } catch (error) {
      Alert.alert(
        'Report unavailable',
        error instanceof Error ? error.message : 'Unable to send this report right now.',
      );
    }
  }

  async function handleLocateMe() {
    const location = userLocation ?? (await requestUserLocation());
    if (!location) {
      return;
    }

    setFocusRequest(createFocusRequest('me', [location.longitude, location.latitude], 16.2));
  }

  function resolveSearchBuilding(result: EventSearchResult) {
    const directId = result.id.replace('location-', '');
    return (
      buildings.find((building) => building.id === directId) ??
      buildings.find((building) => building.name.toLowerCase() === result.title.toLowerCase()) ??
      buildings.find((building) => building.code.toLowerCase() === result.title.toLowerCase())
    );
  }

  function handleSearchResultPress(result: EventSearchResult) {
    setSearchQuery('');

    if (result.type === 'location') {
      const building = resolveSearchBuilding(result);
      if (building) {
        openBuilding(building);
        return;
      }

      setFocusRequest(createFocusRequest(result.id, [result.longitude, result.latitude], 16.2));
      return;
    }

    const event = result.event_ids[0] ? eventsById.get(result.event_ids[0]) : null;
    if (event) {
      openEvent(event);
      return;
    }

    setSelectedBuildingId(null);
    setSelectedGroupId(null);
    setSelectedEventId(result.event_ids[0] ?? result.id.replace('event-', ''));
    setFocusRequest(createFocusRequest(result.id, [result.longitude, result.latitude], 16.45));
  }

  function handleSelectAllFilter() {
    if (selectedCategories.length > 0) {
      toggleCategory('all');
    }
    setTimeFilter('all');
  }

  function handleSelectLiveCounter() {
    const nearestLiveEvent = getNearestLiveEvent(filteredEvents, userLocation);
    if (!nearestLiveEvent) {
      return;
    }

    openEvent(nearestLiveEvent);
  }

  async function handleCreateEvent() {
    if (!createCoordinate) {
      return;
    }

    if (!draftEvent.title.trim() || !draftEvent.description.trim()) {
      Alert.alert('Missing details', 'Add a title and description before publishing your event.');
      return;
    }

    const startsAt = new Date(draftEvent.startsAt);
    const endsAt = new Date(draftEvent.endsAt);

    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
      Alert.alert('Invalid time', 'Choose a valid start and end time for this event.');
      return;
    }

    setIsCreatingEvent(true);

    const snappedLocation = nearestCreateBuilding?.building ?? null;
    const newEvent: Event = {
      id: `evt-local-${Date.now()}`,
      title: draftEvent.title.trim(),
      description: draftEvent.description.trim(),
      club_id: null,
      created_by: currentViewerId,
      organizer_name: currentViewerName,
      category: draftEvent.category,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: startsAt <= new Date() && endsAt > new Date() ? 'live' : 'upcoming',
      moderation_status: 'approved',
      location_name: snappedLocation?.name ?? 'Pinned campus location',
      location_id: null,
      latitude: createCoordinate[1],
      longitude: createCoordinate[0],
      image_url: null,
      rsvp_count: 0,
      attendee_count: 0,
      interested_count: 0,
      max_capacity: draftEvent.maxCapacity ? Number(draftEvent.maxCapacity) : null,
      is_featured: false,
      tags: [],
      location: snappedLocation?.name ?? 'Pinned campus location',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      let createdEvent = newEvent;

      if (isSupabaseConfigured) {
        const response = await createMapEventRemote({
          title: newEvent.title,
          description: newEvent.description,
          category: newEvent.category,
          locationName: newEvent.location_name,
          locationId: newEvent.location_id ?? null,
          latitude: newEvent.latitude ?? createCoordinate[1],
          longitude: newEvent.longitude ?? createCoordinate[0],
          startsAt: newEvent.starts_at,
          endsAt: newEvent.ends_at,
          maxCapacity: newEvent.max_capacity,
          tags: [],
          coverImage: null,
        });
        createdEvent = response.event;
      } else {
        queryClient.setQueriesData({ queryKey: ['map-events'] }, (current: any) => {
          if (!current?.items) {
            return current;
          }

          return {
            ...current,
            items: [createdEvent, ...current.items],
          };
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['map-events'] }),
        queryClient.invalidateQueries({ queryKey: ['map-search'] }),
      ]);

      setCreateCoordinate(null);
      setDraftEvent(makeNextDraft());
      openEvent(createdEvent);
    } catch (error) {
      Alert.alert(
        'Create event unavailable',
        error instanceof Error ? error.message : 'Unable to publish your event right now.',
      );
    } finally {
      setIsCreatingEvent(false);
    }
  }

  return (
    <ScreenLayout
      title="Campus Map"
      subtitle="Buildings, live events, and the pulse of campus in one shared view."
      scroll={false}
      headerTopContent={isNativeMobile ? undefined : <UMDBrandLockup />}
      contentContainerStyle={styles.layoutBody}
      showHeader={!isNativeMobile}
      safeAreaEdges={isNativeMobile ? ['left', 'right'] : ['top', 'left', 'right']}
      fullBleed={isNativeMobile}
    >
      <View style={styles.screen}>
        <View style={[styles.mapShell, isWide ? styles.mapShellWide : null, isNativeMobile ? styles.mapShellMobile : null]}>
          <CampusMap
            style={styles.map}
            events={filteredEvents}
            eventGroups={eventGroups}
            densityByEventId={activityWeights}
            buildings={buildings}
            showEvents
            showBuildings
            clusterEvents
            isHeatmapMode={false}
            showActivityHeatmap={showActivityLayer}
            activeBuildingId={selectedBuildingId}
            activeEventGroupId={selectedGroupId}
            userLocation={userLocation}
            focusRequest={focusRequest}
            onSelectEventGroup={openGroup}
            onSelectBuilding={openBuilding}
            onLongPressCoordinate={openCreateEvent}
          />

          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={[styles.topOverlay, { paddingTop: topOverlayPadding }]}>
              <View style={styles.searchRow}>
                <View style={styles.searchShell}>
                  <Ionicons name="search" size={18} color={colors.text.secondary} />
                  <TextInput
                    accessibilityLabel="Search buildings and events"
                    autoCorrect={false}
                    autoCapitalize="none"
                    placeholder="Search buildings, events..."
                    placeholderTextColor={colors.text.tertiary}
                    returnKeyType="search"
                    selectionColor={colors.primary.main}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                  />
                  {searchQuery.length > 0 ? (
                    <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                      <Ionicons name="close" size={16} color={colors.text.secondary} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {hasSearchQuery ? (
                <Card style={styles.searchResultsCard}>
                  {searchLoading ? <Text style={styles.searchFeedback}>Finding the best matches...</Text> : null}
                  {!searchLoading && searchResults.length === 0 ? (
                    <Text style={styles.searchFeedback}>No buildings or upcoming events matched that search.</Text>
                  ) : null}
                  {!searchLoading
                    ? searchResults.map((result) => (
                        <SearchResultRow
                          key={`${result.type}-${result.id}`}
                          result={result}
                          onPress={() => handleSearchResultPress(result)}
                        />
                      ))
                    : null}
                </Card>
              ) : null}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <FilterChip label="All" active={isAllChipActive} onPress={handleSelectAllFilter} accentColor={colors.primary.main} />
                <FilterChip
                  label="Activity"
                  active={showActivityLayer}
                  onPress={() => setShowActivityLayer(!showActivityLayer)}
                  accentColor="#FF8A00"
                />
                {TIME_CHIPS.map((chip) => (
                  <FilterChip
                    key={chip.value}
                    label={chip.label}
                    active={timeFilter === chip.value}
                    onPress={() => setTimeFilter(chip.value)}
                    pulse={chip.pulse}
                  />
                ))}
                {CATEGORY_CHIPS.map((chip) => (
                  <FilterChip
                    key={chip.value}
                    label={chip.label}
                    active={selectedCategories.includes(chip.value)}
                    onPress={() => toggleCategory(chip.value)}
                    accentColor={chip.color}
                  />
                ))}
              </ScrollView>
            </View>

            <Pressable
              accessibilityLabel="Jump to the nearest live event"
              onPress={handleSelectLiveCounter}
              style={({ pressed }) => [
                styles.liveCounterPill,
                { top: liveCounterTop },
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={styles.liveCounterDot} />
              <Text style={styles.liveCounterText}>
                {liveCounter.liveCount} live - {liveCounter.nextTwoHoursCount} in next 2 hrs
              </Text>
            </Pressable>
            <View
              style={[
                styles.sideActions,
                { bottom: isNativeMobile ? floatingDockClearance + 88 : 124 },
              ]}
            >
              <Pressable onPress={() => void handleLocateMe()} style={({ pressed }) => [styles.sideActionButton, pressed ? styles.pressed : null]}>
                <Ionicons name={isLocating ? 'compass' : 'locate'} size={18} color={colors.text.primary} />
              </Pressable>
              <Pressable onPress={() => void refetch()} style={({ pressed }) => [styles.sideActionButton, pressed ? styles.pressed : null]}>
                <Ionicons name="refresh" size={18} color={colors.text.primary} />
              </Pressable>
              <Pressable
                onPress={() => openCreateEvent(selectedBuilding ? [selectedBuilding.longitude, selectedBuilding.latitude] : campusMapCenter)}
                style={({ pressed }) => [styles.createActionButton, pressed ? styles.pressed : null]}
              >
                <Ionicons name="add" size={22} color={colors.brand.white} />
              </Pressable>
            </View>

            <View
              {...peekPanResponder.panHandlers}
              style={[
                styles.peekRail,
                { marginBottom: isNativeMobile ? floatingDockClearance : spacing.md },
                isPeekCollapsed ? styles.peekRailCollapsed : null,
              ]}
            >
              <Pressable
                accessibilityLabel={isPeekCollapsed ? 'Expand upcoming events' : 'Collapse upcoming events'}
                onPress={() => setIsPeekCollapsed((current) => !current)}
                style={styles.peekHandleRow}
              >
                <View style={styles.peekHandle} />
                <Text style={styles.peekRailTitle}>Next up on campus</Text>
                <Ionicons
                  name={isPeekCollapsed ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.text.secondary}
                />
              </Pressable>

              {!isPeekCollapsed ? (
                upcomingEvents.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.peekCardsRow}
                  >
                    {upcomingEvents.map((event) => (
                      <EventMiniCard
                        key={event.id}
                        event={event}
                        isGoing={goingEventIds.includes(event.id)}
                        onPress={() => openEvent(event)}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.peekEmptyText}>No upcoming events match your current filters.</Text>
                )
              ) : null}
            </View>

            {loading && rawEvents.length === 0 ? (
              <Card style={[styles.loadingCard, { bottom: isNativeMobile ? floatingDockClearance + 112 : 108 }]}>
                <Text style={styles.loadingTitle}>Loading campus activity</Text>
                <Text style={styles.loadingCopy}>Pulling buildings, events, and the latest campus pulse into the map.</Text>
              </Card>
            ) : null}
          </View>
        </View>
      </View>

      <BottomSheet
        visible={activeSheet === 'group'}
        onClose={clearSelection}
        snapPoints={groupSheetSnapPoints}
        minHeight={sharedSheetMinHeight}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sheetContentStyle}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetEyebrow}>Events at this spot</Text>
            <Text style={styles.sheetTitle}>{selectedGroup?.locationName ?? 'Campus location'}</Text>
            <Text style={styles.sheetSubtitle}>
              {selectedGroup?.events.length ?? 0} upcoming events grouped here right now.
            </Text>
          </View>

          {selectedGroup?.events.map((groupEvent) => {
            const event = eventsById.get(groupEvent.id);
            if (!event) {
              return null;
            }

            return (
              <Card key={event.id} style={styles.groupEventCard} onPress={() => openEvent(event)}>
                <View style={styles.groupEventHeader}>
                  <View style={[styles.groupEventIcon, { backgroundColor: `${colors.eventCategory[event.category]}22` }]}>
                    <MaterialCommunityIcons
                      name={getCategoryIconName(event.category)}
                      size={16}
                      color={colors.eventCategory[event.category]}
                    />
                  </View>
                  <View style={styles.groupEventCopy}>
                    <Text style={styles.groupEventTitle}>{event.title}</Text>
                    <Text style={styles.groupEventMeta}>{getContextualTimeLabel(event)}</Text>
                  </View>
                  {goingEventIds.includes(event.id) ? <Badge label="Going" color={colors.status.success} /> : null}
                </View>
                <Text style={styles.groupEventDescription} numberOfLines={2}>
                  {event.description}
                </Text>
              </Card>
            );
          })}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={activeSheet === 'building'}
        onClose={clearSelection}
        snapPoints={buildingSheetSnapPoints}
        minHeight={sharedSheetMinHeight}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sheetContentStyle}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetEyebrow}>Building profile</Text>
            <Text style={styles.sheetTitle}>{selectedBuilding?.name ?? 'Campus building'}</Text>
            <Text style={styles.sheetSubtitle}>{selectedBuilding ? `${selectedBuilding.code} · ${selectedBuilding.building_type}` : ''}</Text>
          </View>

          {selectedBuilding ? (
            <>
              <Card style={styles.infoPanel}>
                <Text style={styles.infoPanelTitle}>Departments and programs</Text>
                {(selectedBuildingProfile?.departments ?? ['Campus information']).map((department) => (
                  <View key={department} style={styles.infoRow}>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary.main} />
                    <Text style={styles.infoText}>{department}</Text>
                  </View>
                ))}
              </Card>

              <View style={styles.buildingInfoGrid}>
                <Card style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Hours</Text>
                  <Text style={styles.metricValue}>{selectedBuildingProfile?.hoursLabel ?? 'Hours vary by semester'}</Text>
                </Card>
                <Card style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Accessibility</Text>
                  <View style={styles.accessibilityRow}>
                    <View style={styles.accessibilityBadge}>
                      <MaterialCommunityIcons name="wheelchair-accessibility" size={15} color={colors.status.info} />
                    </View>
                    <View style={styles.accessibilityBadge}>
                      <MaterialCommunityIcons name="elevator-passenger" size={15} color={colors.status.success} />
                    </View>
                    {selectedBuildingProfile?.accessibility.automaticDoors ? (
                      <View style={styles.accessibilityBadge}>
                        <MaterialCommunityIcons name="door-sliding" size={15} color={colors.primary.main} />
                      </View>
                    ) : null}
                  </View>
                </Card>
              </View>

              <Card style={styles.infoPanel}>
                <Text style={styles.infoPanelTitle}>Address</Text>
                <Text style={styles.infoText}>{selectedBuildingProfile?.address ?? 'University of Maryland, College Park'}</Text>
                <Button
                  title="Get Directions"
                  onPress={() => void openDirections(selectedBuilding.name, [selectedBuilding.longitude, selectedBuilding.latitude])}
                  fullWidth
                  style={styles.infoPanelButton}
                />
              </Card>

              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Events here</Text>
                {buildingEvents.length > 0 ? (
                  buildingEvents.map((event) => (
                    <Card key={event.id} style={styles.groupEventCard} onPress={() => openEvent(event)}>
                      <View style={styles.groupEventHeader}>
                        <View style={[styles.groupEventIcon, { backgroundColor: `${colors.eventCategory[event.category]}22` }]}>
                          <MaterialCommunityIcons
                            name={getCategoryIconName(event.category)}
                            size={16}
                            color={colors.eventCategory[event.category]}
                          />
                        </View>
                        <View style={styles.groupEventCopy}>
                          <Text style={styles.groupEventTitle}>{event.title}</Text>
                          <Text style={styles.groupEventMeta}>{getContextualTimeLabel(event)}</Text>
                        </View>
                      </View>
                    </Card>
                  ))
                ) : (
                  <Card style={styles.infoPanel}>
                    <Text style={styles.infoText}>No active or upcoming events are pinned to this building right now.</Text>
                  </Card>
                )}
              </View>
            </>
          ) : null}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={activeSheet === 'event'}
        onClose={clearSelection}
        snapPoints={eventSheetSnapPoints}
        minHeight={showEventDetails ? (isWide ? 620 : 520) : isWide ? 430 : 360}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sheetContentStyle}>
          {selectedEvent ? (
            <>
              <Card style={styles.eventSummaryCard}>
                {selectedEvent.image_url ? (
                  <Image
                    source={{ uri: selectedEvent.image_url }}
                    style={[styles.eventHeroImage, isWide ? styles.eventHeroImageWide : null]}
                  />
                ) : (
                  <View style={styles.eventHeroFallback}>
                    <MaterialCommunityIcons
                      name={getCategoryIconName(selectedEvent.category)}
                      size={32}
                      color={colors.eventCategory[selectedEvent.category]}
                    />
                  </View>
                )}

                <View style={styles.eventSummaryBody}>
                  <View style={styles.eventSummaryBadgeRow}>
                    <Badge
                      label={selectedEvent.category}
                      color={
                        colors.eventCategory[
                          selectedEvent.category as keyof typeof colors.eventCategory
                        ] ?? colors.primary.main
                      }
                    />
                    {isEventLive(selectedEvent) ? <Badge label="Live now" color={colors.status.error} /> : null}
                  </View>

                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetEyebrow}>Event preview</Text>
                    <Text style={styles.sheetTitle}>{selectedEvent.title}</Text>
                    <Text style={styles.sheetSubtitle}>
                      {selectedEvent.location_name} - {selectedEvent.organizer_name ?? 'xUMD'}
                    </Text>
                  </View>

                  {eventHostClub ? (
                    <Pressable
                      onPress={() => navigation.navigate('ClubDetail', { clubId: eventHostClub.id })}
                      style={({ pressed }) => [styles.hostClubRow, pressed ? styles.pressed : null]}
                    >
                      <Avatar uri={eventHostClub.logo_url} name={eventHostClub.name} size="md" />
                      <View style={styles.hostClubCopy}>
                        <Text style={styles.hostClubLabel}>Hosted by</Text>
                        <Text style={styles.hostClubName}>{eventHostClub.name}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={colors.text.tertiary} />
                    </Pressable>
                  ) : null}
                </View>
              </Card>

              <View style={styles.infoTiles}>
                <Card style={styles.infoTile}>
                  <View style={styles.infoTileHeader}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary.main} />
                    <Text style={styles.infoTileLabel}>Date and time</Text>
                  </View>
                  <Text style={styles.infoTileValue}>{getContextualTimeLabel(selectedEvent)}</Text>
                </Card>
                <Card style={styles.infoTile}>
                  <View style={styles.infoTileHeader}>
                    <Ionicons name="location-outline" size={16} color={colors.primary.main} />
                    <Text style={styles.infoTileLabel}>Location</Text>
                  </View>
                  <Text style={styles.infoTileValue}>{selectedEvent.location_name}</Text>
                </Card>
              </View>

              <Card style={styles.rsvpSummaryCard}>
                <View style={styles.rsvpSummaryRow}>
                  <View style={styles.rsvpSummaryIcon}>
                    <Ionicons name="people-outline" size={16} color={colors.primary.main} />
                  </View>
                  <View style={styles.rsvpSummaryCopy}>
                    <Text style={styles.rsvpSummaryTitle}>{selectedEventStats.going} going</Text>
                    <Text style={styles.rsvpSummarySubtitle}>{selectedEventStats.interested} interested</Text>
                  </View>
                  {isEventLive(selectedEvent) ? <Badge label="Live now" color={colors.status.error} /> : null}
                </View>
                <View style={styles.rsvpButtonRow}>
                  <Button
                    title={selectedEventRsvp === 'going' ? 'Going' : 'RSVP'}
                    onPress={() => void handleRsvpChange(selectedEvent, selectedEventRsvp === 'going' ? null : 'going')}
                    fullWidth
                    style={selectedEventRsvp === 'going' ? StyleSheet.flatten([styles.flexButton, styles.goingButton]) : styles.flexButton}
                  />
                  <Button
                    title={selectedEventRsvp === 'interested' ? 'Saved' : 'Save'}
                    onPress={() => void handleRsvpChange(selectedEvent, selectedEventRsvp === 'interested' ? null : 'interested')}
                    variant="secondary"
                    fullWidth
                    style={styles.flexButton}
                  />
                </View>
              </Card>

              <Card style={styles.infoPanel}>
                <Text style={styles.infoPanelTitle}>About this event</Text>
                <Text style={styles.infoText} numberOfLines={showEventDetails ? undefined : 3}>
                  {selectedEvent.description}
                </Text>
                {!showEventDetails ? (
                  <Pressable onPress={() => setShowEventDetails(true)} style={({ pressed }) => [styles.viewDetailsRow, pressed ? styles.pressed : null]}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="arrow-up" size={14} color={colors.primary.main} />
                  </Pressable>
                ) : null}
              </Card>

              {showEventDetails ? (
                <>
                  <Card style={styles.infoPanel}>
                    <Text style={styles.infoPanelTitle}>Location preview</Text>
                    <Text style={styles.infoText}>{selectedEvent.location_name}</Text>
                    {selectedEvent.latitude !== null && selectedEvent.longitude !== null ? (
                      <View style={styles.locationPreviewCard}>
                        <View style={styles.locationPreviewPin}>
                          <Ionicons name="location" size={16} color={colors.brand.white} />
                        </View>
                        <View style={styles.locationPreviewCopy}>
                          <Text style={styles.locationPreviewTitle}>Centered on the map</Text>
                          <Text style={styles.locationPreviewSubtitle}>
                            Tap below to jump back to this pin and open native directions.
                          </Text>
                        </View>
                      </View>
                    ) : null}
                    {selectedEvent.latitude !== null && selectedEvent.longitude !== null ? (
                      <View style={styles.inlineButtonRow}>
                        <Button
                          title="Center on Map"
                          onPress={() =>
                            setFocusRequest(
                              createFocusRequest(
                                `event-detail-${selectedEvent.id}`,
                                [selectedEvent.longitude as number, selectedEvent.latitude as number],
                                16.55,
                              ),
                            )
                          }
                          variant="secondary"
                          style={styles.flexButton}
                        />
                        <Button
                          title="Get Directions"
                          onPress={() =>
                            void openDirections(
                              selectedEvent.location_name,
                              [selectedEvent.longitude as number, selectedEvent.latitude as number],
                            )
                          }
                          style={styles.flexButton}
                        />
                      </View>
                    ) : null}
                  </Card>

                  {detailQuery.data?.friends_attending && detailQuery.data.friends_attending.length > 0 ? (
                    <Card style={styles.infoPanel}>
                      <Text style={styles.infoPanelTitle}>Friends attending</Text>
                      <View style={styles.friendRow}>
                        {detailQuery.data.friends_attending.slice(0, 5).map((friend) => (
                          <Avatar
                            key={friend.id}
                            uri={friend.avatar_url}
                            name={friend.display_name}
                            size="sm"
                          />
                        ))}
                      </View>
                    </Card>
                  ) : null}

                  {eventHostClub && relatedClubEvents.length > 0 ? (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionHeading}>More from {eventHostClub.name}</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.relatedEventsRow}
                      >
                        {relatedClubEvents.map((event) => (
                          <Card key={event.id} style={styles.relatedEventCard} onPress={() => openEvent(event)}>
                            {event.image_url ? <Image source={{ uri: event.image_url }} style={styles.relatedEventImage} /> : null}
                            <Text style={styles.relatedEventTitle} numberOfLines={2}>
                              {event.title}
                            </Text>
                            <Text style={styles.relatedEventMeta}>{getUpcomingTimeLabel(event)}</Text>
                          </Card>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}

                  <View style={styles.inlineButtonRow}>
                    <Button title="Share" onPress={() => void handleShareEvent(selectedEvent)} variant="ghost" style={styles.flexButton} />
                    <Button title="Report" onPress={() => void handleReportEvent(selectedEvent.id)} variant="danger" style={styles.flexButton} />
                  </View>
                </>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={activeSheet === 'create'}
        onClose={clearSelection}
        snapPoints={createSheetSnapPoints}
        minHeight={isWide ? 560 : 460}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sheetContentStyle}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetEyebrow}>Create Event Here</Text>
            <Text style={styles.sheetTitle}>Drop a new campus event pin</Text>
            <Text style={styles.sheetSubtitle}>
              {nearestCreateBuilding?.building.name ?? 'Pinned campus location'}
              {nearestCreateBuilding ? ` · ${Math.round(nearestCreateBuilding.distanceMeters)}m away` : ''}
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              value={draftEvent.title}
              onChangeText={(value) => setDraftEvent((current) => ({ ...current, title: value }))}
              placeholder="Friday social on McKeldin Mall"
              placeholderTextColor={colors.text.tertiary}
              style={styles.formInput}
            />

            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              value={draftEvent.description}
              onChangeText={(value) => setDraftEvent((current) => ({ ...current, description: value }))}
              placeholder="Tell Terps what is happening here."
              placeholderTextColor={colors.text.tertiary}
              multiline
              style={[styles.formInput, styles.formTextArea]}
            />

            <Text style={styles.formLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formChipRow}>
              {Object.values(EventCategory).map((category) => (
                <FilterChip
                  key={category}
                  label={category}
                  active={draftEvent.category === category}
                  onPress={() => setDraftEvent((current) => ({ ...current, category }))}
                  accentColor={colors.eventCategory[category]}
                />
              ))}
            </ScrollView>

            <View style={styles.formGrid}>
              <View style={styles.formGridColumn}>
                <Text style={styles.formLabel}>Starts</Text>
                <TextInput
                  value={draftEvent.startsAt}
                  onChangeText={(value) => setDraftEvent((current) => ({ ...current, startsAt: value }))}
                  placeholder="2026-04-10T18:00"
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.formInput}
                />
              </View>
              <View style={styles.formGridColumn}>
                <Text style={styles.formLabel}>Ends</Text>
                <TextInput
                  value={draftEvent.endsAt}
                  onChangeText={(value) => setDraftEvent((current) => ({ ...current, endsAt: value }))}
                  placeholder="2026-04-10T19:30"
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.formInput}
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Capacity</Text>
            <TextInput
              keyboardType="number-pad"
              value={draftEvent.maxCapacity}
              onChangeText={(value) => setDraftEvent((current) => ({ ...current, maxCapacity: value.replace(/[^0-9]/g, '') }))}
              placeholder="Optional"
              placeholderTextColor={colors.text.tertiary}
              style={styles.formInput}
            />

            <View style={styles.inlineButtonRow}>
              <Button
                title={isCreatingEvent ? 'Publishing...' : 'Publish Event'}
                onPress={() => void handleCreateEvent()}
                loading={isCreatingEvent}
                fullWidth
                style={styles.flexButton}
              />
              <Button title="Cancel" onPress={clearSelection} variant="secondary" fullWidth style={styles.flexButton} />
            </View>
          </Card>
        </ScrollView>
      </BottomSheet>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  layoutBody: {
    flex: 1,
    paddingBottom: 0,
  },
  screen: {
    flex: 1,
  },
  mapShell: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
    ...shadows.lg,
  },
  mapShellMobile: {
    borderRadius: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  mapShellWide: {
    minHeight: 720,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topOverlay: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    ...shadows.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearSearchButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  searchResultsCard: {
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.96)',
    gap: spacing.xs,
  },
  searchFeedback: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchResultIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultCopy: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  searchResultSubtitle: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 38,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipDot: {
    width: 7,
    height: 7,
    borderRadius: borderRadius.full,
  },
  filterChipPulse: {
    width: 7,
    height: 7,
    borderRadius: borderRadius.full,
    backgroundColor: '#FF3B30',
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  filterChipTextActive: {
    color: colors.brand.white,
  },
  liveCounterPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.md,
  },
  liveCounterDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: '#EF4444',
  },
  liveCounterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.brand.white,
  },
  sideActions: {
    position: 'absolute',
    right: spacing.md,
    bottom: 124,
    gap: spacing.sm,
    zIndex: 8,
    elevation: 8,
  },
  sideActionButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  createActionButton: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  peekRail: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.lg,
  },
  peekRailCollapsed: {
    paddingBottom: spacing.sm,
  },
  peekHandleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  peekHandle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border.default,
  },
  peekRailTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  peekCardsRow: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  peekEmptyText: {
    paddingTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  miniEventCard: {
    width: 230,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  miniEventImage: {
    width: '100%',
    height: 90,
  },
  miniEventBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  miniEventHeader: {
    gap: spacing.xs,
  },
  miniEventTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  miniEventMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  loadingCard: {
    position: 'absolute',
    left: spacing.md,
    bottom: 108,
    width: 240,
  },
  loadingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  loadingCopy: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  sheetContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  sheetContentWide: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  sheetHeader: {
    gap: spacing.xs,
  },
  sheetEyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.primary.main,
  },
  sheetTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sheetSubtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  groupEventCard: {
    gap: spacing.sm,
  },
  groupEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupEventIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEventCopy: {
    flex: 1,
  },
  groupEventTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  groupEventMeta: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  groupEventDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  infoPanel: {
    gap: spacing.sm,
  },
  infoPanelTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  infoPanelButton: {
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  buildingInfoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    gap: spacing.sm,
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  accessibilityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  accessibilityBadge: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  eventSummaryCard: {
    padding: 0,
    overflow: 'hidden',
  },
  eventSummaryBody: {
    gap: spacing.md,
    padding: spacing.md,
  },
  eventSummaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  eventHeroImage: {
    width: '100%',
    height: 216,
  },
  eventHeroImageWide: {
    height: 240,
  },
  eventHeroFallback: {
    height: 156,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostClubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.primary.lightest,
  },
  hostClubCopy: {
    flex: 1,
  },
  hostClubLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  hostClubName: {
    marginTop: 2,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  infoTiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoTile: {
    flex: 1,
    gap: spacing.sm,
  },
  infoTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoTileLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  infoTileValue: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  rsvpSummaryCard: {
    gap: spacing.md,
  },
  rsvpSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rsvpSummaryIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpSummaryCopy: {
    flex: 1,
  },
  rsvpSummaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  rsvpSummarySubtitle: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  rsvpButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  goingButton: {
    backgroundColor: '#2E7D32',
  },
  viewDetailsRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewDetailsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  locationPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
  },
  locationPreviewPin: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPreviewCopy: {
    flex: 1,
  },
  locationPreviewTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  locationPreviewSubtitle: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  friendRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  relatedEventsRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  relatedEventCard: {
    width: 190,
    gap: spacing.sm,
  },
  relatedEventImage: {
    width: '100%',
    height: 96,
    borderRadius: borderRadius.md,
  },
  relatedEventTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  relatedEventMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  inlineButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formCard: {
    gap: spacing.sm,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  formInput: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  formTextArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  formChipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  formGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formGridColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.84,
  },
});
