import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, NativeModules, Platform, StyleProp, StyleSheet, Text, UIManager, View, ViewStyle } from 'react-native';
import {
  Camera,
  CircleLayer,
  FillLayer,
  HeatmapLayer,
  Images,
  LineLayer,
  MapView as MapboxMapView,
  setAccessToken,
  ShapeSource,
  SymbolLayer,
} from '@rnmapbox/maps';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import type { Building } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';
import { colors } from '../../../shared/theme/colors';
import { borderRadius } from '../../../shared/theme/spacing';
import {
  campusMapBounds,
  campusMapCenter,
  campusMapPalette,
  campusMapStyleUrl,
  campusMapZoomRange,
  mapLayerIds,
  mapSourceIds,
  mapboxAccessToken,
  hasUsableMapboxToken,
} from '../config/campusMapStyle';
import { buildingFootprints, campusMaskHoles } from '../data/campusGeometry';
import { campusLandscapeAreas, campusLandscapePaths } from '../data/campusLandscape';
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
  createLandscapeAreaFeatureCollection,
  createLandscapePathFeatureCollection,
  createUserLocationFeatureCollection,
  createWayfindingFeatureCollection,
  getFeatureItemId,
} from '../utils/geojson';
import {
  buildClusterDominantColorExpression,
  buildClusterProperties,
  MAP_PIN_IMAGE_ENTRIES,
} from '../utils/pinAssets';

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
const waterFilter = ['==', ['get', 'kind'], 'water'] as any;
const parkingFilter = ['==', ['get', 'kind'], 'parking'] as any;
const plazaFilter = ['==', ['get', 'kind'], 'plaza'] as any;
const lawnFilter = ['==', ['get', 'kind'], 'lawn'] as any;
const treeFilter = ['==', ['get', 'kind'], 'trees'] as any;
const sportsFilter = ['==', ['get', 'kind'], 'sports'] as any;
const multiPinFilter = ['all', unclusteredFilter, ['==', ['get', 'isMultiEvent'], true]] as any;
const regularPinFilter = [
  'all',
  unclusteredFilter,
  ['==', ['get', 'isMultiEvent'], false],
  ['==', ['get', 'isLive'], false],
  ['==', ['get', 'isFeatured'], false],
  ['==', ['get', 'isGoing'], false],
] as any;
const goingPinFilter = [
  'all',
  unclusteredFilter,
  ['==', ['get', 'isMultiEvent'], false],
  ['==', ['get', 'isLive'], false],
  ['==', ['get', 'isFeatured'], false],
  ['==', ['get', 'isGoing'], true],
] as any;
const featuredPinFilter = [
  'all',
  unclusteredFilter,
  ['==', ['get', 'isMultiEvent'], false],
  ['==', ['get', 'isLive'], false],
  ['==', ['get', 'isFeatured'], true],
] as any;
const livePinFilter = [
  'all',
  unclusteredFilter,
  ['==', ['get', 'isMultiEvent'], false],
  ['==', ['get', 'isLive'], true],
] as any;
const pulseFilter = [
  'all',
  unclusteredFilter,
  ['==', ['get', 'isLive'], true],
] as any;
function buildBuildingLabelFieldExpression(activeBuildingId?: string | null) {
  return [
    'case',
    ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'],
    ['get', 'longLabel'],
    '',
  ] as any;
}

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
  onPress,
}: {
  group: EventLocationGroup;
  onPress: () => void;
}) {
  const pinWidth = Math.max(34, Math.round(72 * group.pinScale));
  const pinHeight = Math.max(46, Math.round(96 * group.pinScale));

  return (
    <Marker
      coordinate={{ latitude: group.coordinate[1], longitude: group.coordinate[0] }}
      onPress={onPress}
      tracksViewChanges={group.containsFeatured || group.hasRsvpdEvents}
    >
      <View style={styles.fallbackMarkerWrap}>
        <Image
          source={{ uri: MAP_PIN_IMAGE_ENTRIES[group.pinImageId]?.url }}
          style={[styles.fallbackPinImage, { width: pinWidth, height: pinHeight, opacity: group.markerOpacity }]}
        />
        {group.isMultiEvent ? (
          <Text style={[styles.fallbackPinCount, { fontSize: Math.max(12, group.countTextSize) }]}>
            {group.eventCount}
          </Text>
        ) : null}
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
  const weightMap = useMemo(() => new Map(Object.entries(densityByEventId)), [densityByEventId]);
  const maskShape = useMemo(() => createCampusMaskFeatureCollection(), []);
  const boundaryShape = useMemo(() => createCampusBoundaryFeatureCollection(), []);
  const landscapeAreaShape = useMemo(() => createLandscapeAreaFeatureCollection(), []);
  const landscapePathShape = useMemo(() => createLandscapePathFeatureCollection(), []);
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
      fillColor: [
        'case',
        ['==', ['get', 'itemId'], activeBuildingKey],
        campusMapPalette.buildingActiveFill,
        ['boolean', ['get', 'isLandmark'], false],
        campusMapPalette.buildingLandmarkFill,
        campusMapPalette.buildingFill,
      ],
      fillOpacity: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 0.88, 0.01],
    }),
    [activeBuildingKey],
  ) as any;

  const buildingLineStyle = useMemo(
    () => ({
      lineColor: [
        'case',
        ['==', ['get', 'itemId'], activeBuildingKey],
        campusMapPalette.buildingActiveStroke,
        campusMapPalette.buildingStroke,
      ],
      lineOpacity: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 1, 0],
      lineWidth: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 1.9, 1],
    }),
    [activeBuildingKey],
  ) as any;

  const clusterCountExpression = ['coalesce', ['get', 'totalEvents'], ['get', 'point_count']];

  const eventClusterBubbleStyle = useMemo(
    () => ({
      circleColor: buildClusterDominantColorExpression(),
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

  const eventLivePulseStyle = useMemo(
    () => ({
      circleColor: ['get', 'color'],
      circleRadius: ['+', ['get', 'pulseRadius'], 2 + pulsePhase * 8],
      circleOpacity: Math.max(0.04, 0.2 - pulsePhase * 0.16),
      circleTranslate: [0, -24],
    }),
    [pulsePhase],
  ) as any;

  const pinSymbolStyle = {
    iconImage: ['get', 'pinImageId'],
    iconSize: ['get', 'pinScale'],
    iconAnchor: 'bottom',
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconOpacity: ['get', 'markerOpacity'],
  } as any;

  const multiPinCountStyle = {
    textField: ['to-string', ['get', 'eventCount']],
    textColor: colors.brand.white,
    textSize: ['get', 'countTextSize'],
    textFont: ['Open Sans Bold'],
    textAllowOverlap: true,
    textIgnorePlacement: true,
    textOffset: [0, -2.55],
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
      0.14, 'rgba(255, 229, 141, 0.16)',
      0.34, 'rgba(255, 183, 77, 0.3)',
      0.58, 'rgba(255, 138, 80, 0.42)',
      0.8, 'rgba(239, 91, 78, 0.5)',
      1, 'rgba(203, 61, 49, 0.58)',
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
        mapType="standard"
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
          fillColor={campusMapPalette.mask}
          strokeColor="transparent"
          strokeWidth={0}
        />
        {campusLandscapeAreas.map((area) => (
          <Polygon
            key={area.id}
            coordinates={area.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))}
            fillColor={
              area.kind === 'water'
                ? 'rgba(158,202,225,0.9)'
                : area.kind === 'parking'
                  ? 'rgba(224,220,215,0.72)'
                  : area.kind === 'plaza'
                    ? 'rgba(233,224,216,0.84)'
                    : area.kind === 'trees'
                      ? 'rgba(124,184,122,0.44)'
                      : area.kind === 'sports'
                        ? 'rgba(142,201,138,0.62)'
                        : 'rgba(168,213,162,0.48)'
            }
            strokeColor={
              area.kind === 'sports' ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.04)'
            }
            strokeWidth={area.kind === 'sports' ? 1 : 0.5}
          />
        ))}
        {campusLandscapePaths.map((path) => (
          <Polyline
            key={path.id}
            coordinates={path.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))}
            strokeColor={campusMapPalette.walkingPath}
            strokeWidth={1.4}
            lineDashPattern={[4, 4]}
          />
        ))}
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
                    fillColor={
                      activeBuildingId === building.id
                        ? 'rgba(241,223,219,0.96)'
                        : 'rgba(232,228,224,0.01)'
                    }
                    strokeColor={
                      activeBuildingId === building.id
                        ? campusMapPalette.buildingActiveStroke
                        : 'rgba(0,0,0,0)'
                    }
                    strokeWidth={activeBuildingId === building.id ? 1.8 : 0}
                    tappable
                    onPress={() => onSelectBuilding(building)}
                  />
                </React.Fragment>
              );
            })
          : null}

        {showEvents
          ? eventGroups.map((group) => (
              <FallbackMarker
                key={group.id}
                group={group}
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
      <Images images={MAP_PIN_IMAGE_ENTRIES} />

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
          style={{ fillColor: campusMapPalette.mask, fillOpacity: 1 } as any}
        />
      </ShapeSource>

      <ShapeSource id={mapSourceIds.campusBoundary} shape={boundaryShape}>
        <FillLayer
          id={mapLayerIds.boundaryFill}
          style={{ fillColor: campusMapPalette.terrainTint, fillOpacity: 0 } as any}
        />
        <LineLayer
          id={mapLayerIds.boundaryLine}
          style={{
            lineColor: colors.primary.main,
            lineOpacity: 0,
            lineWidth: 0.5,
          } as any}
        />
      </ShapeSource>

      <ShapeSource id={mapSourceIds.landscapeAreas} shape={landscapeAreaShape}>
        <FillLayer
          id={mapLayerIds.landscapeWater}
          filter={waterFilter}
          style={{ fillColor: campusMapPalette.water, fillOpacity: 0.9 } as any}
        />
        <FillLayer
          id={mapLayerIds.landscapeParking}
          filter={parkingFilter}
          style={{ fillColor: campusMapPalette.parking, fillOpacity: 0.72 } as any}
        />
        <FillLayer
          id={mapLayerIds.landscapePlaza}
          filter={plazaFilter}
          style={{ fillColor: campusMapPalette.plaza, fillOpacity: 0.84 } as any}
        />
        <FillLayer
          id={mapLayerIds.landscapeLawn}
          filter={lawnFilter}
          style={{ fillColor: campusMapPalette.lushGreen, fillOpacity: 0.48 } as any}
        />
        <FillLayer
          id={mapLayerIds.landscapeTrees}
          filter={treeFilter}
          style={{ fillColor: campusMapPalette.treeGreen, fillOpacity: 0.44 } as any}
        />
        <FillLayer
          id={mapLayerIds.landscapeSports}
          filter={sportsFilter}
          style={{ fillColor: campusMapPalette.sportsField, fillOpacity: 0.62 } as any}
        />
        <LineLayer
          id={mapLayerIds.landscapeSportsLine}
          filter={sportsFilter}
          style={{
            lineColor: campusMapPalette.sportsFieldLine,
            lineOpacity: 0.58,
            lineWidth: 1.2,
          } as any}
        />
      </ShapeSource>

      <ShapeSource id={mapSourceIds.landscapePaths} shape={landscapePathShape}>
        <LineLayer
          id={mapLayerIds.landscapePath}
          style={{
            lineColor: campusMapPalette.walkingPath,
            lineOpacity: 0.92,
            lineWidth: ['interpolate', ['linear'], ['zoom'], 14.5, 1, 17.5, 2.2],
            lineDasharray: [1.4, 1.1],
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
            textField: buildBuildingLabelFieldExpression(activeBuildingId),
            textColor: campusMapPalette.buildingLabel,
            textSize: 12,
            textFont: ['Open Sans Bold'],
            textAllowOverlap: false,
            textMaxWidth: 10,
            textLineHeight: 1.05,
            textHaloColor: 'rgba(255,255,255,0.92)',
            textHaloWidth: 1.35,
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
          clusterProperties={buildClusterProperties()}
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
          <CircleLayer id={mapLayerIds.eventLivePulse} filter={clusterEvents ? pulseFilter : ['==', ['get', 'isLive'], true]} style={eventLivePulseStyle} />
          <SymbolLayer id={mapLayerIds.eventPinMulti} filter={multiPinFilter} style={pinSymbolStyle} />
          <SymbolLayer id={mapLayerIds.eventPinRegular} filter={regularPinFilter} style={pinSymbolStyle} />
          <SymbolLayer id={mapLayerIds.eventPinGoing} filter={goingPinFilter} style={pinSymbolStyle} />
          <SymbolLayer id={mapLayerIds.eventPinFeatured} filter={featuredPinFilter} style={pinSymbolStyle} />
          <SymbolLayer id={mapLayerIds.eventPinLive} filter={livePinFilter} style={pinSymbolStyle} />
          <SymbolLayer id={mapLayerIds.eventPinCountLabel} filter={multiPinFilter} style={multiPinCountStyle} />
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
  fallbackPinImage: {
    resizeMode: 'contain',
  },
  fallbackPinCount: {
    position: 'absolute',
    top: '22%',
    color: colors.brand.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  fallbackBuildingLabel: {
    minWidth: 30,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(197,192,186,0.9)',
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
