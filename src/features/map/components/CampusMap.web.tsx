import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
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
const CLUSTER_FILTER = ['has', 'point_count'];
const UNCLUSTERED_FILTER = ['!', ['has', 'point_count']];
const RSVP_FILTER = ['all', UNCLUSTERED_FILTER, ['==', ['get', 'isGoing'], true]];
const PULSE_FILTER = [
  'all',
  UNCLUSTERED_FILTER,
  ['any', ['==', ['get', 'isLive'], true], ['==', ['get', 'isFeatured'], true]],
];
const WATER_FILTER = ['==', ['get', 'kind'], 'water'];
const PARKING_FILTER = ['==', ['get', 'kind'], 'parking'];
const PLAZA_FILTER = ['==', ['get', 'kind'], 'plaza'];
const LAWN_FILTER = ['==', ['get', 'kind'], 'lawn'];
const TREE_FILTER = ['==', ['get', 'kind'], 'trees'];
const SPORTS_FILTER = ['==', ['get', 'kind'], 'sports'];

const fallbackStyle = {
  version: 8,
  sources: {
    openstreetmap: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap contributors',
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
      existing.addEventListener('error', () => reject(new Error('Failed to load Mapbox GL script.')), {
        once: true,
      });
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
      await loadScript(`https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_WEB_VERSION}/mapbox-gl.js`);

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

function buildClusterDominantColorExpression() {
  const maxExpression = [
    'max',
    ['get', 'featuredCount'],
    ['get', 'socialCount'],
    ['get', 'academicCount'],
    ['get', 'sportsCount'],
    ['get', 'otherCount'],
  ];

  return [
    'case',
    ['==', ['get', 'featuredCount'], maxExpression],
    '#FFD200',
    ['==', ['get', 'socialCount'], maxExpression],
    '#E21833',
    ['==', ['get', 'academicCount'], maxExpression],
    '#1E88E5',
    ['==', ['get', 'sportsCount'], maxExpression],
    '#16A34A',
    '#607D8B',
  ];
}

function buildBuildingLabelFieldExpression(activeBuildingId?: string | null) {
  return [
    'case',
    ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'],
    ['get', 'longLabel'],
    '',
  ];
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
    onLongPressCoordinate,
  });

  latestStateRef.current = {
    buildings,
    eventGroups,
    onSelectBuilding,
    onSelectEventGroup,
    onLongPressCoordinate,
  };

  const maskShape = useMemo(() => createCampusMaskFeatureCollection(), []);
  const boundaryShape = useMemo(() => createCampusBoundaryFeatureCollection(), []);
  const landscapeAreaShape = useMemo(() => createLandscapeAreaFeatureCollection(), []);
  const landscapePathShape = useMemo(() => createLandscapePathFeatureCollection(), []);
  const buildingShape = useMemo(
    () => createBuildingFeatureCollection(showBuildings ? buildings : []),
    [buildings, showBuildings],
  );
  const weightMap = useMemo(() => new Map(Object.entries(densityByEventId)), [densityByEventId]);
  const eventMarkerShape = useMemo(
    () => createEventMarkerFeatureCollection(showEvents ? eventGroups : [], 'category'),
    [eventGroups, showEvents],
  );
  const eventHeatShape = useMemo(
    () => createEventHeatFeatureCollection(showEvents ? events : [], weightMap),
    [events, showEvents, weightMap],
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
    if (!eventGroups.some((group) => group.pulse)) {
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

        map.addSource(mapSourceIds.campusMask, {
          type: 'geojson',
          data: maskShape,
        });
        map.addSource(mapSourceIds.campusBoundary, {
          type: 'geojson',
          data: boundaryShape,
        });
        map.addSource(mapSourceIds.landscapeAreas, {
          type: 'geojson',
          data: landscapeAreaShape,
        });
        map.addSource(mapSourceIds.landscapePaths, {
          type: 'geojson',
          data: landscapePathShape,
        });
        map.addSource(mapSourceIds.wayfinding, { type: 'geojson', data: wayfindingShape });
        map.addSource(mapSourceIds.buildings, { type: 'geojson', data: buildingShape });
        map.addSource(mapSourceIds.eventHeat, { type: 'geojson', data: eventHeatShape });
        map.addSource(mapSourceIds.eventMarkers, {
          type: 'geojson',
          data: eventMarkerShape,
          cluster: clusterEvents,
          clusterRadius: 58,
          clusterMaxZoom: 16,
          clusterProperties: {
            totalEvents: ['+', ['get', 'eventCount']],
            featuredCount: ['+', ['case', ['boolean', ['get', 'isFeatured'], false], ['get', 'eventCount'], 0]],
            socialCount: ['+', ['case', ['==', ['get', 'categoryKey'], 'social'], ['get', 'eventCount'], 0]],
            academicCount: ['+', ['case', ['==', ['get', 'categoryKey'], 'academic'], ['get', 'eventCount'], 0]],
            sportsCount: ['+', ['case', ['==', ['get', 'categoryKey'], 'sports'], ['get', 'eventCount'], 0]],
            otherCount: ['+', ['case', ['==', ['get', 'categoryKey'], 'other'], ['get', 'eventCount'], 0]],
          },
        });
        map.addSource(mapSourceIds.userLocation, {
          type: 'geojson',
          data: userLocationShape,
        });

        map.addLayer({
          id: mapLayerIds.boundaryMask,
          type: 'fill',
          source: mapSourceIds.campusMask,
          paint: {
            'fill-color': campusMapPalette.mask,
            'fill-opacity': 1,
          },
        });
        map.addLayer({
          id: mapLayerIds.boundaryFill,
          type: 'fill',
          source: mapSourceIds.campusBoundary,
          paint: { 'fill-color': campusMapPalette.terrainTint, 'fill-opacity': 0 },
        });
        map.addLayer({
          id: mapLayerIds.boundaryLine,
          type: 'line',
          source: mapSourceIds.campusBoundary,
          paint: {
            'line-color': colors.primary.main,
            'line-opacity': 0,
            'line-width': 0.5,
          },
        });
        map.addLayer({
          id: mapLayerIds.landscapeWater,
          type: 'fill',
          source: mapSourceIds.landscapeAreas,
          filter: WATER_FILTER,
          paint: {
            'fill-color': campusMapPalette.water,
            'fill-opacity': 0.9,
          },
        });
        map.addLayer({
          id: mapLayerIds.landscapeParking,
          type: 'fill',
          source: mapSourceIds.landscapeAreas,
          filter: PARKING_FILTER,
          paint: {
            'fill-color': campusMapPalette.parking,
            'fill-opacity': 0.72,
          },
        });
        map.addLayer({
          id: mapLayerIds.landscapePlaza,
          type: 'fill',
          source: mapSourceIds.landscapeAreas,
          filter: PLAZA_FILTER,
          paint: {
            'fill-color': campusMapPalette.plaza,
            'fill-opacity': 0.84,
          },
        });
        map.addLayer({
          id: mapLayerIds.landscapeLawn,
          type: 'fill',
          source: mapSourceIds.landscapeAreas,
          filter: LAWN_FILTER,
          paint: {
            'fill-color': campusMapPalette.lushGreen,
            'fill-opacity': 0.48,
          },
        });
        map.addLayer({
          id: mapLayerIds.landscapeTrees,
          type: 'fill',
          source: mapSourceIds.landscapeAreas,
          filter: TREE_FILTER,
          paint: {
            'fill-color': campusMapPalette.treeGreen,
            'fill-opacity': 0.44,
          },
        });
        map.addLayer({
          id: mapLayerIds.landscapeSports,
          type: 'fill',
          source: mapSourceIds.landscapeAreas,
          filter: SPORTS_FILTER,
          paint: {
            'fill-color': campusMapPalette.sportsField,
            'fill-opacity': 0.62,
          },
        });
        map.addLayer({
          id: mapLayerIds.landscapeSportsLine,
          type: 'line',
          source: mapSourceIds.landscapeAreas,
          filter: SPORTS_FILTER,
          paint: {
            'line-color': campusMapPalette.sportsFieldLine,
            'line-opacity': 0.58,
            'line-width': 1.2,
          },
        });
        map.addLayer({
          id: mapLayerIds.landscapePath,
          type: 'line',
          source: mapSourceIds.landscapePaths,
          paint: {
            'line-color': campusMapPalette.walkingPath,
            'line-opacity': 0.92,
            'line-width': ['interpolate', ['linear'], ['zoom'], 14.5, 1, 17.5, 2.2],
            'line-dasharray': [1.4, 1.1],
          },
        });
        map.addLayer({
          id: mapLayerIds.eventHeat,
          type: 'heatmap',
          source: mapSourceIds.eventHeat,
          paint: {
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 14, 28, 16.5, 48, 19, 22],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.46, 17.6, 0.28, 19, 0.14],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 14, 0.8, 16.8, 1.35, 18.8, 1.75],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(0,0,0,0)',
              0.14,
              'rgba(255, 229, 141, 0.16)',
              0.34,
              'rgba(255, 183, 77, 0.3)',
              0.58,
              'rgba(255, 138, 80, 0.42)',
              0.8,
              'rgba(239, 91, 78, 0.5)',
              1,
              'rgba(203, 61, 49, 0.58)',
            ],
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0.5, 0.2, 6, 1],
          },
        });
        map.addLayer({
          id: mapLayerIds.buildingFill,
          type: 'fill',
          source: mapSourceIds.buildings,
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'],
              campusMapPalette.buildingActiveFill,
              ['boolean', ['get', 'isLandmark'], false],
              campusMapPalette.buildingLandmarkFill,
              campusMapPalette.buildingFill,
            ],
            'fill-opacity': ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 0.88, 0.01],
          },
        });
        map.addLayer({
          id: mapLayerIds.buildingLine,
          type: 'line',
          source: mapSourceIds.buildings,
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'],
              campusMapPalette.buildingActiveStroke,
              campusMapPalette.buildingStroke,
            ],
            'line-opacity': ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 1, 0],
            'line-width': ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 1.9, 1],
          },
        });
        map.addLayer({
          id: mapLayerIds.buildingLabel,
          type: 'symbol',
          source: mapSourceIds.buildings,
          layout: {
            'text-field': buildBuildingLabelFieldExpression(activeBuildingId),
            'text-size': 12,
            'text-font': ['Open Sans Bold'],
            'text-allow-overlap': false,
            'text-max-width': 10,
            'text-line-height': 1.05,
          },
          paint: {
            'text-color': campusMapPalette.buildingLabel,
            'text-halo-color': 'rgba(255,255,255,0.92)',
            'text-halo-width': 1.35,
          },
        });
        map.addLayer({
          id: mapLayerIds.eventClusterBubble,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: CLUSTER_FILTER,
          paint: {
            'circle-color': buildClusterDominantColorExpression(),
            'circle-radius': ['step', ['coalesce', ['get', 'totalEvents'], ['get', 'point_count']], 22, 8, 26, 16, 31, 24, 35],
            'circle-stroke-color': colors.brand.white,
            'circle-stroke-width': 3,
            'circle-opacity': 0.96,
          },
        });
        map.addLayer({
          id: mapLayerIds.eventClusterLabel,
          type: 'symbol',
          source: mapSourceIds.eventMarkers,
          filter: CLUSTER_FILTER,
          layout: {
            'text-field': ['to-string', ['coalesce', ['get', 'totalEvents'], ['get', 'point_count']]],
            'text-size': 12,
            'text-font': ['Open Sans Bold'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: { 'text-color': colors.brand.white },
        });
        map.addLayer({
          id: mapLayerIds.eventMarkerShadow,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: clusterEvents ? UNCLUSTERED_FILTER : undefined,
          paint: {
            'circle-color': 'rgba(15, 23, 42, 0.18)',
            'circle-radius': ['+', ['/', ['get', 'markerSize'], 2], 2],
            'circle-translate': [0, 4],
            'circle-blur': 0.25,
          },
        });
        map.addLayer({
          id: mapLayerIds.eventMarkerHalo,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: clusterEvents ? UNCLUSTERED_FILTER : undefined,
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['/', ['get', 'haloSize'], 2],
            'circle-opacity': ['case', ['==', ['get', 'itemId'], activeEventGroupId ?? '__none__'], 0.24, 0.14],
          },
        });
        map.addLayer({
          id: mapLayerIds.eventLivePulse,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: clusterEvents ? PULSE_FILTER : ['any', ['==', ['get', 'isLive'], true], ['==', ['get', 'isFeatured'], true]],
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['+', ['/', ['get', 'haloSize'], 2], 3],
            'circle-opacity': 0.18,
          },
        });
        map.addLayer({
          id: mapLayerIds.eventMarkerCircle,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: clusterEvents ? UNCLUSTERED_FILTER : undefined,
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['/', ['get', 'markerSize'], 2],
            'circle-stroke-color': colors.brand.white,
            'circle-stroke-width': ['case', ['==', ['get', 'itemId'], activeEventGroupId ?? '__none__'], 3.4, 2.4],
            'circle-opacity': ['get', 'markerOpacity'],
          },
        });
        map.addLayer({
          id: mapLayerIds.eventMarkerLabel,
          type: 'symbol',
          source: mapSourceIds.eventMarkers,
          filter: clusterEvents ? UNCLUSTERED_FILTER : undefined,
          layout: {
            'text-field': ['get', 'glyph'],
            'text-size': ['case', ['>=', ['get', 'markerSize'], 42], 14, 11],
            'text-font': ['Open Sans Bold'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: { 'text-color': colors.brand.white },
        });
        map.addLayer({
          id: mapLayerIds.eventRsvpBadge,
          type: 'circle',
          source: mapSourceIds.eventMarkers,
          filter: RSVP_FILTER,
          paint: {
            'circle-color': colors.brand.white,
            'circle-radius': 7,
            'circle-stroke-color': '#0F172A',
            'circle-stroke-width': 1.2,
            'circle-translate': [12, -10],
          },
        });
        map.addLayer({
          id: mapLayerIds.eventRsvpLabel,
          type: 'symbol',
          source: mapSourceIds.eventMarkers,
          filter: RSVP_FILTER,
          layout: {
            'text-field': '\u2713',
            'text-size': 10,
            'text-font': ['Open Sans Bold'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-offset': [1.15, -0.95],
          },
          paint: { 'text-color': '#0F766E' },
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

        [mapLayerIds.buildingFill, mapLayerIds.buildingLine, mapLayerIds.buildingLabel].forEach(
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

    setSourceData(map, mapSourceIds.campusMask, maskShape);
    setSourceData(map, mapSourceIds.campusBoundary, boundaryShape);
    setSourceData(map, mapSourceIds.landscapeAreas, landscapeAreaShape);
    setSourceData(map, mapSourceIds.landscapePaths, landscapePathShape);
    setSourceData(map, mapSourceIds.buildings, buildingShape);
    setSourceData(map, mapSourceIds.eventHeat, eventHeatShape);
    setSourceData(map, mapSourceIds.eventMarkers, eventMarkerShape);
    setSourceData(map, mapSourceIds.userLocation, userLocationShape);
    setSourceData(map, mapSourceIds.wayfinding, wayfindingShape);
  }, [
    boundaryShape,
    buildingShape,
    eventHeatShape,
    eventMarkerShape,
    landscapeAreaShape,
    landscapePathShape,
    maskShape,
    userLocationShape,
    wayfindingShape,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    setLayerVisibility(map, mapLayerIds.eventHeat, showActivityHeatmap && showEvents);
    setLayerVisibility(map, mapLayerIds.eventClusterBubble, showEvents && clusterEvents);
    setLayerVisibility(map, mapLayerIds.eventClusterLabel, showEvents && clusterEvents);
    setLayerVisibility(map, mapLayerIds.eventMarkerShadow, showEvents);
    setLayerVisibility(map, mapLayerIds.eventMarkerHalo, showEvents);
    setLayerVisibility(map, mapLayerIds.eventLivePulse, showEvents);
    setLayerVisibility(map, mapLayerIds.eventMarkerCircle, showEvents);
    setLayerVisibility(map, mapLayerIds.eventMarkerLabel, showEvents);
    setLayerVisibility(map, mapLayerIds.eventRsvpBadge, showEvents);
    setLayerVisibility(map, mapLayerIds.eventRsvpLabel, showEvents);
    setLayerVisibility(map, mapLayerIds.buildingFill, showBuildings);
    setLayerVisibility(map, mapLayerIds.buildingLine, showBuildings);
    setLayerVisibility(map, mapLayerIds.buildingLabel, showBuildings);
  }, [clusterEvents, showActivityHeatmap, showBuildings, showEvents]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer(mapLayerIds.eventLivePulse)) {
      return;
    }

    map.setPaintProperty(
      mapLayerIds.eventLivePulse,
      'circle-radius',
      ['+', ['/', ['get', 'haloSize'], 2], 3 + pulsePhase * 10],
    );
    map.setPaintProperty(
      mapLayerIds.eventLivePulse,
      'circle-opacity',
      Math.max(0.04, 0.2 - pulsePhase * 0.16),
    );
  }, [pulsePhase]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    map.setPaintProperty(
      mapLayerIds.buildingFill,
      'fill-color',
      [
        'case',
        ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'],
        campusMapPalette.buildingActiveFill,
        ['boolean', ['get', 'isLandmark'], false],
        campusMapPalette.buildingLandmarkFill,
        campusMapPalette.buildingFill,
      ],
    );
    map.setPaintProperty(
      mapLayerIds.buildingFill,
      'fill-opacity',
      ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 0.88, 0.01],
    );
    map.setPaintProperty(
      mapLayerIds.buildingLine,
      'line-color',
      [
        'case',
        ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'],
        campusMapPalette.buildingActiveStroke,
        campusMapPalette.buildingStroke,
      ],
    );
    map.setPaintProperty(
      mapLayerIds.buildingLine,
      'line-opacity',
      ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 1, 0],
    );
    map.setPaintProperty(
      mapLayerIds.buildingLine,
      'line-width',
      ['case', ['==', ['get', 'itemId'], activeBuildingId ?? '__none__'], 1.9, 1],
    );
    map.setLayoutProperty(
      mapLayerIds.buildingLabel,
      'text-field',
      buildBuildingLabelFieldExpression(activeBuildingId),
    );
    map.setPaintProperty(
      mapLayerIds.eventMarkerHalo,
      'circle-opacity',
      ['case', ['==', ['get', 'itemId'], activeEventGroupId ?? '__none__'], 0.24, 0.14],
    );
    map.setPaintProperty(
      mapLayerIds.eventMarkerCircle,
      'circle-stroke-width',
      ['case', ['==', ['get', 'itemId'], activeEventGroupId ?? '__none__'], 3.4, 2.4],
    );
  }, [activeBuildingId, activeEventGroupId]);

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
