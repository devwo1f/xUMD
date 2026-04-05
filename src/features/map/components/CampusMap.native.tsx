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
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
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
import {
  campusRoutes,
  diningZones,
  type CampusRoute,
  type DiningZone,
} from '../data/campusOverlays';
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
  createDiningZoneFeatureCollection,
  createEventHeatFeatureCollection,
  createEventMarkerFeatureCollection,
  createRouteFeatureCollection,
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
  activeBuildingId?: string | null;
  activeEventGroupId?: string | null;
  activeRouteId?: string | null;
  activeDiningZoneId?: string | null;
  userLocation?: MapUserLocation | null;
  focusRequest?: MapFocusRequest | null;
  wayfindingJourney?: WayfindingJourney | null;
  onSelectEventGroup: (group: EventLocationGroup) => void;
  onSelectBuilding: (building: Building) => void;
  onSelectRoute?: (route: CampusRoute) => void;
  onSelectDiningZone?: (zone: DiningZone) => void;
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
const liveMarkerFilter = ['all', unclusteredFilter, ['==', ['get', 'isLive'], true]] as any;
const selectedMarkerFilter = ['all', unclusteredFilter] as any;

const boundaryFillStyle = {
  fillColor: colors.primary.main,
  fillOpacity: 0.08,
} as any;

const boundaryLineStyle = {
  lineColor: colors.primary.main,
  lineOpacity: 0.4,
  lineWidth: 2,
  lineDasharray: [2, 2],
} as any;

const wayfindingCasingStyle = {
  lineColor: colors.brand.white,
  lineOpacity: 0.98,
  lineWidth: 10,
} as any;

const wayfindingLineStyle = {
  lineColor: ['get', 'color'],
  lineOpacity: 1,
  lineWidth: 5,
  lineDasharray: [1.2, 0.8],
} as any;

const userLocationHaloStyle = {
  circleColor: colors.status.info,
  circleRadius: 18,
  circleOpacity: 0.2,
} as any;

const userLocationCircleStyle = {
  circleColor: colors.brand.white,
  circleRadius: 8,
  circleStrokeColor: colors.status.info,
  circleStrokeWidth: 3,
} as any;

function regionFromCenter(longitude: number, latitude: number) {
  return {
    latitude,
    longitude,
    latitudeDelta: 0.007,
    longitudeDelta: 0.007,
  };
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
  const diameter = Math.max(28, Math.round(group.markerSize));

  return (
    <Marker
      coordinate={{ latitude: group.coordinate[1], longitude: group.coordinate[0] }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={styles.fallbackMarkerWrap}>
        <View
          style={[
            styles.fallbackHalo,
            {
              width: diameter + 10,
              height: diameter + 10,
              borderRadius: (diameter + 10) / 2,
              backgroundColor: group.markerColor,
              opacity: group.isLive ? 0.28 : 0.16,
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
  showWalkingRoutes = true,
  showDiningZones = true,
  clusterEvents = true,
  isHeatmapMode = true,
  activeBuildingId,
  activeEventGroupId,
  activeRouteId,
  activeDiningZoneId,
  userLocation,
  focusRequest,
  wayfindingJourney,
  onSelectEventGroup,
  onSelectBuilding,
  onSelectRoute,
  onSelectDiningZone,
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
    const hasLiveMarkers = eventGroups.some((group) => group.isLive);

    if (!hasLiveMarkers) {
      setPulsePhase(0);
      return;
    }

    const interval = setInterval(() => {
      setPulsePhase((current) => (current + 0.08) % 1);
    }, 80);

    return () => clearInterval(interval);
  }, [eventGroups]);

  const activeRouteKey = activeRouteId ?? '';
  const activeDiningZoneKey = activeDiningZoneId ?? '';
  const activeBuildingKey = activeBuildingId ?? '';
  const activeEventGroupKey = activeEventGroupId ?? '';

  const densityMap = useMemo(() => new Map(Object.entries(densityByEventId)), [densityByEventId]);
  const boundaryShape = useMemo(() => createCampusBoundaryFeatureCollection(), []);
  const routeShape = useMemo(
    () => createRouteFeatureCollection(showWalkingRoutes ? campusRoutes : []),
    [showWalkingRoutes],
  );
  const diningZoneShape = useMemo(
    () => createDiningZoneFeatureCollection(showDiningZones ? diningZones : []),
    [showDiningZones],
  );
  const buildingShape = useMemo(
    () => createBuildingFeatureCollection(showBuildings ? buildings : []),
    [buildings, showBuildings],
  );
  const eventMarkerShape = useMemo(
    () => createEventMarkerFeatureCollection(showEvents ? eventGroups : [], isHeatmapMode ? 'heatmap' : 'category'),
    [eventGroups, isHeatmapMode, showEvents],
  );
  const eventHeatShape = useMemo(
    () => createEventHeatFeatureCollection(showEvents ? events : [], densityMap),
    [densityMap, events, showEvents],
  );
  const userLocationShape = useMemo(() => createUserLocationFeatureCollection(userLocation ?? null), [userLocation]);
  const wayfindingShape = useMemo(
    () => createWayfindingFeatureCollection(wayfindingJourney ?? null),
    [wayfindingJourney],
  );

  const buildingHaloStyle = useMemo(
    () => ({
      circleColor: ['get', 'color'],
      circleRadius: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 24, 18],
      circleOpacity: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 0.28, 0.18],
    }),
    [activeBuildingKey],
  ) as any;

  const buildingCircleStyle = useMemo(
    () => ({
      circleColor: colors.brand.white,
      circleRadius: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 16, 14],
      circleStrokeColor: ['get', 'color'],
      circleStrokeWidth: ['case', ['==', ['get', 'itemId'], activeBuildingKey], 3, 2],
    }),
    [activeBuildingKey],
  ) as any;

  const routeCasingStyle = useMemo(
    () => ({
      lineColor: colors.brand.white,
      lineOpacity: 0.92,
      lineWidth: ['case', ['==', ['get', 'itemId'], activeRouteKey], 10, 8],
    }),
    [activeRouteKey],
  ) as any;

  const routeLineStyle = useMemo(
    () => ({
      lineColor: ['case', ['==', ['get', 'itemId'], activeRouteKey], colors.text.primary, ['get', 'color']],
      lineOpacity: 0.98,
      lineWidth: ['case', ['==', ['get', 'itemId'], activeRouteKey], 5, 4],
    }),
    [activeRouteKey],
  ) as any;

  const diningZoneFillStyle = useMemo(
    () => ({
      fillColor: ['get', 'fillColor'],
      fillOpacity: ['case', ['==', ['get', 'itemId'], activeDiningZoneKey], 1, 0.78],
    }),
    [activeDiningZoneKey],
  ) as any;

  const diningZoneLineStyle = useMemo(
    () => ({
      lineColor: [
        'case',
        ['==', ['get', 'itemId'], activeDiningZoneKey],
        colors.text.primary,
        ['get', 'lineColor'],
      ],
      lineOpacity: 0.94,
      lineWidth: ['case', ['==', ['get', 'itemId'], activeDiningZoneKey], 3, 2],
    }),
    [activeDiningZoneKey],
  ) as any;

  const clusterCountExpression = ['coalesce', ['get', 'totalEvents'], ['get', 'point_count']];
  const clusterColorExpression = [
    'step',
    clusterCountExpression,
    '#90A4AE',
    2,
    '#42A5F5',
    3,
    '#26A69A',
    5,
    '#FFA726',
    7,
    '#FF5722',
    10,
    '#D32F2F',
  ];

  const eventClusterBubbleStyle = useMemo(
    () => ({
      circleColor: clusterColorExpression,
      circleRadius: ['step', clusterCountExpression, 20, 6, 24, 12, 28, 20, 32],
      circleStrokeColor: colors.brand.white,
      circleStrokeWidth: 2,
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

  const eventMarkerHaloStyle = useMemo(
    () => ({
      circleColor: ['get', 'color'],
      circleRadius: [
        'case',
        ['==', ['get', 'itemId'], activeEventGroupKey],
        ['+', ['/', ['get', 'haloSize'], 2], 2],
        ['/', ['get', 'haloSize'], 2],
      ],
      circleOpacity: ['get', 'haloOpacity'],
    }),
    [activeEventGroupKey],
  ) as any;

  const eventLivePulseStyle = useMemo(
    () => ({
      circleColor: ['get', 'color'],
      circleRadius: ['+', ['/', ['get', 'haloSize'], 2], 3 + pulsePhase * 9],
      circleOpacity: Math.max(0.06, 0.24 - pulsePhase * 0.18),
    }),
    [pulsePhase],
  ) as any;

  const eventMarkerCircleStyle = useMemo(
    () => ({
      circleColor: ['get', 'color'],
      circleRadius: ['/', ['get', 'markerSize'], 2],
      circleStrokeColor: colors.brand.white,
      circleStrokeWidth: ['case', ['==', ['get', 'itemId'], activeEventGroupKey], 3, 2],
      circleOpacity: ['get', 'markerOpacity'],
    }),
    [activeEventGroupKey],
  ) as any;

  const eventLabelStyle = useMemo(
    () => ({
      textField: ['get', 'glyph'],
      textColor: colors.brand.white,
      textSize: ['case', ['>=', ['get', 'markerSize'], 40], 13, 11],
      textFont: ['Open Sans Bold'],
      textAllowOverlap: true,
      textIgnorePlacement: true,
    }),
    [],
  ) as any;

  const eventHeatStyle = {
    heatmapRadius: ['interpolate', ['linear'], ['zoom'], 14, 28, 18, 44],
    heatmapOpacity: ['interpolate', ['linear'], ['zoom'], 14, 0.36, 17.5, 0],
    heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 14, 0.55, 18, 1.45],
    heatmapColor: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(0,0,0,0)',
      0.2,
      '#42A5F5',
      0.4,
      '#26A69A',
      0.6,
      '#FFA726',
      0.8,
      '#FF5722',
      1,
      '#D32F2F',
    ],
    heatmapWeight: ['interpolate', ['linear'], ['get', 'density'], 1, 0.3, 10, 1],
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
        {showDiningZones
          ? diningZones.map((zone) => (
              <Polygon
                key={zone.id}
                coordinates={zone.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))}
                fillColor={activeDiningZoneId === zone.id ? 'rgba(255, 210, 0, 0.28)' : zone.fillColor}
                strokeColor={activeDiningZoneId === zone.id ? colors.text.primary : zone.lineColor}
                strokeWidth={activeDiningZoneId === zone.id ? 3 : 2}
                tappable
                onPress={() => onSelectDiningZone?.(zone)}
              />
            ))
          : null}

        {showWalkingRoutes
          ? campusRoutes.map((route) => (
              <Polyline
                key={route.id}
                coordinates={route.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))}
                strokeColor={activeRouteId === route.id ? colors.text.primary : route.color}
                strokeWidth={activeRouteId === route.id ? 6 : 4}
                tappable
                onPress={() => onSelectRoute?.(route)}
              />
            ))
          : null}

        {wayfindingJourney ? (
          <Polyline
            coordinates={wayfindingJourney.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))}
            strokeColor={wayfindingJourney.color}
            strokeWidth={6}
            lineDashPattern={[10, 6]}
          />
        ) : null}

        {showBuildings
          ? buildings.map((building) => (
              <Marker
                key={building.id}
                coordinate={{ latitude: building.latitude, longitude: building.longitude }}
                pinColor={activeBuildingId === building.id ? colors.text.primary : colors.gray[700]}
                onPress={() => onSelectBuilding(building)}
                title={building.name}
                description={building.description}
              />
            ))
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
            pinColor={colors.status.info}
            title="You are here"
          />
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

      <ShapeSource id={mapSourceIds.campusBoundary} shape={boundaryShape}>
        <FillLayer id={mapLayerIds.boundaryFill} style={boundaryFillStyle} />
        <LineLayer id={mapLayerIds.boundaryLine} style={boundaryLineStyle} />
      </ShapeSource>

      <ShapeSource id={mapSourceIds.wayfinding} shape={wayfindingShape}>
        <LineLayer id={mapLayerIds.wayfindingCasing} style={wayfindingCasingStyle} />
        <LineLayer id={mapLayerIds.wayfindingLine} style={wayfindingLineStyle} />
      </ShapeSource>

      <ShapeSource
        id={mapSourceIds.routes}
        shape={routeShape}
        hitbox={{ width: 44, height: 24 }}
        onPress={(pressEvent) => {
          const routeId = getFeatureItemId(pressEvent.features[0]);
          const route = campusRoutes.find((item) => item.id === routeId);

          if (route) {
            onSelectRoute?.(route);
          }
        }}
      >
        <LineLayer id={mapLayerIds.routeCasing} style={routeCasingStyle} />
        <LineLayer id={mapLayerIds.routeLine} style={routeLineStyle} />
      </ShapeSource>

      <ShapeSource
        id={mapSourceIds.diningZones}
        shape={diningZoneShape}
        hitbox={{ width: 44, height: 44 }}
        onPress={(pressEvent) => {
          const zoneId = getFeatureItemId(pressEvent.features[0]);
          const zone = diningZones.find((item) => item.id === zoneId);

          if (zone) {
            onSelectDiningZone?.(zone);
          }
        }}
      >
        <FillLayer id={mapLayerIds.diningZoneFill} style={diningZoneFillStyle} />
        <LineLayer id={mapLayerIds.diningZoneLine} style={diningZoneLineStyle} />
      </ShapeSource>

      <ShapeSource
        id={mapSourceIds.buildings}
        shape={buildingShape}
        hitbox={{ width: 30, height: 30 }}
        onPress={(pressEvent) => {
          const buildingId = getFeatureItemId(pressEvent.features[0]);
          const building = buildings.find((item) => item.id === buildingId);

          if (building) {
            onSelectBuilding(building);
          }
        }}
      >
        <CircleLayer id={mapLayerIds.buildingHalo} style={buildingHaloStyle} />
        <CircleLayer id={mapLayerIds.buildingCircle} style={buildingCircleStyle} />
        <SymbolLayer
          id={mapLayerIds.buildingLabel}
          style={{
            textField: ['get', 'code'],
            textColor: colors.text.primary,
            textSize: 11,
            textFont: ['Open Sans Bold'],
            textAllowOverlap: true,
            textIgnorePlacement: true,
          }}
        />
      </ShapeSource>

      {showEvents ? (
        <>
          {isHeatmapMode ? (
            <ShapeSource id={mapSourceIds.eventHeat} shape={eventHeatShape}>
              <HeatmapLayer id={mapLayerIds.eventHeat} style={eventHeatStyle} />
            </ShapeSource>
          ) : null}

          <ShapeSource
            ref={clusteredEventSourceRef}
            id={mapSourceIds.eventMarkers}
            shape={eventMarkerShape}
            cluster={clusterEvents}
            clusterRadius={52}
            clusterMaxZoomLevel={16}
            clusterProperties={{
              totalEvents: ['+', ['get', 'eventCount']],
              maxDensity: ['max', ['get', 'density']],
              hasLive: ['max', ['case', ['boolean', ['get', 'isLive'], false], 1, 0]],
            }}
            hitbox={{ width: 44, height: 44 }}
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
            {clusterEvents ? (
              <>
                <CircleLayer
                  id={mapLayerIds.eventClusterBubble}
                  filter={clusterFilter}
                  style={eventClusterBubbleStyle}
                />
                <SymbolLayer
                  id={mapLayerIds.eventClusterLabel}
                  filter={clusterFilter}
                  style={eventClusterLabelStyle}
                />
              </>
            ) : (
              <></>
            )}
            <CircleLayer
              id={mapLayerIds.eventMarkerHalo}
              filter={clusterEvents ? unclusteredFilter : undefined}
              style={eventMarkerHaloStyle}
            />
            <CircleLayer
              id={mapLayerIds.eventLivePulse}
              filter={clusterEvents ? liveMarkerFilter : ['==', ['get', 'isLive'], true]}
              style={eventLivePulseStyle}
            />
            <CircleLayer
              id={mapLayerIds.eventMarkerCircle}
              filter={clusterEvents ? unclusteredFilter : undefined}
              style={eventMarkerCircleStyle}
            />
            <SymbolLayer
              id={mapLayerIds.eventMarkerLabel}
              filter={clusterEvents ? unclusteredFilter : undefined}
              style={eventLabelStyle}
            />
          </ShapeSource>
        </>
      ) : null}

      <ShapeSource id={mapSourceIds.userLocation} shape={userLocationShape}>
        <CircleLayer id={mapLayerIds.userLocationHalo} style={userLocationHaloStyle} />
        <CircleLayer id={mapLayerIds.userLocationCircle} style={userLocationCircleStyle} />
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
  wrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.secondary,
  },
});
