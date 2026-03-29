import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import CampusMap from '../../map/components/CampusMap';
import EventBottomSheet from '../../map/components/EventBottomSheet';
import BottomSheet from '../../../shared/components/BottomSheet';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { buildings, type Building, type BuildingType } from '../../../assets/data/buildings';
import { mockCampusEvents } from '../../../assets/data/mockEvents';
import {
  campusRoutes,
  diningZones,
  type CampusRoute,
  type DiningZone,
} from '../../map/data/campusOverlays';
import { useMapData, type TimeFilter } from '../../map/hooks/useMapData';
import { useUserLocation } from '../../map/hooks/useUserLocation';
import {
  getBuildingNowStatus,
  getBuildingQuickFacts,
  getCurrentEventsForBuilding,
  getNearbyBuildings,
  getNearbyEvents,
  getUpcomingEventsForBuilding,
  isBuildingOpenNow,
  isTonightEvent,
} from '../../map/utils/buildingExperience';
import {
  buildFocusRequestForCoordinate,
  buildFocusRequestFromCoordinates,
  buildWayfindingJourney,
  defaultJourneyOrigin,
  formatDistanceMiles,
  toMapCoordinate,
} from '../../map/utils/wayfinding';
import type { MapFocusRequest, WayfindingJourney } from '../../map/types';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { EventCategory, type Event } from '../../../shared/types';
import type { MapStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MapStackParamList, 'MapHome'>;

type OverlayBounds = {
  minLongitude: number;
  maxLongitude: number;
  minLatitude: number;
  maxLatitude: number;
};

type QuickChip = 'all' | 'open-now' | 'food' | 'study' | 'tonight';

const quickChips: Array<{
  value: QuickChip;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'all', label: 'Everything', icon: 'layers-outline' },
  { value: 'open-now', label: 'Open now', icon: 'time-outline' },
  { value: 'food', label: 'Food', icon: 'restaurant-outline' },
  { value: 'study', label: 'Study', icon: 'book-outline' },
  { value: 'tonight', label: 'Tonight', icon: 'moon-outline' },
];

function getOverlayBounds(coordinates: [number, number][]): OverlayBounds {
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);

  return {
    minLongitude: Math.min(...longitudes),
    maxLongitude: Math.max(...longitudes),
    minLatitude: Math.min(...latitudes),
    maxLatitude: Math.max(...latitudes),
  };
}

function isPointInBounds(latitude: number, longitude: number, bounds: OverlayBounds) {
  return (
    longitude >= bounds.minLongitude &&
    longitude <= bounds.maxLongitude &&
    latitude >= bounds.minLatitude &&
    latitude <= bounds.maxLatitude
  );
}

function countEventsInZone(zone: DiningZone, events: Event[]) {
  const bounds = getOverlayBounds(zone.coordinates);

  return events.filter(
    (event) =>
      event.latitude !== null &&
      event.longitude !== null &&
      isPointInBounds(event.latitude, event.longitude, bounds),
  ).length;
}

function countBuildingsInZone(zone: DiningZone, campusBuildings: Building[]) {
  const bounds = getOverlayBounds(zone.coordinates);

  return campusBuildings.filter((building) =>
    isPointInBounds(building.latitude, building.longitude, bounds),
  ).length;
}

function countBuildingsNearRoute(route: CampusRoute, campusBuildings: Building[]) {
  return campusBuildings.filter((building) =>
    route.coordinates.some(
      ([longitude, latitude]) =>
        Math.abs(building.longitude - longitude) <= 0.0019 &&
        Math.abs(building.latitude - latitude) <= 0.0019,
    ),
  ).length;
}

function matchesFoodEvent(event: Event) {
  const haystack = `${event.title} ${event.location_name} ${event.description}`.toLowerCase();
  return haystack.includes('food') || haystack.includes('dining') || haystack.includes('stamp');
}

function matchesStudyEvent(event: Event) {
  return event.category === EventCategory.Academic || event.category === EventCategory.Workshop;
}

export default function MapHomeScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [activeQuickChip, setActiveQuickChip] = useState<QuickChip>('all');
  const [showEvents, setShowEvents] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showWalkingRoutes, setShowWalkingRoutes] = useState(false);
  const [showDiningZones, setShowDiningZones] = useState(false);
  const [clusterEvents, setClusterEvents] = useState(true);
  const [buildingTypeFilters, setBuildingTypeFilters] = useState<BuildingType[]>([]);
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [nearMeMode, setNearMeMode] = useState(false);
  const [isLayersSheetOpen, setIsLayersSheetOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);
  const [activeRoute, setActiveRoute] = useState<CampusRoute | null>(null);
  const [activeDiningZone, setActiveDiningZone] = useState<DiningZone | null>(null);
  const [activeJourney, setActiveJourney] = useState<WayfindingJourney | null>(null);

  const { isWide } = useResponsive();
  const { userLocation, isLocating, locationError, requestUserLocation } = useUserLocation();
  const { events, loading } = useMapData({
    timeFilter,
    searchQuery,
  });
  const { savedEventIds, toggleSavedEvent } = useDemoAppStore();

  const filteredBuildings = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    let filtered = buildings.filter((building) => {
      const matchesSearch =
        needle.length === 0 ||
        building.name.toLowerCase().includes(needle) ||
        building.code.toLowerCase().includes(needle) ||
        building.description.toLowerCase().includes(needle);
      const matchesType =
        buildingTypeFilters.length === 0 || buildingTypeFilters.includes(building.building_type);

      return matchesSearch && matchesType;
    });

    if (activeQuickChip === 'food') {
      filtered = filtered.filter((building) =>
        ['dining', 'student_center'].includes(building.building_type),
      );
    }

    if (activeQuickChip === 'study') {
      filtered = filtered.filter((building) =>
        ['library', 'academic', 'engineering'].includes(building.building_type),
      );
    }

    if (onlyOpenNow) {
      filtered = filtered.filter((building) => isBuildingOpenNow(building));
    }

    if (nearMeMode && userLocation) {
      filtered = getNearbyBuildings(userLocation, filtered, 550).map((item) => item.building);
    }

    return filtered;
  }, [
    activeQuickChip,
    buildingTypeFilters,
    nearMeMode,
    onlyOpenNow,
    searchQuery,
    userLocation,
  ]);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (activeQuickChip === 'food') {
      filtered = filtered.filter(matchesFoodEvent);
    }

    if (activeQuickChip === 'study') {
      filtered = filtered.filter(matchesStudyEvent);
    }

    if (activeQuickChip === 'tonight') {
      filtered = filtered.filter((event) => isTonightEvent(event));
    }

    if (nearMeMode && userLocation) {
      filtered = getNearbyEvents(userLocation, filtered, 550).map((item) => item.event);
    }

    return filtered;
  }, [activeQuickChip, events, nearMeMode, userLocation]);

  const featuredEvents = useMemo(() => {
    const source =
      filteredEvents.length > 0
        ? filteredEvents
        : searchQuery.trim().length === 0
          ? mockCampusEvents
          : [];
    return source.slice(0, isWide ? 3 : 2);
  }, [filteredEvents, isWide, searchQuery]);

  const nearbyBuildings = useMemo(
    () =>
      userLocation ? getNearbyBuildings(userLocation, buildings, 450).slice(0, isWide ? 4 : 3) : [],
    [isWide, userLocation],
  );

  const nearbyEvents = useMemo(
    () =>
      userLocation
        ? getNearbyEvents(userLocation, mockCampusEvents, 450).slice(0, isWide ? 4 : 3)
        : [],
    [isWide, userLocation],
  );

  const activeRouteStats = useMemo(() => {
    if (!activeRoute) {
      return null;
    }

    return {
      checkpoints: activeRoute.coordinates.length,
      nearbyBuildings: countBuildingsNearRoute(activeRoute, buildings),
    };
  }, [activeRoute]);

  const activeDiningZoneStats = useMemo(() => {
    if (!activeDiningZone) {
      return null;
    }

    return {
      nearbyBuildings: countBuildingsInZone(activeDiningZone, buildings),
      nearbyEvents: countEventsInZone(activeDiningZone, filteredEvents),
    };
  }, [activeDiningZone, filteredEvents]);

  const activeBuildingStatus = useMemo(
    () => (activeBuilding ? getBuildingNowStatus(activeBuilding) : null),
    [activeBuilding],
  );

  const activeBuildingCurrentEvents = useMemo(
    () => (activeBuilding ? getCurrentEventsForBuilding(activeBuilding, mockCampusEvents) : []),
    [activeBuilding],
  );

  const activeBuildingUpcomingEvents = useMemo(
    () => (activeBuilding ? getUpcomingEventsForBuilding(activeBuilding, mockCampusEvents) : []),
    [activeBuilding],
  );

  const activeBuildingFacts = useMemo(
    () => (activeBuilding ? getBuildingQuickFacts(activeBuilding) : []),
    [activeBuilding],
  );

  const activeMapBuildingId =
    activeBuilding?.id ??
    (activeJourney?.destinationType === 'building' ? activeJourney.destinationId : null);
  const activeMapEventId =
    activeEvent?.id ?? (activeJourney?.destinationType === 'event' ? activeJourney.destinationId : null);

  const clearDetailSelections = () => {
    setActiveEvent(null);
    setActiveBuilding(null);
    setActiveRoute(null);
    setActiveDiningZone(null);
  };

  const handleSelectEvent = (event: Event) => {
    setActiveBuilding(null);
    setActiveRoute(null);
    setActiveDiningZone(null);
    setActiveJourney(null);
    setActiveEvent(event);
  };

  const handleSelectBuilding = (building: Building) => {
    setActiveEvent(null);
    setActiveRoute(null);
    setActiveDiningZone(null);
    setActiveJourney(null);
    setActiveBuilding(building);
  };

  const handleSelectRoute = (route: CampusRoute) => {
    setShowWalkingRoutes(true);
    setActiveEvent(null);
    setActiveBuilding(null);
    setActiveDiningZone(null);
    setActiveJourney(null);
    setActiveRoute(route);
    setFocusRequest(
      buildFocusRequestFromCoordinates(`route-${route.id}-${Date.now()}`, route.coordinates, {
        padding: 72,
      }),
    );
  };

  const handleSelectDiningZone = (zone: DiningZone) => {
    setShowDiningZones(true);
    setActiveEvent(null);
    setActiveBuilding(null);
    setActiveRoute(null);
    setActiveJourney(null);
    setActiveDiningZone(zone);
    setFocusRequest(
      buildFocusRequestFromCoordinates(`zone-${zone.id}-${Date.now()}`, zone.coordinates, {
        padding: 68,
      }),
    );
  };

  const toggleBuildingTypeFilter = (type: BuildingType) => {
    setBuildingTypeFilters((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };

  const resetLens = () => {
    setSearchQuery('');
    setTimeFilter('today');
    setActiveQuickChip('all');
    setOnlyOpenNow(false);
    setNearMeMode(false);
    setBuildingTypeFilters([]);
    setShowEvents(true);
    setShowBuildings(true);
    setShowWalkingRoutes(false);
    setShowDiningZones(false);
    setClusterEvents(true);
    setFocusRequest(null);
    setActiveJourney(null);
    clearDetailSelections();
  };

  const handleQuickChipPress = (chip: QuickChip) => {
    setActiveQuickChip(chip);
    setOnlyOpenNow(false);
    setNearMeMode(false);
    setBuildingTypeFilters([]);
    setShowEvents(true);
    setShowBuildings(true);
    setShowWalkingRoutes(false);
    setShowDiningZones(false);
    setClusterEvents(true);
    setFocusRequest(null);
    setActiveJourney(null);
    clearDetailSelections();

    if (chip === 'all') {
      setTimeFilter('today');
      return;
    }

    if (chip === 'open-now') {
      setOnlyOpenNow(true);
      setTimeFilter('happening_now');
      return;
    }

    if (chip === 'food') {
      setTimeFilter('today');
      setBuildingTypeFilters(['dining', 'student_center']);
      setShowDiningZones(true);
      return;
    }

    if (chip === 'study') {
      setTimeFilter('today');
      setBuildingTypeFilters(['library', 'academic', 'engineering']);
      return;
    }

    if (chip === 'tonight') {
      setTimeFilter('today');
    }
  };

  const handleLocateMePress = async () => {
    const location = await requestUserLocation();

    if (!location) {
      return;
    }

    setNearMeMode(true);
    setActiveJourney(null);
    clearDetailSelections();
    setFocusRequest(
      buildFocusRequestForCoordinate(
        'near-me-' + Date.now(),
        toMapCoordinate(location),
        17.1,
      ),
    );
  };

  const handleRouteToEvent = (event: Event) => {
    if (event.latitude === null || event.longitude === null) {
      return;
    }

    const journey = buildWayfindingJourney({
      destinationId: event.id,
      destinationType: 'event',
      destinationLabel: event.title,
      destinationCoordinate: [event.longitude, event.latitude],
      subtitle: event.location_name,
      originCoordinate: userLocation ? toMapCoordinate(userLocation) : undefined,
      startLabel: userLocation ? 'Your location' : defaultJourneyOrigin.label,
    });

    setActiveEvent(null);
    setActiveBuilding(null);
    setActiveRoute(null);
    setActiveDiningZone(null);
    setActiveJourney(journey);
    setFocusRequest(
      buildFocusRequestFromCoordinates(`journey-${journey.id}-${Date.now()}`, journey.coordinates, {
        padding: 88,
      }),
    );
  };

  const handleRouteToBuilding = (building: Building) => {
    const journey = buildWayfindingJourney({
      destinationId: building.id,
      destinationType: 'building',
      destinationLabel: building.name,
      destinationCoordinate: [building.longitude, building.latitude],
      subtitle: building.code,
      originCoordinate: userLocation ? toMapCoordinate(userLocation) : undefined,
      startLabel: userLocation ? 'Your location' : defaultJourneyOrigin.label,
    });

    setActiveEvent(null);
    setActiveBuilding(null);
    setActiveRoute(null);
    setActiveDiningZone(null);
    setActiveJourney(journey);
    setFocusRequest(
      buildFocusRequestFromCoordinates(`journey-${journey.id}-${Date.now()}`, journey.coordinates, {
        padding: 88,
      }),
    );
  };

  const mapHintText = activeJourney
    ? 'Walking route ready from ' + activeJourney.startLabel
    : activeRoute
      ? activeRoute.name + ' is highlighted on the map'
      : activeDiningZone
        ? activeDiningZone.name + ' is active on the map'
        : nearMeMode
          ? 'Centered on your current area'
          : 'Tap a building, event pin, or walk card to explore campus.';

  return (
    <ScreenLayout
      title="Map"
      subtitle="Full campus intelligence with buildings, routes, dining zones, and what is happening right now."
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="map-outline"
          label="Main Campus Map"
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
            placeholder="Search buildings, routes, events, or landmarks..."
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
          contentContainerStyle={styles.quickChipRow}
        >
          {quickChips.map((chip) => {
            const selected = chip.value === activeQuickChip;

            return (
              <Pressable
                key={chip.value}
                onPress={() => handleQuickChipPress(chip.value)}
                style={[styles.quickChip, selected && styles.quickChipActive]}
              >
                <Ionicons
                  name={chip.icon}
                  size={16}
                  color={selected ? colors.brand.white : colors.text.secondary}
                />
                <Text style={[styles.quickChipText, selected && styles.quickChipTextActive]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.actionRow}>
          <Pressable onPress={() => setIsLayersSheetOpen(true)} style={styles.actionButton}>
            <Ionicons name="layers-outline" size={18} color={colors.text.primary} />
            <Text style={styles.actionButtonText}>Layers</Text>
          </Pressable>
          <Pressable onPress={() => { void handleLocateMePress(); }} style={styles.actionButton}>
            <Ionicons name="locate-outline" size={18} color={colors.text.primary} />
            <Text style={styles.actionButtonText}>Locate Me</Text>
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.primary.main} />
            ) : null}
          </Pressable>
          <Pressable onPress={resetLens} style={styles.actionButton}>
            <Ionicons name="refresh-outline" size={18} color={colors.text.primary} />
            <Text style={styles.actionButtonText}>Reset</Text>
          </Pressable>
        </View>

        <Text style={styles.helperText}>
          Tap a building, event pin, or preset walk to focus it on the map.
        </Text>

        {locationError ? (
          <Card style={styles.locationNoticeCard}>
            <View style={styles.locationNoticeHeader}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.primary.main}
              />
              <Text style={styles.locationNoticeTitle}>
                Near-me mode needs location access
              </Text>
            </View>
            <Text style={styles.locationNoticeBody}>{locationError}</Text>
          </Card>
        ) : null}

        <View style={[styles.mapCard, isWide && styles.mapCardWide]}>
          <CampusMap
            style={styles.map}
            events={filteredEvents}
            buildings={filteredBuildings}
            showEvents={showEvents}
            showBuildings={showBuildings}
            showWalkingRoutes={showWalkingRoutes}
            showDiningZones={showDiningZones}
            clusterEvents={clusterEvents}
            activeBuildingId={activeMapBuildingId}
            activeEventId={activeMapEventId}
            activeRouteId={activeRoute?.id ?? null}
            activeDiningZoneId={activeDiningZone?.id ?? null}
            userLocation={userLocation}
            focusRequest={focusRequest}
            wayfindingJourney={activeJourney}
            onSelectEvent={handleSelectEvent}
            onSelectBuilding={handleSelectBuilding}
            onSelectRoute={handleSelectRoute}
            onSelectDiningZone={handleSelectDiningZone}
          />

          <View style={styles.mapOverlay}>
            <View style={styles.mapStatCard}>
              <Text style={styles.mapStatValue}>{loading ? '...' : filteredEvents.length}</Text>
              <Text style={styles.mapStatLabel}>Event pins</Text>
            </View>
            <View style={styles.mapStatCard}>
              <Text style={styles.mapStatValue}>{filteredBuildings.length}</Text>
              <Text style={styles.mapStatLabel}>Buildings</Text>
            </View>
            <View style={styles.mapStatCard}>
              <Text style={styles.mapStatValue}>
                {filteredBuildings.filter((item) => isBuildingOpenNow(item)).length}
              </Text>
              <Text style={styles.mapStatLabel}>Open now</Text>
            </View>
            <View style={styles.mapStatCard}>
              <Text style={styles.mapStatValue}>
                {activeJourney ? activeJourney.durationLabel : `${campusRoutes.length}`}
              </Text>
              <Text style={styles.mapStatLabel}>{activeJourney ? 'Walk time' : 'Routes'}</Text>
            </View>
          </View>

          <View style={styles.mapHintPill}>
            <Ionicons name="location-outline" size={16} color={colors.text.primary} />
            <Text style={styles.mapHintText}>{mapHintText}</Text>
          </View>
        </View>

        {nearMeMode && userLocation ? (
          <Card style={styles.nearMeCard}>
            <View style={styles.nearMeHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Near you</Text>
                <Text style={styles.nearMeTitle}>What's close right now</Text>
              </View>
              <Badge
                label={formatDistanceMiles((userLocation.accuracy ?? 0) || 45)}
                color={colors.status.info}
              />
            </View>
            <View style={styles.nearMeGrid}>
              <View style={styles.nearMeColumn}>
                <Text style={styles.nearMeColumnTitle}>Buildings</Text>
                {nearbyBuildings.length > 0 ? (
                  nearbyBuildings.map(({ building, distanceMeters }) => (
                    <Pressable
                      key={building.id}
                      onPress={() => handleSelectBuilding(building)}
                      style={styles.nearItemRow}
                    >
                      <Text style={styles.nearItemTitle}>{building.name}</Text>
                      <Text style={styles.nearItemMeta}>{formatDistanceMiles(distanceMeters)}</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.nearEmptyText}>No mapped buildings within a short walk.</Text>
                )}
              </View>
              <View style={styles.nearMeColumn}>
                <Text style={styles.nearMeColumnTitle}>Events</Text>
                {nearbyEvents.length > 0 ? (
                  nearbyEvents.map(({ event, distanceMeters }) => (
                    <Pressable
                      key={event.id}
                      onPress={() => handleSelectEvent(event)}
                      style={styles.nearItemRow}
                    >
                      <Text style={styles.nearItemTitle}>{event.title}</Text>
                      <Text style={styles.nearItemMeta}>{formatDistanceMiles(distanceMeters)}</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.nearEmptyText}>
                    No registered events nearby at the moment.
                  </Text>
                )}
              </View>
            </View>
          </Card>
        ) : null}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionEyebrow}>Campus walks</Text>
            <Text style={styles.sectionTitle}>Tap a route to focus it on the map</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routeCardRow}
        >
          {campusRoutes.map((route) => {
            const selected = activeRoute?.id === route.id;

            return (
              <Pressable
                key={route.id}
                onPress={() => {
                  if (activeRoute?.id === route.id) {
                    setActiveRoute(null);
                    return;
                  }

                  handleSelectRoute(route);
                }}
                style={[styles.routeCard, selected && styles.routeCardActive]}
              >
                <View style={[styles.routeCardAccent, { backgroundColor: route.color }]} />
                <Text style={styles.routeCardTitle}>{route.name}</Text>
                <Text style={styles.routeCardMeta}>{route.duration}</Text>
                <Text numberOfLines={2} style={styles.routeCardDescription}>
                  {route.description}
                </Text>
                <Text style={styles.routeCardCta}>{selected ? 'Selected on map' : 'Tap to preview'}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {activeRoute ? (
          <Card style={styles.routeSummaryCard}>
            <View style={styles.routeSummaryHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Selected walk</Text>
                <Text style={styles.routeSummaryTitle}>{activeRoute.name}</Text>
              </View>
              <Badge label={activeRoute.duration} color={activeRoute.color} />
            </View>
            <Text style={styles.routeSummaryBody}>{activeRoute.description}</Text>
            <View style={styles.routeSummaryStats}>
              <Text style={styles.routeSummaryStat}>{activeRouteStats?.checkpoints ?? 0} checkpoints</Text>
              <Text style={styles.routeSummaryStat}>
                {activeRouteStats?.nearbyBuildings ?? 0} nearby buildings
              </Text>
            </View>
            <View style={styles.sheetActionRow}>
              <Button
                title="Focus route"
                onPress={() => handleSelectRoute(activeRoute)}
                fullWidth
                style={styles.sheetActionButton}
              />
              <Button
                title="Clear"
                onPress={() => setActiveRoute(null)}
                variant="secondary"
                fullWidth
                style={styles.sheetActionButton}
              />
            </View>
          </Card>
        ) : null}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionEyebrow}>Registered events</Text>
            <Text style={styles.sectionTitle}>What is happening across campus</Text>
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
                Try a broader time range or clear one of the category filters.
              </Text>
            </Card>
          )}
        </View>


      </View>

      <BottomSheet visible={isLayersSheetOpen} onClose={() => setIsLayersSheetOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Layers</Text>
          <Text style={styles.sheetDescription}>
            Keep the map clean by only turning on what you need.
          </Text>
          <View style={styles.layerSheetList}>
            {[
              {
                label: 'Registered events',
                description: 'Only mapped events from the xUMD feed.',
                active: showEvents,
                onPress: () => setShowEvents((value) => !value),
              },
              {
                label: 'Campus buildings',
                description: 'Academic, dining, athletics, study, and student-life buildings.',
                active: showBuildings,
                onPress: () => setShowBuildings((value) => !value),
              },
              {
                label: 'Campus walks',
                description: 'Preset walking paths like Mall Loop and STEM Link.',
                active: showWalkingRoutes,
                onPress: () => setShowWalkingRoutes((value) => !value),
              },
              {
                label: 'Dining zones',
                description: 'Meal hubs and high-traffic food areas.',
                active: showDiningZones,
                onPress: () => setShowDiningZones((value) => !value),
              },
              {
                label: 'Event clusters',
                description: 'Group dense event pins until you zoom in.',
                active: clusterEvents,
                onPress: () => setClusterEvents((value) => !value),
              },
            ].map((item) => (
              <Pressable key={item.label} onPress={item.onPress} style={styles.layerSheetRow}>
                <View style={styles.layerSheetCopy}>
                  <Text style={styles.layerSheetTitle}>{item.label}</Text>
                  <Text style={styles.layerSheetDescription}>{item.description}</Text>
                </View>
                <View
                  style={[
                    styles.layerSheetPill,
                    item.active && styles.layerSheetPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.layerSheetPillText,
                      item.active && styles.layerSheetPillTextActive,
                    ]}
                  >
                    {item.active ? 'On' : 'Off'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Button title="Done" onPress={() => setIsLayersSheetOpen(false)} fullWidth />
        </View>
      </BottomSheet>

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
        }}
        secondaryActionLabel="Route there"
        onSecondaryAction={(eventId) => {
          const event = filteredEvents.find((item) => item.id === eventId);

          if (event) {
            handleRouteToEvent(event);
          }
        }}
      />

      <BottomSheet visible={Boolean(activeBuilding)} onClose={() => setActiveBuilding(null)}>
        {activeBuilding ? (
          <View style={styles.sheetContent}>
            <View style={styles.sheetBadgeRow}>
              <Badge label={activeBuilding.code} color={colors.gray[700]} />
              <Badge
                label={activeBuildingStatus?.isOpen ? 'Open now' : 'Closed'}
                color={
                  activeBuildingStatus?.isOpen ? colors.status.success : colors.text.secondary
                }
              />
            </View>
            <Text style={styles.sheetTitle}>{activeBuilding.name}</Text>
            <Text style={styles.sheetMeta}>{activeBuildingStatus?.label}</Text>
            <Text style={styles.sheetDescription}>{activeBuilding.description}</Text>
            <View style={styles.factRow}>
              {activeBuildingFacts.map((fact) => (
                <Badge key={fact} label={fact} color={colors.text.primary} />
              ))}
            </View>
            <View style={styles.sheetStatCard}>
              <Text style={styles.sheetStatCardLabel}>What's here now</Text>
              {activeBuildingCurrentEvents.length > 0 ? (
                activeBuildingCurrentEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() => handleSelectEvent(event)}
                    style={styles.activityRow}
                  >
                    <View style={styles.activityDot} />
                    <View style={styles.activityCopy}>
                      <Text style={styles.activityTitle}>{event.title}</Text>
                      <Text style={styles.activityMeta}>
                        Live until {format(new Date(event.ends_at), 'h:mm a')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyBodyText}>
                  No live registered events inside this building right now.
                </Text>
              )}
            </View>
            {activeBuildingUpcomingEvents.length > 0 ? (
              <View style={styles.sheetStatCard}>
                <Text style={styles.sheetStatCardLabel}>Next up here</Text>
                {activeBuildingUpcomingEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() => handleSelectEvent(event)}
                    style={styles.activityRow}
                  >
                    <View style={styles.activityDotMuted} />
                    <View style={styles.activityCopy}>
                      <Text style={styles.activityTitle}>{event.title}</Text>
                      <Text style={styles.activityMeta}>
                        {format(new Date(event.starts_at), 'EEE, h:mm a')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.sheetActionRow}>
              <Button
                title="Route here"
                onPress={() => handleRouteToBuilding(activeBuilding)}
                fullWidth
                style={styles.sheetActionButton}
              />
              <Button
                title="Center"
                onPress={() =>
                  setFocusRequest(
                    buildFocusRequestForCoordinate(
                      `building-${activeBuilding.id}-${Date.now()}`,
                      [activeBuilding.longitude, activeBuilding.latitude],
                    ),
                  )
                }
                variant="secondary"
                fullWidth
                style={styles.sheetActionButton}
              />
            </View>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={Boolean(activeRoute)} onClose={() => setActiveRoute(null)}>
        {activeRoute ? (
          <View style={styles.sheetContent}>
            <View style={styles.sheetBadgeRow}>
              <Badge label="Walking route" color={activeRoute.color} />
              <Badge label={activeRoute.duration} color={colors.text.primary} />
            </View>
            <Text style={styles.sheetTitle}>{activeRoute.name}</Text>
            <Text style={styles.sheetDescription}>{activeRoute.description}</Text>
            <View style={styles.sheetStatsRow}>
              <View style={styles.sheetStatCardCompact}>
                <Text style={styles.sheetStatCardLabel}>Checkpoints</Text>
                <Text style={styles.sheetStatCardValue}>{activeRouteStats?.checkpoints ?? 0}</Text>
              </View>
              <View style={styles.sheetStatCardCompact}>
                <Text style={styles.sheetStatCardLabel}>Nearby buildings</Text>
                <Text style={styles.sheetStatCardValue}>
                  {activeRouteStats?.nearbyBuildings ?? 0}
                </Text>
              </View>
            </View>
            <View style={styles.sheetActionRow}>
              <Button
                title="Focus route"
                onPress={() => handleSelectRoute(activeRoute)}
                fullWidth
                style={styles.sheetActionButton}
              />
              <Button
                title="Hide"
                onPress={() => setActiveRoute(null)}
                variant="secondary"
                fullWidth
                style={styles.sheetActionButton}
              />
            </View>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={Boolean(activeDiningZone)} onClose={() => setActiveDiningZone(null)}>
        {activeDiningZone ? (
          <View style={styles.sheetContent}>
            <View style={styles.sheetBadgeRow}>
              <Badge label="Dining zone" color={colors.secondary.dark} />
              <Badge label="Overlay" color={colors.text.primary} />
            </View>
            <Text style={styles.sheetTitle}>{activeDiningZone.name}</Text>
            <Text style={styles.sheetDescription}>{activeDiningZone.description}</Text>
            <View style={styles.sheetStatsRow}>
              <View style={styles.sheetStatCardCompact}>
                <Text style={styles.sheetStatCardLabel}>Buildings inside</Text>
                <Text style={styles.sheetStatCardValue}>
                  {activeDiningZoneStats?.nearbyBuildings ?? 0}
                </Text>
              </View>
              <View style={styles.sheetStatCardCompact}>
                <Text style={styles.sheetStatCardLabel}>Events nearby</Text>
                <Text style={styles.sheetStatCardValue}>
                  {activeDiningZoneStats?.nearbyEvents ?? 0}
                </Text>
              </View>
            </View>
            <Button title="Close" onPress={() => setActiveDiningZone(null)} fullWidth />
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={Boolean(activeJourney)} onClose={() => setActiveJourney(null)}>
        {activeJourney ? (
          <View style={styles.sheetContent}>
            <View style={styles.sheetBadgeRow}>
              <Badge label="Walking route" color={colors.primary.main} />
              <Badge label={activeJourney.distanceLabel} color={colors.text.primary} />
            </View>
            <Text style={styles.sheetTitle}>{activeJourney.title}</Text>
            <Text style={styles.sheetDescription}>
              {activeJourney.startLabel} to {activeJourney.endLabel}
            </Text>
            <Text style={styles.sheetMeta}>{activeJourney.subtitle}</Text>
            <View style={styles.sheetStatsRow}>
              <View style={styles.sheetStatCardCompact}>
                <Text style={styles.sheetStatCardLabel}>Estimated walk</Text>
                <Text style={styles.sheetStatCardValue}>{activeJourney.durationLabel}</Text>
              </View>
              <View style={styles.sheetStatCardCompact}>
                <Text style={styles.sheetStatCardLabel}>Distance</Text>
                <Text style={styles.sheetStatCardValue}>{activeJourney.distanceLabel}</Text>
              </View>
            </View>
            <View style={styles.sheetActionRow}>
              <Button
                title="Focus route"
                onPress={() =>
                  setFocusRequest(
                    buildFocusRequestFromCoordinates(
                      `journey-focus-${activeJourney.id}-${Date.now()}`,
                      activeJourney.coordinates,
                      { padding: 88 },
                    ),
                  )
                }
                fullWidth
                style={styles.sheetActionButton}
              />
              <Button
                title="Clear"
                onPress={() => setActiveJourney(null)}
                variant="secondary"
                fullWidth
                style={styles.sheetActionButton}
              />
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
  quickChipRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  quickChip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
  },
  quickChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  quickChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  quickChipTextActive: {
    color: colors.brand.white,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  controlsCard: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.white,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.md,
  },
  controlsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  controlsCopy: {
    gap: spacing.xs,
  },
  controlsEyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
  },
  controlsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  resetButton: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  controlSection: {
    gap: spacing.sm,
  },
  controlSectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  controlWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  controlScrollRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  controlChip: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  controlChipDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  controlChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  controlChipTextActive: {
    color: colors.brand.white,
  },
  locationNoticeCard: {
    gap: spacing.sm,
  },
  locationNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationNoticeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  locationNoticeBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
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
    minWidth: 96,
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
  nearMeCard: {
    gap: spacing.md,
  },
  nearMeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  nearMeTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  nearMeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nearMeColumn: {
    flex: 1,
    minWidth: 220,
    gap: spacing.sm,
  },
  nearMeColumnTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  nearItemRow: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    gap: spacing.xs,
  },
  nearItemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  nearItemMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  nearEmptyText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  routeCardRow: {
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  routeCard: {
    width: 220,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  routeCardActive: {
    borderColor: colors.primary.main,
    backgroundColor: '#FFF7F8',
  },
  routeCardAccent: {
    width: 42,
    height: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  routeCardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  routeCardMeta: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
    marginTop: spacing.xs,
  },
  routeCardDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  routeCardCta: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  routeSummaryCard: {
    gap: spacing.sm,
  },
  routeSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  routeSummaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  routeSummaryBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  routeSummaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  routeSummaryStat: {
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
  pulseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pulseCard: {
    flexBasis: 220,
    flexGrow: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    padding: spacing.md,
    ...shadows.md,
  },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  highlightIconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  highlightValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
    marginTop: spacing.xs,
  },
  highlightDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
    marginTop: spacing.sm,
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
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  topicChip: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  topicChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  topicText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  topicTextActive: {
    color: colors.brand.white,
  },
  sheetContent: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  sheetBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sheetTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sheetMeta: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  sheetDescription: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  sheetStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sheetStatCard: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  sheetStatCardCompact: {
    flex: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
  },
  sheetStatCardLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  sheetStatCardValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sheetActionButton: {
    flex: 1,
  },
  layerSheetList: {
    gap: spacing.sm,
  },
  layerSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
  },
  layerSheetCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  layerSheetTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  layerSheetDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  layerSheetPill: {
    minWidth: 52,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  layerSheetPillActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  layerSheetPillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  layerSheetPillTextActive: {
    color: colors.brand.white,
  },
  factRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.status.success,
  },
  activityDotMuted: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    opacity: 0.6,
  },
  activityCopy: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  activityMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  emptyBodyText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});




