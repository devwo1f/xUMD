import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NativeModules, Platform, StyleProp, StyleSheet, Text, UIManager, View, ViewStyle } from 'react-native';
import {
  Camera,
  CircleLayer,
  FillLayer,
  HeatmapLayer,
  LineLayer,
  MapView as MapboxMapView,
  setAccessToken,
  ShapeSource,
  SymbolLayer,
} from '@rnmapbox/maps';
import MapView, { Marker, Polygon } from 'react-native-maps';
import type { Building } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';
import { colors } from '../../../shared/theme/colors';
import { borderRadius } from '../../../shared/theme/spacing';
import {
  campusMapBounds,
  campusMapCenter,
  campusMapStyleUrl,
  campusMapZoomRange,
  mapLayerIds,
  mapSourceIds,
  mapboxAccessToken,
  hasUsableMapboxToken,
} from '../config/campusMapStyle';
import { buildingFootprints, campusMaskHoles } from '../data/campusGeometry';
import type {
  EventLocationGroup,
  MapCoordinate,
  MapFocusRequest,
  MapUserLocation,
  WayfindingJourney,
} from '../types';
import {
  createBuildingFeatureCollection,
  createCampusBoundaryFeatureCollection,
  createCampusMaskFeatureCollection,
  createEventHeatFeatureCollection,
  createEventMarkerFeatureCollection,
  createUserLocationFeatureCollection,
  createWayfindingFeatureCollection,
  getFeatureItemId,
} from '../utils/geojson';

interface CampusMapProps {
  style?: StyleProp<ViewStyle>;
  events: Event[];
  eventGroups: EventLocationGroup[];
  densityByEventId?: Record<string, number>;
  buildings: Building[];
  showEvents: boolean;
  showBuildings: boolean;
  showWalkingRoutes?: boolean;
  showDiningZones?: boolean;
  clusterEvents?: boolean;
  isHeatmapMode?: boolean;
  showActivityHeatmap?: boolean;
  activeBuildingId?: string | null;
  activeEventGroupId?: string | null;
  activeRouteId?: string | null;
  activeDiningZoneId?: string | null;
  userLocation?: MapUserLocation | null;
  focusRequest?: MapFocusRequest | null;
  wayfindingJourney?: WayfindingJourney | null;
  onSelectEventGroup: (group: EventLocationGroup) => void;
  onSelectBuilding: (building: Building) => void;
  onSelectRoute?: () => void;
  onSelectDiningZone?: () => void;
  onLongPressCoordinate?: (coordinate: MapCoordinate) => void;
}

const canRenderNativeMapbox = Boolean(
  Platform.OS !== 'web' &&
    hasUsableMapboxToken &&
    (UIManager.getViewManagerConfig?.('RNMBXMapView') ||
      (NativeModules as Record<string, unknown>).RNMBXModule),
);

const clusterFilter = ['has', 'point_count'] as any;
const unclusteredFilter = ['!', ['has', 'point_count']] as any;
const rsvpFilter = ['all', unclusteredFilter, ['==', ['get', 'isGoing'], true]] as any;
const pulseFilter = [
  'all',
  unclusteredFilter,
  ['any', ['==', ['get', 'isLive'], true], ['==', ['get', 'isFeatured'], true]],
] as any;

function regionFromCenter(longitude: number, latitude: number) {
  return {
    latitude,
    longitude,
    latitudeDelta: 0.007,
    longitudeDelta: 0.007,
  };
}

function fallbackMaskPolygon() {
  const paddingLongitude = 0.015;
  const paddingLatitude = 0.012;
  return [
    { latitude: campusMapBounds.sw[1] - paddingLatitude, longitude: campusMapBounds.sw[0] - paddingLongitude },
    { latitude: campusMapBounds.ne[1] + paddingLatitude, longitude: campusMapBounds.sw[0] - paddingLongitude },
    { latitude: campusMapBounds.ne[1] + paddingLatitude, longitude: campusMapBounds.ne[0] + paddingLongitude },
    { latitude: campusMapBounds.sw[1] - paddingLatitude, longitude: campusMapBounds.ne[0] + paddingLongitude },
  ];
}

function FallbackMarker({
  group,
  selected,
  onPress,
}: {
  group: EventLocationGroup;
  selected: boolean;
  onPress: () => void;
}) {
  const diameter = Math.max(30, Math.round(group.markerSize));

  return (
    <Marker
      coordinate={{ latitude: group.coordinate[1], longitude: group.coordinate[0] }}
      onPress={onPress}
      tracksViewChanges={group.containsFeatured || group.hasRsvpdEvents}
    >
      <View style={styles.fallbackMarkerWrap}>
        <View
          style={[
            styles.fallbackHalo,
            {
              width: diameter + 12,
              height: diameter + 12,
              borderRadius: (diameter + 12) / 2,
              backgroundColor: group.markerColor,
              opacity: group.pulse ? 0.22 : 0.12,
            },
          ]}
        />
        <View
          style={[
            styles.fallbackMarker,
            {
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              backgroundColor: group.markerColor,
              borderColor: selected ? colors.text.primary : colors.brand.white,
              opacity: group.markerOpacity,
            },
          ]}
        >
          <Text style={styles.fallbackMarkerText}>{group.glyph}</Text>
          {group.hasRsvpdEvents ? (
            <View style={styles.fallbackBadge}>
              <Text style={styles.fallbackBadgeText}>{'\u2713'}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Marker>
  );
}

export default function CampusMap({
  style,
  events,
  eventGroups,
  densityByEventId = {},
  buildings,
  showEvents,
  showBuildings,
  clusterEvents = true,
  showActivityHeatmap = true,
  activeBuildingId,
  activeEventGroupId,
  userLocation,
  focusRequest,
  wayfindingJourney,
  onSelectEventGroup,
  onSelectBuilding,
  onLongPressCoordinate,
}: CampusMapProps) {
  const mapViewRef = useRef<MapView | null>(null);
  const cameraRef = useRef<React.ElementRef<typeof Camera> | null>(null);
  const clusteredEventSourceRef = useRef<React.ElementRef<typeof ShapeSource> | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    if (!canRenderNativeMapbox || !hasUsableMapboxToken || !mapboxAccessToken) {
      return;
    }

    void setAccessToken(mapboxAccessToken);
  }, []);

  useEffect(() => {
    const hasPulseMarkers = eventGroups.some((group) => group.pulse);

    if (!hasPulseMarkers) {
      setPulsePhase(0);
      return;
    }

    const interval = setInterval(() => {
      setPulsePhase((current) => (current + 0.08) % 1);
    }, 80);

    return () => clearInterval(interval);
  }, [eventGroups]);

  const activeBuildingKey = activeBuildingId ?? '';
  const activeEventGroupKey = activeEventGroupId ?? '';
  const weightMap = useMemo(() => new Map(Object.entries(densityByEventId)), [densityByEventId]);
  const maskShape = useMemo(() => createCampusMaskFeatureCollection(), []);
  const boundaryShape = useMemo(() => createCampusBoundaryFeatureCollection(), []);
  const buildingShape = useMemo(
    () => createBuildingFeatureCollection(showBuildings ? buildings : []),
    [buildings, showBuildings],
  );
  const eventMarkerShape = useMemo(
    () => createEventMarkerFeatureCollection(showEvents ? eventGroups : [], 'category'),
    [eventGroups, showEvents],
  );
  const eventHeatShape = useMemo(
    () => createEventHeatFeatureCollection(showEvents ? events : [], weightMap),
    [events, showEvents, weightMap],
  );
  const userLocationShape = useMemo(() => createUserLocationFeatureCollection(userLocation ?? null), [userLocation]);
  const wayfindingShape = useMemo(
    () => createWayfindingFeatureCollection(wayfindingJourney ?? null),
    [wayfindingJourney],
  );

  const buildingFillStyle = useMemo(
    () => ({
      fillColor: colors.primary.main,
      fillOpacity: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 0.16, 0.1],
    }),
    [activeBuildingKey],
  ) as any;

  const buildingLineStyle = useMemo(
    () => ({
      lineColor: colors.primary.main,
      lineOpacity: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 0.95, 0.42],
      lineWidth: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 2.4, 1.1],
    }),
    [activeBuildingKey],
  ) as any;

  const clusterCountExpression = ['coalesce', ['get', 'totalEvents'], ['get', 'point_count']];
  const maxClusterExpression = ['max', ['get', 'featuredCount'], ['get', 'socialCount'], ['get', 'academicCount'], ['get', 'sportsCount'], ['get', 'otherCount']];
  const clusterColorExpression = [
    'case',
    ['==', ['get', 'featuredCount'], maxClusterExpression], '#FFD200',
    ['==', ['get', 'socialCount'], maxClusterExpression], '#E21833',
    ['==', ['get', 'academicCount'], maxClusterExpression], '#1E88E5',
    ['==', ['get', 'sportsCount'], maxClusterExpression], '#16A34A',
    '#607D8B',
  ];

  const eventClusterBubbleStyle = useMemo(
    () => ({
      circleColor: clusterColorExpression,
      circleRadius: ['step', clusterCountExpression, 22, 8, 26, 16, 31, 24, 35],
      circleStrokeColor: colors.brand.white,
      circleStrokeWidth: 3,
      circleOpacity: 0.96,
    }),
    [],
  ) as any;

  const eventClusterLabelStyle = {
    textField: ['to-string', clusterCountExpression],
    textColor: colors.brand.white,
    textSize: 12,
    textFont: ['Open Sans Bold'],
    textAllowOverlap: true,
    textIgnorePlacement: true,
  } as any;

  const eventMarkerShadowStyle = {
    circleColor: 'rgba(15, 23, 42, 0.18)',
    circleRadius: ['+', ['/', ['get', 'markerSize'], 2], 2],
    circleTranslate: [0, 4],
    circleBlur: 0.25,
  } as any;

  const eventMarkerHaloStyle = useMemo(
    () => ({
      circleColor: ['get', 'color'],
      circleRadius: ['/', ['get', 'haloSize'], 2],
      circleOpacity: ['case', ['==', ['get', 'itemId'], activeEventGroupKey], 0.24, 0.14],
    }),
    [activeEventGroupKey],
  ) as any;

  const eventLivePulseStyle = useMemo(
    () => ({
      circleColor: ['get', 'color'],
      circleRadius: ['+', ['/', ['get', 'haloSize'], 2], 3 + pulsePhase * 10],
      circleOpacity: Math.max(0.04, 0.2 - pulsePhase * 0.16),
    }),
    [pulsePhase],
  ) as any;

  const eventMarkerCircleStyle = useMemo(
    () => ({
      circleColor: ['get', 'color'],
      circleRadius: ['/', ['get', 'markerSize'], 2],
      circleStrokeColor: colors.brand.white,
      circleStrokeWidth: ['case', ['==', ['get', 'itemId'], activeEventGroupKey], 3.4, 2.4],
      circleOpacity: ['get', 'markerOpacity'],
    }),
    [activeEventGroupKey],
  ) as any;

  const eventLabelStyle = {
    textField: ['get', 'glyph'],
    textColor: colors.brand.white,
    textSize: ['case', ['>=', ['get', 'markerSize'], 42], 14, 11],
    textFont: ['Open Sans Bold'],
    textAllowOverlap: true,
    textIgnorePlacement: true,
  } as any;

  const eventHeatStyle = {
    heatmapRadius: ['interpolate', ['linear'], ['zoom'], 14, 28, 16.5, 48, 19, 22],
    heatmapOpacity: ['interpolate', ['linear'], ['zoom'], 14, 0.46, 17.6, 0.28, 19, 0.14],
    heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 14, 0.8, 16.8, 1.35, 18.8, 1.75],
    heatmapColor: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0,0,0,0)',
      0.14, 'rgba(255, 224, 130, 0.18)',
      0.34, 'rgba(255, 183, 77, 0.34)',
      0.58, 'rgba(255, 112, 67, 0.46)',
      0.8, 'rgba(239, 68, 68, 0.56)',
      1, 'rgba(185, 28, 28, 0.68)',
    ],
    heatmapWeight: ['interpolate', ['linear'], ['get', 'weight'], 0.5, 0.2, 6, 1],
  } as any;

  useEffect(() => {
    if (canRenderNativeMapbox || !focusRequest) {
      return;
    }

    const mapView = mapViewRef.current;
    if (!mapView) {
      return;
    }

    if (focusRequest.coordinatePoints && focusRequest.coordinatePoints.length >= 2) {
      mapView.fitToCoordinates(
        focusRequest.coordinatePoints.map(([longitude, latitude]) => ({ latitude, longitude })),
        {
          edgePadding: {
            top: focusRequest.padding ?? 56,
            right: focusRequest.padding ?? 56,
            bottom: focusRequest.padding ?? 56,
            left: focusRequest.padding ?? 56,
          },
          animated: true,
        },
      );
      return;
    }

    if (focusRequest.centerCoordinate) {
      const [longitude, latitude] = focusRequest.centerCoordinate;
      mapView.animateToRegion(regionFromCenter(longitude, latitude), 650);
    }
  }, [focusRequest?.id]);

  useEffect(() => {
    if (!canRenderNativeMapbox || !focusRequest) {
      return;
    }

    if (focusRequest.bounds) {
      cameraRef.current?.fitBounds(
        focusRequest.bounds.ne,
        focusRequest.bounds.sw,
        focusRequest.padding ?? 56,
        650,
      );
      return;
    }

    if (focusRequest.centerCoordinate) {
      cameraRef.current?.setCamera({
        centerCoordinate: focusRequest.centerCoordinate,
        zoomLevel: focusRequest.zoomLevel ?? 16.2,
        animationDuration: 650,
      });
    }
  }, [focusRequest?.id]);

  if (!canRenderNativeMapbox) {
    const campusHoles = campusMaskHoles.map((ring) => ring.map(([longitude, latitude]) => ({ latitude, longitude })));

    return (
      <MapView
        ref={mapViewRef}
        style={style}
        initialRegion={regionFromCenter(campusMapCenter[0], campusMapCenter[1])}
        showsUserLocation
        showsCompass
        onLongPress={(pressEvent) => {
          const { longitude, latitude } = pressEvent.nativeEvent.coordinate;
          onLongPressCoordinate?.([longitude, latitude]);
        }}
      >
        <Polygon
          coordinates={fallbackMaskPolygon()}
          holes={campusHoles}
          fillColor="rgba(17,24,39,0.55)"
          strokeColor="transparent"
          strokeWidth={0}
        />
        {showBuildings
          ? buildings.map((building) => {
              const footprint = buildingFootprints[building.id];
              if (!footprint) {
                return null;
              }

              return (
                <React.Fragment key={building.id}>
                  <Polygon
                    coordinates={footprint.map(([longitude, latitude]) => ({ latitude, longitude }))}
                    fillColor={activeBuildingId === building.id ? 'rgba(226,24,51,0.16)' : 'rgba(226,24,51,0.1)'}
                    strokeColor={activeBuildingId === building.id ? 'rgba(226,24,51,0.9)' : 'rgba(226,24,51,0.4)'}
                    strokeWidth={activeBuildingId === building.id ? 2.4 : 1.1}
                    tappable
                    onPress={() => onSelectBuilding(building)}
                  />
                  <Marker
                    coordinate={{ latitude: building.latitude, longitude: building.longitude }}
                    tracksViewChanges={false}
                    onPress={() => onSelectBuilding(building)}
                  >
                    <View style={styles.fallbackBuildingLabel}>
                      <Text style={styles.fallbackBuildingLabelText}>{building.code}</Text>
                    </View>
                  </Marker>
                </React.Fragment>
              );
            })
          : null}

        {showEvents
          ? eventGroups.map((group) => (
              <FallbackMarker
                key={group.id}
                group={group}
                selected={group.id === activeEventGroupId}
                onPress={() => onSelectEventGroup(group)}
              />
            ))
          : null}

        {userLocation ? (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            tracksViewChanges={false}
          >
            <View style={styles.fallbackUserDotOuter}>
              <View style={styles.fallbackUserDotInner} />
            </View>
          </Marker>
        ) : null}
      </MapView>
    );
  }

  return (
    <MapboxMapView
      style={style}
      styleURL={campusMapStyleUrl}
      compassEnabled
      pitchEnabled
      maxPitch={60}
      rotateEnabled={false}
      attributionEnabled={false}
      logoEnabled={false}
      scaleBarEnabled={false}
      onLongPress={(feature) => {
        const [longitude, latitude] = feature.geometry.coordinates as [number, number];
        onLongPressCoordinate?.([longitude, latitude]);
      }}
    >
      <Camera
        ref={cameraRef}
        defaultSettings={{
          centerCoordinate: campusMapCenter,
          zoomLevel: campusMapZoomRange.default,
          pitch: 0,
        }}
        minZoomLevel={campusMapZoomRange.min}
        maxZoomLevel={campusMapZoomRange.max}
        maxBounds={campusMapBounds}
      />

      <ShapeSource id={mapSourceIds.campusMask} shape={maskShape}>
        <FillLayer
          id={mapLayerIds.boundaryMask}
          style={{ fillColor: 'rgba(17,24,39,0.56)', fillOpacity: 1 } as any}
        />
      </ShapeSource>

      <ShapeSource id={mapSourceIds.campusBoundary} shape={boundaryShape}>
        <FillLayer id={mapLayerIds.boundaryFill} style={{ fillColor: colors.primary.main, fillOpacity: 0 } as any} />
        <LineLayer
          id={mapLayerIds.boundaryLine}
          style={{
            lineColor: colors.primary.main,
            lineOpacity: 0,
            lineWidth: 0.5,
          } as any}
        />
      </ShapeSource>

      {showActivityHeatmap ? (
        <ShapeSource id={mapSourceIds.eventHeat} shape={eventHeatShape}>
          <HeatmapLayer id={mapLayerIds.eventHeat} style={eventHeatStyle} />
        </ShapeSource>
      ) : null}

      <ShapeSource
        id={mapSourceIds.buildings}
        shape={buildingShape}
        hitbox={{ width: 44, height: 44 }}
        onPress={(pressEvent) => {
          const buildingId = getFeatureItemId(pressEvent.features[0]);
          const building = buildings.find((item) => item.id === buildingId);

          if (building) {
            onSelectBuilding(building);
          }
        }}
      >
        <FillLayer id={mapLayerIds.buildingFill} style={buildingFillStyle} />
        <LineLayer id={mapLayerIds.buildingLine} style={buildingLineStyle} />
        <SymbolLayer
          id={mapLayerIds.buildingLabel}
          style={{
            textField: ['get', 'code'],
            textColor: colors.text.primary,
            textSize: 10,
            textFont: ['Open Sans Bold'],
            textAllowOverlap: false,
            textHaloColor: 'rgba(255,255,255,0.85)',
            textHaloWidth: 1.2,
          } as any}
        />
      </ShapeSource>

      {showEvents ? (
        <ShapeSource
          ref={clusteredEventSourceRef}
          id={mapSourceIds.eventMarkers}
          shape={eventMarkerShape}
          cluster={clusterEvents}
          clusterRadius={58}
          clusterMaxZoomLevel={16}
          clusterProperties={{
            totalEvents: ['+', ['get', 'eventCount']],
            featuredCount: ['+', ['case', ['boolean', ['get', 'isFeatured'], false], ['get', 'eventCount'], 0]],
            socialCount: ['+', ['case', ['==', ['get', 'categoryKey'], 'social'], ['get', 'eventCount'], 0]],
            academicCount: ['+', ['case', ['==', ['get', 'categoryKey'], 'academic'], ['get', 'eventCount'], 0]],
            sportsCount: ['+', ['case', ['==', ['get', 'categoryKey'], 'sports'], ['get', 'eventCount'], 0]],
            otherCount: ['+', ['case', ['==', ['get', 'categoryKey'], 'other'], ['get', 'eventCount'], 0]],
          }}
          hitbox={{ width: 48, height: 48 }}
          onPress={async (pressEvent) => {
            const feature = pressEvent.features[0];
            const properties = feature?.properties as Record<string, unknown> | undefined;

            if (properties?.cluster) {
              const zoomLevel = await clusteredEventSourceRef.current?.getClusterExpansionZoom(feature);
              if (feature.geometry.type !== 'Point') {
                return;
              }

              const [longitude, latitude] = feature.geometry.coordinates as [number, number];

              if (typeof zoomLevel === 'number') {
                cameraRef.current?.setCamera({
                  centerCoordinate: [longitude, latitude],
                  zoomLevel: zoomLevel + 0.4,
                  animationDuration: 550,
                });
              }
              return;
            }

            const groupId = getFeatureItemId(feature);
            const group = eventGroups.find((item) => item.id === groupId);

            if (group) {
              onSelectEventGroup(group);
            }
          }}
        >
          <>
            {clusterEvents ? (
              <CircleLayer id={mapLayerIds.eventClusterBubble} filter={clusterFilter} style={eventClusterBubbleStyle} />
            ) : null}
            {clusterEvents ? (
              <SymbolLayer id={mapLayerIds.eventClusterLabel} filter={clusterFilter} style={eventClusterLabelStyle} />
            ) : null}
          </>
          <CircleLayer id={mapLayerIds.eventMarkerShadow} filter={clusterEvents ? unclusteredFilter : undefined} style={eventMarkerShadowStyle} />
          <CircleLayer id={mapLayerIds.eventMarkerHalo} filter={clusterEvents ? unclusteredFilter : undefined} style={eventMarkerHaloStyle} />
          <CircleLayer id={mapLayerIds.eventLivePulse} filter={clusterEvents ? pulseFilter : ['any', ['==', ['get', 'isLive'], true], ['==', ['get', 'isFeatured'], true]]} style={eventLivePulseStyle} />
          <CircleLayer id={mapLayerIds.eventMarkerCircle} filter={clusterEvents ? unclusteredFilter : undefined} style={eventMarkerCircleStyle} />
          <SymbolLayer id={mapLayerIds.eventMarkerLabel} filter={clusterEvents ? unclusteredFilter : undefined} style={eventLabelStyle} />
          <CircleLayer id={mapLayerIds.eventRsvpBadge} filter={rsvpFilter} style={{ circleColor: colors.brand.white, circleRadius: 7, circleStrokeColor: '#0F172A', circleStrokeWidth: 1.2, circleTranslate: [12, -10] } as any} />
          <SymbolLayer id={mapLayerIds.eventRsvpLabel} filter={rsvpFilter} style={{ textField: '\u2713', textColor: '#0F766E', textSize: 10, textFont: ['Open Sans Bold'], textAllowOverlap: true, textIgnorePlacement: true, textOffset: [1.15, -0.95] } as any} />
        </ShapeSource>
      ) : null}

      <ShapeSource id={mapSourceIds.userLocation} shape={userLocationShape}>
        <CircleLayer id={mapLayerIds.userLocationHalo} style={{ circleColor: colors.status.info, circleRadius: 18, circleOpacity: 0.2 } as any} />
        <CircleLayer id={mapLayerIds.userLocationCircle} style={{ circleColor: colors.brand.white, circleRadius: 8, circleStrokeColor: colors.status.info, circleStrokeWidth: 3 } as any} />
      </ShapeSource>

      <ShapeSource id={mapSourceIds.wayfinding} shape={wayfindingShape}>
        <LineLayer id={mapLayerIds.wayfindingCasing} style={{ lineColor: colors.brand.white, lineOpacity: 0.98, lineWidth: 10 } as any} />
        <LineLayer id={mapLayerIds.wayfindingLine} style={{ lineColor: ['get', 'color'], lineOpacity: 1, lineWidth: 5, lineDasharray: [1.2, 0.8] } as any} />
      </ShapeSource>
    </MapboxMapView>
  );
}

const styles = StyleSheet.create({
  fallbackMarkerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackHalo: {
    position: 'absolute',
  },
  fallbackMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  fallbackMarkerText: {
    color: colors.brand.white,
    fontWeight: '700',
    fontSize: 12,
  },
  fallbackBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brand.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  fallbackBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  fallbackBuildingLabel: {
    minWidth: 30,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(226,24,51,0.14)',
  },
  fallbackBuildingLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.primary,
  },
  fallbackUserDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(37,99,235,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackUserDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.status.info,
    borderWidth: 2,
    borderColor: colors.brand.white,
  },
  wrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.secondary,
  },
});
