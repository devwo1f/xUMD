import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
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

type MapFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;
type MapSourceData = GeoJSON.FeatureCollection;

interface MapboxSource {
  setData: (data: MapSourceData) => void;
  getClusterExpansionZoom?: (
    clusterId: number,
    callback?: (error: Error | null, zoom: number) => void,
  ) => Promise<number> | void;
}

interface MapboxMap {
  on: (
    event: string,
    layerOrHandler: string | ((event: any) => void),
    handler?: (event: any) => void,
  ) => void;
  remove: () => void;
  isStyleLoaded: () => boolean;
  addSource: (id: string, source: Record<string, unknown>) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  getSource: (id: string) => MapboxSource | undefined;
  getLayer: (id: string) => unknown;
  setLayoutProperty: (layerId: string, property: string, value: unknown) => void;
  setPaintProperty: (layerId: string, property: string, value: unknown) => void;
  easeTo: (options: Record<string, unknown>) => void;
  fitBounds: (bounds: [MapCoordinate, MapCoordinate], options?: Record<string, unknown>) => void;
}

interface MapboxRuntime {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => MapboxMap;
}

declare global {
  interface Window {
    mapboxgl?: MapboxRuntime;
  }
}

const MAPBOX_WEB_VERSION = '3.21.0';

const fallbackStyle = {
  version: 8,
  sources: {
    openstreetmap: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'openstreetmap',
      type: 'raster',
      source: 'openstreetmap',
    },
  ],
};

let mapboxWebLoaderPromise: Promise<MapboxRuntime> | null = null;

function ensureDocumentStylesheet(href: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const existing = document.querySelector(`link[href="${href}"]`);
  if (existing) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document is unavailable on this platform.'));
      return;
    }

    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Mapbox GL script.')),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Mapbox GL script.'));
    document.head.appendChild(script);
  });
}

async function ensureMapboxWebRuntime() {
  if (typeof window === 'undefined') {
    throw new Error('Mapbox web runtime is only available in a browser.');
  }

  if (window.mapboxgl) {
    return window.mapboxgl;
  }

  if (!mapboxWebLoaderPromise) {
    mapboxWebLoaderPromise = (async () => {
      ensureDocumentStylesheet(
        `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_WEB_VERSION}/mapbox-gl.css`,
      );
      await loadScript(
        `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_WEB_VERSION}/mapbox-gl.js`,
      );

      if (!window.mapboxgl) {
        throw new Error('Mapbox GL did not finish loading.');
      }

      return window.mapboxgl;
    })();
  }

  return mapboxWebLoaderPromise;
}

function setSourceData(map: MapboxMap, sourceId: string, data: MapSourceData) {
  const source = map.getSource(sourceId);
  source?.setData(data);
}

function setLayerVisibility(map: MapboxMap, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) {
    return;
  }

  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [styleMode, setStyleMode] = useState<'mapbox' | 'fallback'>(
    hasUsableMapboxToken ? 'mapbox' : 'fallback',
  );
  const latestStateRef = useRef({
    buildings,
    eventGroups,
    onSelectBuilding,
    onSelectEventGroup,
    onSelectRoute,
    onSelectDiningZone,
    onLongPressCoordinate,
  });

  latestStateRef.current = {
    buildings,
    eventGroups,
    onSelectBuilding,
    onSelectEventGroup,
    onSelectRoute,
    onSelectDiningZone,
    onLongPressCoordinate,
  };

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
  const densityMap = useMemo(() => new Map(Object.entries(densityByEventId)), [densityByEventId]);
  const eventMarkerShape = useMemo(
    () =>
      createEventMarkerFeatureCollection(
        showEvents ? eventGroups : [],
        isHeatmapMode ? 'heatmap' : 'category',
      ),
    [eventGroups, isHeatmapMode, showEvents],
  );
  const eventHeatShape = useMemo(
    () => createEventHeatFeatureCollection(showEvents ? events : [], densityMap),
    [densityMap, events, showEvents],
  );
  const userLocationShape = useMemo(
    () => createUserLocationFeatureCollection(userLocation ?? null),
    [userLocation],
  );
  const wayfindingShape = useMemo(
    () => createWayfindingFeatureCollection(wayfindingJourney ?? null),
    [wayfindingJourney],
  );

  useEffect(() => {
    if (!eventGroups.some((group) => group.isLive)) {
      setPulsePhase(0);
      return;
    }

    const interval = window.setInterval(() => {
      setPulsePhase((current) => (current + 0.08) % 1);
    }, 80);

    return () => window.clearInterval(interval);
  }, [eventGroups]);

  useEffect(() => {
    let cancelled = false;
    let loadTimeout: number | null = null;

    async function bootstrapMap() {
      const container = containerRef.current;
      if (!container || mapRef.current) {
        return;
      }

      const mapboxgl = await ensureMapboxWebRuntime();
      if (cancelled || !container) {
        return;
      }

      if (styleMode === 'mapbox' && hasUsableMapboxToken) {
        mapboxgl.accessToken = mapboxAccessToken;
      }

      const map = new mapboxgl.Map({
        container,
        style: styleMode === 'mapbox' ? campusMapStyleUrl : fallbackStyle,
        center: campusMapCenter,
        zoom: campusMapZoomRange.default,
        minZoom: campusMapZoomRange.min,
        maxZoom: campusMapZoomRange.max,
        maxBounds: [campusMapBounds.sw, campusMapBounds.ne],
        pitch: 0,
        dragRotate: false,
        touchPitch: true,
        attributionControl: false,
      });

      let didLoad = false;

      const activateFallback = () => {
        if (cancelled || styleMode === 'fallback') {
          return;
        }

        try {
          map.remove();
        } catch {}

        mapRef.current = null;
        setStyleMode('fallback');
      };

      if (styleMode === 'mapbox') {
        loadTimeout = window.setTimeout(() => {
          if (!didLoad) {
            activateFallback();
          }
        }, 3500);

        map.on('error', () => {
          if (!didLoad) {
            activateFallback();
          }
        });
      }

      map.on('load', () => {
        didLoad = true;
        if (loadTimeout) {
          window.clearTimeout(loadTimeout);
          loadTimeout = null;
        }
        map.addSource(mapSourceIds.campusBoundary, {
          type: 'geojson',
          data: boundaryShape,
        });
        map.addSource(mapSourceIds.wayfinding, { type: 'geojson', data: wayfindingShape });
        map.addSource(mapSourceIds.routes, { type: 'geojson', data: routeShape });
        map.addSource(mapSourceIds.diningZones, { type: 'geojson', data: diningZoneShape });
        map.addSource(mapSourceIds.buildings, { type: 'geojson', data: buildingShape });
        map.addSource(mapSourceIds.eventHeat, { type: 'geojson', data: eventHeatShape });
        map.addSource(mapSourceIds.eventMarkers, {
          type: 'geojson',
          data: eventMarkerShape,
          cluster: clusterEvents,
          clusterRadius: 52,
          clusterMaxZoom: 16,
          clusterProperties: {
            totalEvents: ['+', ['get', 'eventCount']],
            maxDensity: ['max', ['get', 'density']],
            hasLive: ['max', ['case', ['boolean', ['get', 'isLive'], false], 1, 0]],
          },
        });
        map.addSource(mapSourceIds.userLocation, {
          type: 'geojson',
          data: userLocationShape,
        });

        map.addLayer({
          id: mapLayerIds.boundaryFill,
          type: 'fill',
          source: mapSourceIds.campusBoundary,
          paint: { 'fill-color': colors.primary.main, 'fill-opacity': 0.08 },
        });
        map.addLayer({
          id: mapLayerIds.boundaryLine,
          type: 'line',
          source: mapSourceIds.campusBoundary,
          paint: {
            'line-color': colors.primary.main,
            'line-opacity': 0.4,
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        });
        map.addLayer({
          id: mapLayerIds.wayfindingCasing,
          type: 'line',
          source: mapSourceIds.wayfinding,
          paint: {
            'line-color': colors.brand.white,
            'line-width': 10,
            'line-opacity': 0.98,
          },
        });
        map.addLayer({
          id: mapLayerIds.wayfindingLine,
          type: 'line',
          source: mapSourceIds.wayfinding,
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 5,
            'line-opacity': 1,
            'line-dasharray': [1.2, 0.8],
          },
        });
        map.addLayer({
          id: mapLayerIds.diningZoneFill,
          type: 'fill',
          source: mapSourceIds.diningZones,
          paint: { 'fill-color': ['get', 'fillColor'], 'fill-opacity': 0.78 },
        });
        map.addLayer({
          id: mapLayerIds.diningZoneLine,
          type: 'line',
          source: mapSourceIds.diningZones,
          paint: {
            'line-color': ['get', 'lineColor'],
            'line-width': 2,
            'line-opacity': 0.94,
          },
        });
        map.addLayer({
          id: mapLayerIds.routeCasing,
          type: 'line',
          source: mapSourceIds.routes,
          paint: { 'line-color': colors.brand.white, 'line-width': 8, 'line-opacity': 0.92 },
        });
        map.addLayer({
          id: mapLayerIds.routeLine,
          type: 'line',
          source: mapSourceIds.routes,
          paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.98 },
        });
        map.addLayer({
          id: mapLayerIds.buildingHalo,
          type: 'circle',
          source: mapSourceIds.buildings,
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': 18,
            'circle-opacity': 0.18,
          },
        });
        map.addLayer({
          id: mapLayerIds.buildingCircle,
          type: 'circle',
          source: mapSourceIds.buildings,
          paint: {
            'circle-color': colors.brand.white,
            'circle-radius': 14,
            'circle-stroke-color': ['get', 'color'],
            'circle-stroke-width': 2,
          },
        });
        map.addLayer({
          id: mapLayerIds.buildingLabel,
          type: 'symbol',
          source: mapSourceIds.buildings,
          layout: {
            'text-field': ['get', 'code'],
            'text-size': 11,
            'text-font': ['Open Sans Bold'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: { 'text-color': colors.text.primary },
        });
        map.addLayer({
          id: mapLayerIds.eventHeat,
          type: 'heatmap',
          source: mapSourceIds.eventHeat,
          paint: {
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 14, 28, 18, 44],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.36, 17.5, 0],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 14, 0.55, 18, 1.45],
            'heatmap-color': [
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
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'density'], 1, 0.3, 10, 1],
          },
        });
        map.addLayer({
          id: mapLayerIds.eventClusterBubble,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['coalesce', ['get', 'totalEvents'], ['get', 'point_count']],
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
            ],
            'circle-radius': [
              'step',
              ['coalesce', ['get', 'totalEvents'], ['get', 'point_count']],
              20,
              6,
              24,
              12,
              28,
              20,
              32,
            ],
            'circle-stroke-color': colors.brand.white,
            'circle-stroke-width': 2,
            'circle-opacity': 0.96,
          },
        });
        map.addLayer({
          id: mapLayerIds.eventClusterLabel,
          type: 'symbol',
          source: mapSourceIds.eventMarkers,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': [
              'to-string',
              ['coalesce', ['get', 'totalEvents'], ['get', 'point_count']],
            ],
            'text-size': 12,
            'text-font': ['Open Sans Bold'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: { 'text-color': colors.brand.white },
        });
        map.addLayer({
          id: mapLayerIds.eventMarkerHalo,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: clusterEvents ? ['!', ['has', 'point_count']] : undefined,
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['/', ['get', 'haloSize'], 2],
            'circle-opacity': ['get', 'haloOpacity'],
          },
        });
        map.addLayer({
          id: mapLayerIds.eventLivePulse,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: clusterEvents
            ? ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isLive'], true]]
            : ['==', ['get', 'isLive'], true],
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['+', ['/', ['get', 'haloSize'], 2], 3],
            'circle-opacity': 0.2,
          },
        });
        map.addLayer({
          id: mapLayerIds.eventMarkerCircle,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: clusterEvents ? ['!', ['has', 'point_count']] : undefined,
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['/', ['get', 'markerSize'], 2],
            'circle-stroke-color': colors.brand.white,
            'circle-stroke-width': 2,
            'circle-opacity': ['get', 'markerOpacity'],
          },
        });
        map.addLayer({
          id: mapLayerIds.eventMarkerLabel,
          type: 'symbol',
          source: mapSourceIds.eventMarkers,
          filter: clusterEvents ? ['!', ['has', 'point_count']] : undefined,
          layout: {
            'text-field': ['get', 'glyph'],
            'text-size': ['case', ['>=', ['get', 'markerSize'], 40], 13, 11],
            'text-font': ['Open Sans Bold'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: { 'text-color': colors.brand.white },
        });
        map.addLayer({
          id: mapLayerIds.userLocationHalo,
          type: 'circle',
          source: mapSourceIds.userLocation,
          paint: {
            'circle-color': colors.status.info,
            'circle-radius': 18,
            'circle-opacity': 0.2,
          },
        });
        map.addLayer({
          id: mapLayerIds.userLocationCircle,
          type: 'circle',
          source: mapSourceIds.userLocation,
          paint: {
            'circle-color': colors.brand.white,
            'circle-radius': 8,
            'circle-stroke-color': colors.status.info,
            'circle-stroke-width': 3,
          },
        });

        [mapLayerIds.buildingHalo, mapLayerIds.buildingCircle, mapLayerIds.buildingLabel].forEach(
          (layerId) => {
            map.on('click', layerId, (layerEvent: { features?: MapFeature[] }) => {
              const buildingId = getFeatureItemId(layerEvent.features?.[0] ?? null);
              const building = latestStateRef.current.buildings.find((item) => item.id === buildingId);
              if (building) {
                latestStateRef.current.onSelectBuilding(building);
              }
            });
          },
        );

        [mapLayerIds.routeCasing, mapLayerIds.routeLine].forEach((layerId) => {
          map.on('click', layerId, (layerEvent: { features?: MapFeature[] }) => {
            const routeId = getFeatureItemId(layerEvent.features?.[0] ?? null);
            const route = campusRoutes.find((item) => item.id === routeId);
            if (route) {
              latestStateRef.current.onSelectRoute?.(route);
            }
          });
        });

        [mapLayerIds.diningZoneFill, mapLayerIds.diningZoneLine].forEach((layerId) => {
          map.on('click', layerId, (layerEvent: { features?: MapFeature[] }) => {
            const zoneId = getFeatureItemId(layerEvent.features?.[0] ?? null);
            const zone = diningZones.find((item) => item.id === zoneId);
            if (zone) {
              latestStateRef.current.onSelectDiningZone?.(zone);
            }
          });
        });

        [mapLayerIds.eventMarkerHalo, mapLayerIds.eventMarkerCircle, mapLayerIds.eventMarkerLabel].forEach(
          (layerId) => {
            map.on('click', layerId, (layerEvent: { features?: MapFeature[] }) => {
              const groupId = getFeatureItemId(layerEvent.features?.[0] ?? null);
              const group = latestStateRef.current.eventGroups.find((item) => item.id === groupId);
              if (group) {
                latestStateRef.current.onSelectEventGroup(group);
              }
            });
          },
        );

        [mapLayerIds.eventClusterBubble, mapLayerIds.eventClusterLabel].forEach((layerId) => {
          map.on('click', layerId, async (layerEvent: { features?: MapFeature[] }) => {
            const clusterFeature = layerEvent.features?.[0];
            const clusterId = Number(
              (clusterFeature?.properties as Record<string, unknown> | undefined)?.cluster_id,
            );

            if (!Number.isFinite(clusterId) || clusterFeature?.geometry.type !== 'Point') {
              return;
            }

            const source = map.getSource(mapSourceIds.eventMarkers);
            const zoom = await source?.getClusterExpansionZoom?.(clusterId);
            if (typeof zoom === 'number') {
              const [longitude, latitude] = clusterFeature.geometry.coordinates as [number, number];
              map.easeTo({
                center: [longitude, latitude],
                zoom: zoom + 0.4,
                duration: 550,
              });
            }
          });
        });

        map.on('contextmenu', (event: { lngLat: { lng: number; lat: number } }) => {
          latestStateRef.current.onLongPressCoordinate?.([event.lngLat.lng, event.lngLat.lat]);
        });
      });

      mapRef.current = map;
    }

    void bootstrapMap();

    return () => {
      cancelled = true;
      if (loadTimeout) {
        window.clearTimeout(loadTimeout);
      }
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [styleMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    setSourceData(map, mapSourceIds.routes, routeShape);
    setSourceData(map, mapSourceIds.diningZones, diningZoneShape);
    setSourceData(map, mapSourceIds.buildings, buildingShape);
    setSourceData(map, mapSourceIds.eventHeat, eventHeatShape);
    setSourceData(map, mapSourceIds.eventMarkers, eventMarkerShape);
    setSourceData(map, mapSourceIds.userLocation, userLocationShape);
    setSourceData(map, mapSourceIds.wayfinding, wayfindingShape);
  }, [
    buildingShape,
    diningZoneShape,
    eventHeatShape,
    eventMarkerShape,
    routeShape,
    userLocationShape,
    wayfindingShape,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    setLayerVisibility(map, mapLayerIds.eventHeat, isHeatmapMode);
    setLayerVisibility(map, mapLayerIds.eventClusterBubble, showEvents && clusterEvents);
    setLayerVisibility(map, mapLayerIds.eventClusterLabel, showEvents && clusterEvents);
    setLayerVisibility(map, mapLayerIds.eventMarkerHalo, showEvents);
    setLayerVisibility(map, mapLayerIds.eventLivePulse, showEvents);
    setLayerVisibility(map, mapLayerIds.eventMarkerCircle, showEvents);
    setLayerVisibility(map, mapLayerIds.eventMarkerLabel, showEvents);
    setLayerVisibility(map, mapLayerIds.buildingHalo, showBuildings);
    setLayerVisibility(map, mapLayerIds.buildingCircle, showBuildings);
    setLayerVisibility(map, mapLayerIds.buildingLabel, showBuildings);
    setLayerVisibility(map, mapLayerIds.routeCasing, showWalkingRoutes);
    setLayerVisibility(map, mapLayerIds.routeLine, showWalkingRoutes);
    setLayerVisibility(map, mapLayerIds.diningZoneFill, showDiningZones);
    setLayerVisibility(map, mapLayerIds.diningZoneLine, showDiningZones);
  }, [clusterEvents, isHeatmapMode, showBuildings, showDiningZones, showEvents, showWalkingRoutes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer(mapLayerIds.eventLivePulse)) {
      return;
    }

    map.setPaintProperty(
      mapLayerIds.eventLivePulse,
      'circle-radius',
      ['+', ['/', ['get', 'haloSize'], 2], 3 + pulsePhase * 9],
    );
    map.setPaintProperty(
      mapLayerIds.eventLivePulse,
      'circle-opacity',
      Math.max(0.06, 0.24 - pulsePhase * 0.18),
    );
  }, [pulsePhase]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    map.setPaintProperty(
      mapLayerIds.buildingHalo,
      'circle-radius',
      ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 24, 18],
    );
    map.setPaintProperty(
      mapLayerIds.buildingHalo,
      'circle-opacity',
      ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 0.28, 0.18],
    );
    map.setPaintProperty(
      mapLayerIds.buildingCircle,
      'circle-radius',
      ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 16, 14],
    );
    map.setPaintProperty(
      mapLayerIds.buildingCircle,
      'circle-stroke-width',
      ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 3, 2],
    );

    map.setPaintProperty(
      mapLayerIds.routeCasing,
      'line-width',
      ['case', ['==', ['get', 'itemId'], activeRouteId ?? '__none__'], 10, 8],
    );
    map.setPaintProperty(
      mapLayerIds.routeLine,
      'line-color',
      [
        'case',
        ['==', ['get', 'itemId'], activeRouteId ?? '__none__'],
        colors.text.primary,
        ['get', 'color'],
      ],
    );
    map.setPaintProperty(
      mapLayerIds.routeLine,
      'line-width',
      ['case', ['==', ['get', 'itemId'], activeRouteId ?? '__none__'], 5, 4],
    );

    map.setPaintProperty(
      mapLayerIds.diningZoneFill,
      'fill-opacity',
      ['case', ['==', ['get', 'itemId'], activeDiningZoneId ?? '__none__'], 1, 0.78],
    );
    map.setPaintProperty(
      mapLayerIds.diningZoneLine,
      'line-color',
      [
        'case',
        ['==', ['get', 'itemId'], activeDiningZoneId ?? '__none__'],
        colors.text.primary,
        ['get', 'lineColor'],
      ],
    );
    map.setPaintProperty(
      mapLayerIds.diningZoneLine,
      'line-width',
      ['case', ['==', ['get', 'itemId'], activeDiningZoneId ?? '__none__'], 3, 2],
    );

    map.setPaintProperty(
      mapLayerIds.eventMarkerHalo,
      'circle-radius',
      [
        'case',
        ['==', ['get', 'itemId'], activeEventGroupId ?? '__none__'],
        ['+', ['/', ['get', 'haloSize'], 2], 2],
        ['/', ['get', 'haloSize'], 2],
      ],
    );
    map.setPaintProperty(
      mapLayerIds.eventMarkerCircle,
      'circle-stroke-width',
      ['case', ['==', ['get', 'itemId'], activeEventGroupId ?? '__none__'], 3, 2],
    );
  }, [activeBuildingId, activeDiningZoneId, activeEventGroupId, activeRouteId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !focusRequest) {
      return;
    }

    if (focusRequest.bounds) {
      map.fitBounds([focusRequest.bounds.sw, focusRequest.bounds.ne], {
        padding: focusRequest.padding ?? 56,
        duration: 700,
      });
      return;
    }

    if (focusRequest.centerCoordinate) {
      map.easeTo({
        center: focusRequest.centerCoordinate,
        zoom: focusRequest.zoomLevel ?? 16.2,
        duration: 650,
      });
    }
  }, [focusRequest?.id]);

  return (
    <View style={[styles.wrapper, style]}>
      <div ref={containerRef} style={styles.mapContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.secondary,
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    minHeight: 240,
    borderRadius: borderRadius.xl,
  } as any,
});

