import React, { useEffect, useMemo, useRef } from 'react';
import { NativeModules, Platform, StyleProp, UIManager, ViewStyle } from 'react-native';
import {
  Camera,
  CircleLayer,
  FillLayer,
  LineLayer,
  MapView as MapLibreMapView,
  ShapeSource,
  SymbolLayer,
  type CameraRef,
  type ShapeSourceRef,
} from '@maplibre/maplibre-react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import type { Building } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';
import { colors } from '../../../shared/theme/colors';
import EventPin from './EventPin';
import {
  campusMapBounds,
  campusMapCenter,
  campusMapStyle,
  mapLayerIds,
  mapSourceIds,
} from '../config/campusMapStyle';
import {
  campusRoutes,
  diningZones,
  type CampusRoute,
  type DiningZone,
} from '../data/campusOverlays';
import type { MapFocusRequest, MapUserLocation, WayfindingJourney } from '../types';
import {
  createBuildingFeatureCollection,
  createCampusBoundaryFeatureCollection,
  createDiningZoneFeatureCollection,
  createEventFeatureCollection,
  createRouteFeatureCollection,
  createUserLocationFeatureCollection,
  createWayfindingFeatureCollection,
  getFeatureItemId,
} from '../utils/geojson';

interface CampusMapProps {
  style?: StyleProp<ViewStyle>;
  events: Event[];
  buildings: Building[];
  showEvents: boolean;
  showBuildings: boolean;
  showWalkingRoutes?: boolean;
  showDiningZones?: boolean;
  clusterEvents?: boolean;
  activeBuildingId?: string | null;
  activeEventId?: string | null;
  activeRouteId?: string | null;
  activeDiningZoneId?: string | null;
  userLocation?: MapUserLocation | null;
  focusRequest?: MapFocusRequest | null;
  wayfindingJourney?: WayfindingJourney | null;
  onSelectEvent: (event: Event) => void;
  onSelectBuilding: (building: Building) => void;
  onSelectRoute?: (route: CampusRoute) => void;
  onSelectDiningZone?: (zone: DiningZone) => void;
}

const canRenderNativeMapLibre = Boolean(
  Platform.OS !== 'web' &&
    (UIManager.getViewManagerConfig?.('MLRNMapView') ||
      UIManager.getViewManagerConfig?.('MLRNAndroidTextureMapView') ||
      (NativeModules as Record<string, unknown>).MLRNModule),
);

const clusterFilter = ['has', 'point_count'] as any;
const unclusteredFilter = ['!', ['has', 'point_count']] as any;

const boundaryFillStyle = {
  fillColor: colors.primary.lightest,
  fillOpacity: 0.12,
} as any;

const boundaryLineStyle = {
  lineColor: colors.primary.main,
  lineOpacity: 0.32,
  lineWidth: 2,
  lineDasharray: [1.5, 1.2],
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

const eventClusterBubbleStyle = {
  circleColor: colors.primary.main,
  circleRadius: ['step', ['get', 'point_count'], 18, 4, 22, 8, 27, 14, 32],
  circleStrokeColor: colors.brand.white,
  circleStrokeWidth: 2,
  circleOpacity: 0.95,
} as any;

const eventClusterLabelStyle = {
  textField: ['get', 'point_count_abbreviated'],
  textColor: colors.brand.white,
  textSize: 12,
  textFont: ['Open Sans Bold'],
  textAllowOverlap: true,
  textIgnorePlacement: true,
} as any;

const buildingLabelStyle = {
  textField: ['get', 'code'],
  textColor: colors.text.primary,
  textSize: 11,
  textFont: ['Open Sans Bold'],
  textAllowOverlap: true,
  textIgnorePlacement: true,
} as any;

const eventLabelStyle = {
  textField: ['get', 'glyph'],
  textColor: colors.brand.white,
  textSize: 10,
  textFont: ['Open Sans Bold'],
  textAllowOverlap: true,
  textIgnorePlacement: true,
} as any;

function regionFromCenter(longitude: number, latitude: number) {
  return {
    latitude,
    longitude,
    latitudeDelta: 0.0065,
    longitudeDelta: 0.0065,
  };
}

export default function CampusMap({
  style,
  events,
  buildings,
  showEvents,
  showBuildings,
  showWalkingRoutes = true,
  showDiningZones = true,
  clusterEvents = true,
  activeBuildingId,
  activeEventId,
  activeRouteId,
  activeDiningZoneId,
  userLocation,
  focusRequest,
  wayfindingJourney,
  onSelectEvent,
  onSelectBuilding,
  onSelectRoute,
  onSelectDiningZone,
}: CampusMapProps) {
  const mapViewRef = useRef<MapView | null>(null);
  const cameraRef = useRef<CameraRef>(null);
  const clusteredEventSourceRef = useRef<ShapeSourceRef>(null);

  const activeRouteKey = activeRouteId ?? '';
  const activeDiningZoneKey = activeDiningZoneId ?? '';
  const activeBuildingKey = activeBuildingId ?? '';
  const activeEventKey = activeEventId ?? '';

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
  const eventShape = useMemo(
    () => createEventFeatureCollection(showEvents ? events : []),
    [events, showEvents],
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

  const eventHaloStyle = useMemo(
    () => ({
      circleColor: [
        'case',
        ['==', ['get', 'itemId'], activeEventKey],
        colors.text.primary,
        ['boolean', ['get', 'isFeatured'], false],
        colors.secondary.main,
        ['get', 'color'],
      ],
      circleOpacity: ['case', ['==', ['get', 'itemId'], activeEventKey], 0.32, 0.2],
      circleRadius: [
        'case',
        ['==', ['get', 'itemId'], activeEventKey],
        22,
        ['boolean', ['get', 'isFeatured'], false],
        19,
        14,
      ],
    }),
    [activeEventKey],
  ) as any;

  const eventCircleStyle = useMemo(
    () => ({
      circleColor: [
        'case',
        ['==', ['get', 'itemId'], activeEventKey],
        colors.text.primary,
        ['get', 'color'],
      ],
      circleRadius: [
        'case',
        ['==', ['get', 'itemId'], activeEventKey],
        12,
        ['boolean', ['get', 'isFeatured'], false],
        11,
        8,
      ],
      circleStrokeColor: colors.brand.white,
      circleStrokeWidth: ['case', ['==', ['get', 'itemId'], activeEventKey], 3, 2],
      circleOpacity: 0.96,
    }),
    [activeEventKey],
  ) as any;

  useEffect(() => {
    if (canRenderNativeMapLibre || !focusRequest) {
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
    if (!canRenderNativeMapLibre || !focusRequest) {
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
        zoomLevel: focusRequest.zoomLevel ?? 16.55,
        animationDuration: 650,
      });
    }
  }, [focusRequest?.id]);

  if (!canRenderNativeMapLibre) {
    return (
      <MapView
        ref={mapViewRef}
        style={style}
        initialRegion={regionFromCenter(campusMapCenter[0], campusMapCenter[1])}
        showsUserLocation
        showsCompass
      >
        {showDiningZones
          ? diningZones.map((zone) => (
              <Polygon
                key={zone.id}
                coordinates={zone.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))}
                fillColor={
                  activeDiningZoneId === zone.id ? 'rgba(255, 210, 0, 0.28)' : zone.fillColor
                }
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
                coordinate={{
                  latitude: building.latitude,
                  longitude: building.longitude,
                }}
                pinColor={activeBuildingId === building.id ? colors.text.primary : colors.gray[700]}
                onPress={() => onSelectBuilding(building)}
                title={building.name}
                description={building.description}
              />
            ))
          : null}

        {showEvents
          ? events.map((event) => (
              <EventPin
                key={event.id}
                event={event}
                onPress={onSelectEvent}
                isFeatured={event.is_featured || activeEventId === event.id}
              />
            ))
          : null}

        {userLocation ? (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            pinColor={colors.status.info}
            title="You are here"
          />
        ) : null}
      </MapView>
    );
  }

  return (
    <MapLibreMapView
      style={style}
      mapStyle={campusMapStyle}
      compassEnabled
      rotateEnabled={false}
      pitchEnabled={false}
      attributionEnabled={false}
      logoEnabled={false}
      localizeLabels
    >
      <Camera
        ref={cameraRef}
        defaultSettings={{
          centerCoordinate: campusMapCenter,
          zoomLevel: 15.35,
        }}
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

      <ShapeSource id={mapSourceIds.routes} shape={routeShape} hitbox={{ width: 44, height: 24 }} onPress={(pressEvent) => {
        const routeId = getFeatureItemId(pressEvent.features[0]);
        const route = campusRoutes.find((item) => item.id === routeId);

        if (route) {
          onSelectRoute?.(route);
        }
      }}>
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
        <SymbolLayer id={mapLayerIds.buildingLabel} style={buildingLabelStyle} />
      </ShapeSource>

      {clusterEvents ? (
        <ShapeSource
          ref={clusteredEventSourceRef}
          id={mapSourceIds.eventsClustered}
          shape={eventShape}
          cluster
          clusterRadius={42}
          clusterMaxZoomLevel={16}
          hitbox={{ width: 34, height: 34 }}
          onPress={async (pressEvent) => {
            const feature = pressEvent.features[0];
            const properties = feature?.properties as Record<string, unknown> | undefined;

            if (properties?.cluster && feature?.geometry.type === 'Point') {
              const zoomLevel = await clusteredEventSourceRef.current?.getClusterExpansionZoom(feature);
              const [longitude, latitude] = feature.geometry.coordinates as [number, number];

              if (typeof zoomLevel === 'number') {
                cameraRef.current?.setCamera({
                  centerCoordinate: [longitude, latitude],
                  zoomLevel: zoomLevel + 0.35,
                  animationDuration: 550,
                });
              }
              return;
            }

            const eventId = getFeatureItemId(feature);
            const event = events.find((item) => item.id === eventId);

            if (event) {
              onSelectEvent(event);
            }
          }}
        >
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
          <CircleLayer
            id={mapLayerIds.clusteredEventHalo}
            filter={unclusteredFilter}
            style={eventHaloStyle}
          />
          <CircleLayer
            id={mapLayerIds.clusteredEventCircle}
            filter={unclusteredFilter}
            style={eventCircleStyle}
          />
          <SymbolLayer
            id={mapLayerIds.clusteredEventLabel}
            filter={unclusteredFilter}
            style={eventLabelStyle}
          />
        </ShapeSource>
      ) : (
        <ShapeSource
          id={mapSourceIds.eventsRaw}
          shape={eventShape}
          hitbox={{ width: 30, height: 30 }}
          onPress={(pressEvent) => {
            const eventId = getFeatureItemId(pressEvent.features[0]);
            const event = events.find((item) => item.id === eventId);

            if (event) {
              onSelectEvent(event);
            }
          }}
        >
          <CircleLayer id={mapLayerIds.rawEventHalo} style={eventHaloStyle} />
          <CircleLayer id={mapLayerIds.rawEventCircle} style={eventCircleStyle} />
          <SymbolLayer id={mapLayerIds.rawEventLabel} style={eventLabelStyle} />
        </ShapeSource>
      )}

      <ShapeSource id={mapSourceIds.userLocation} shape={userLocationShape}>
        <CircleLayer id={mapLayerIds.userLocationHalo} style={userLocationHaloStyle} />
        <CircleLayer id={mapLayerIds.userLocationCircle} style={userLocationCircleStyle} />
      </ShapeSource>
    </MapLibreMapView>
  );
}