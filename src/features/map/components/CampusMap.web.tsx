import React, { useEffect, useMemo, useRef } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { Building } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';
import { colors } from '../../../shared/theme/colors';
import { borderRadius } from '../../../shared/theme/spacing';
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

const boundaryFillLayer = {
  id: mapLayerIds.boundaryFill,
  type: 'fill',
  source: mapSourceIds.campusBoundary,
  paint: {
    'fill-color': colors.primary.lightest,
    'fill-opacity': 0.14,
  },
} as const;

const boundaryLineLayer = {
  id: mapLayerIds.boundaryLine,
  type: 'line',
  source: mapSourceIds.campusBoundary,
  paint: {
    'line-color': colors.primary.main,
    'line-opacity': 0.32,
    'line-width': 2,
    'line-dasharray': [2, 2],
  },
} as const;

const wayfindingCasingLayer = {
  id: mapLayerIds.wayfindingCasing,
  type: 'line',
  source: mapSourceIds.wayfinding,
  paint: {
    'line-color': colors.brand.white,
    'line-opacity': 0.98,
    'line-width': 10,
  },
} as const;

const wayfindingLineLayer = {
  id: mapLayerIds.wayfindingLine,
  type: 'line',
  source: mapSourceIds.wayfinding,
  paint: {
    'line-color': ['get', 'color'],
    'line-opacity': 1,
    'line-width': 5,
    'line-dasharray': [1.2, 0.8],
  },
} as const;

const routeCasingLayer = {
  id: mapLayerIds.routeCasing,
  type: 'line',
  source: mapSourceIds.routes,
  paint: {
    'line-color': colors.brand.white,
    'line-opacity': 0.92,
    'line-width': 8,
  },
} as const;

const routeLineLayer = {
  id: mapLayerIds.routeLine,
  type: 'line',
  source: mapSourceIds.routes,
  paint: {
    'line-color': ['get', 'color'],
    'line-opacity': 0.98,
    'line-width': 4,
  },
} as const;

const diningZoneFillLayer = {
  id: mapLayerIds.diningZoneFill,
  type: 'fill',
  source: mapSourceIds.diningZones,
  paint: {
    'fill-color': ['get', 'fillColor'],
    'fill-opacity': 0.78,
  },
} as const;

const diningZoneLineLayer = {
  id: mapLayerIds.diningZoneLine,
  type: 'line',
  source: mapSourceIds.diningZones,
  paint: {
    'line-color': ['get', 'lineColor'],
    'line-opacity': 0.94,
    'line-width': 2,
  },
} as const;

const buildingHaloLayer = {
  id: mapLayerIds.buildingHalo,
  type: 'circle',
  source: mapSourceIds.buildings,
  paint: {
    'circle-color': ['get', 'color'],
    'circle-radius': 18,
    'circle-opacity': 0.18,
  },
} as const;

const buildingCircleLayer = {
  id: mapLayerIds.buildingCircle,
  type: 'circle',
  source: mapSourceIds.buildings,
  paint: {
    'circle-color': colors.brand.white,
    'circle-radius': 14,
    'circle-stroke-color': ['get', 'color'],
    'circle-stroke-width': 2,
  },
} as const;

const buildingLabelLayer = {
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
  paint: {
    'text-color': colors.text.primary,
  },
} as const;

const eventClusterBubbleLayer = {
  id: mapLayerIds.eventClusterBubble,
  type: 'circle',
  source: mapSourceIds.eventsClustered,
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': colors.primary.main,
    'circle-radius': ['step', ['get', 'point_count'], 18, 4, 22, 8, 27, 14, 32],
    'circle-stroke-color': colors.brand.white,
    'circle-stroke-width': 2,
    'circle-opacity': 0.95,
  },
} as const;

const eventClusterLabelLayer = {
  id: mapLayerIds.eventClusterLabel,
  type: 'symbol',
  source: mapSourceIds.eventsClustered,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-size': 12,
    'text-font': ['Open Sans Bold'],
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: {
    'text-color': colors.brand.white,
  },
} as const;

const clusteredEventHaloLayer = {
  id: mapLayerIds.clusteredEventHalo,
  type: 'circle',
  source: mapSourceIds.eventsClustered,
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['get', 'isFeatured'], false],
      colors.secondary.main,
      ['get', 'color'],
    ],
    'circle-opacity': 0.2,
    'circle-radius': [
      'case',
      ['boolean', ['get', 'isFeatured'], false],
      19,
      14,
    ],
  },
} as const;

const clusteredEventCircleLayer = {
  id: mapLayerIds.clusteredEventCircle,
  type: 'circle',
  source: mapSourceIds.eventsClustered,
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': ['get', 'color'],
    'circle-radius': [
      'case',
      ['boolean', ['get', 'isFeatured'], false],
      11,
      8,
    ],
    'circle-stroke-color': colors.brand.white,
    'circle-stroke-width': 2,
    'circle-opacity': 0.96,
  },
} as const;

const clusteredEventLabelLayer = {
  id: mapLayerIds.clusteredEventLabel,
  type: 'symbol',
  source: mapSourceIds.eventsClustered,
  filter: ['!', ['has', 'point_count']],
  layout: {
    'text-field': ['get', 'glyph'],
    'text-size': 10,
    'text-font': ['Open Sans Bold'],
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: {
    'text-color': colors.brand.white,
  },
} as const;

const rawEventHaloLayer = {
  id: mapLayerIds.rawEventHalo,
  type: 'circle',
  source: mapSourceIds.eventsRaw,
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['get', 'isFeatured'], false],
      colors.secondary.main,
      ['get', 'color'],
    ],
    'circle-opacity': 0.2,
    'circle-radius': [
      'case',
      ['boolean', ['get', 'isFeatured'], false],
      19,
      14,
    ],
  },
} as const;

const rawEventCircleLayer = {
  id: mapLayerIds.rawEventCircle,
  type: 'circle',
  source: mapSourceIds.eventsRaw,
  paint: {
    'circle-color': ['get', 'color'],
    'circle-radius': [
      'case',
      ['boolean', ['get', 'isFeatured'], false],
      11,
      8,
    ],
    'circle-stroke-color': colors.brand.white,
    'circle-stroke-width': 2,
    'circle-opacity': 0.96,
  },
} as const;

const rawEventLabelLayer = {
  id: mapLayerIds.rawEventLabel,
  type: 'symbol',
  source: mapSourceIds.eventsRaw,
  layout: {
    'text-field': ['get', 'glyph'],
    'text-size': 10,
    'text-font': ['Open Sans Bold'],
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: {
    'text-color': colors.brand.white,
  },
} as const;

const userLocationHaloLayer = {
  id: mapLayerIds.userLocationHalo,
  type: 'circle',
  source: mapSourceIds.userLocation,
  paint: {
    'circle-color': colors.status.info,
    'circle-radius': 18,
    'circle-opacity': 0.2,
  },
} as const;

const userLocationCircleLayer = {
  id: mapLayerIds.userLocationCircle,
  type: 'circle',
  source: mapSourceIds.userLocation,
  paint: {
    'circle-color': colors.brand.white,
    'circle-radius': 8,
    'circle-stroke-color': colors.status.info,
    'circle-stroke-width': 3,
  },
} as const;

function setSourceData(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJSON.FeatureCollection,
) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;

  if (source) {
    source.setData(data);
  }
}

function setLayerVisibility(map: MapLibreMap, layerIds: string[], visible: boolean) {
  layerIds.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  });
}

function applySelectionHighlight(
  map: MapLibreMap,
  activeRouteId?: string | null,
  activeDiningZoneId?: string | null,
  activeBuildingId?: string | null,
  activeEventId?: string | null,
) {
  const routeKey = activeRouteId ?? '__none__';
  const zoneKey = activeDiningZoneId ?? '__none__';
  const buildingKey = activeBuildingId ?? '__none__';
  const eventKey = activeEventId ?? '__none__';

  if (map.getLayer(mapLayerIds.routeCasing)) {
    map.setPaintProperty(
      mapLayerIds.routeCasing,
      'line-width',
      ['case', ['==', ['get', 'itemId'], routeKey], 10, 8],
    );
  }

  if (map.getLayer(mapLayerIds.routeLine)) {
    map.setPaintProperty(
      mapLayerIds.routeLine,
      'line-color',
      ['case', ['==', ['get', 'itemId'], routeKey], colors.text.primary, ['get', 'color']],
    );
    map.setPaintProperty(
      mapLayerIds.routeLine,
      'line-width',
      ['case', ['==', ['get', 'itemId'], routeKey], 5, 4],
    );
  }

  if (map.getLayer(mapLayerIds.diningZoneFill)) {
    map.setPaintProperty(
      mapLayerIds.diningZoneFill,
      'fill-opacity',
      ['case', ['==', ['get', 'itemId'], zoneKey], 1, 0.78],
    );
  }

  if (map.getLayer(mapLayerIds.diningZoneLine)) {
    map.setPaintProperty(
      mapLayerIds.diningZoneLine,
      'line-color',
      ['case', ['==', ['get', 'itemId'], zoneKey], colors.text.primary, ['get', 'lineColor']],
    );
    map.setPaintProperty(
      mapLayerIds.diningZoneLine,
      'line-width',
      ['case', ['==', ['get', 'itemId'], zoneKey], 3, 2],
    );
  }

  if (map.getLayer(mapLayerIds.buildingHalo)) {
    map.setPaintProperty(
      mapLayerIds.buildingHalo,
      'circle-radius',
      ['case', ['==', ['get', 'itemId'], buildingKey], 24, 18],
    );
    map.setPaintProperty(
      mapLayerIds.buildingHalo,
      'circle-opacity',
      ['case', ['==', ['get', 'itemId'], buildingKey], 0.28, 0.18],
    );
  }

  if (map.getLayer(mapLayerIds.buildingCircle)) {
    map.setPaintProperty(
      mapLayerIds.buildingCircle,
      'circle-radius',
      ['case', ['==', ['get', 'itemId'], buildingKey], 16, 14],
    );
    map.setPaintProperty(
      mapLayerIds.buildingCircle,
      'circle-stroke-width',
      ['case', ['==', ['get', 'itemId'], buildingKey], 3, 2],
    );
  }

  const eventColorExpression = [
    'case',
    ['==', ['get', 'itemId'], eventKey],
    colors.text.primary,
    ['boolean', ['get', 'isFeatured'], false],
    colors.secondary.main,
    ['get', 'color'],
  ];
  const eventCircleColorExpression = [
    'case',
    ['==', ['get', 'itemId'], eventKey],
    colors.text.primary,
    ['get', 'color'],
  ];
  const eventHaloRadiusExpression = [
    'case',
    ['==', ['get', 'itemId'], eventKey],
    22,
    ['boolean', ['get', 'isFeatured'], false],
    19,
    14,
  ];
  const eventCircleRadiusExpression = [
    'case',
    ['==', ['get', 'itemId'], eventKey],
    12,
    ['boolean', ['get', 'isFeatured'], false],
    11,
    8,
  ];
  const eventHaloOpacityExpression = [
    'case',
    ['==', ['get', 'itemId'], eventKey],
    0.32,
    0.2,
  ];
  const eventStrokeWidthExpression = [
    'case',
    ['==', ['get', 'itemId'], eventKey],
    3,
    2,
  ];

  [mapLayerIds.clusteredEventHalo, mapLayerIds.rawEventHalo].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'circle-color', eventColorExpression as any);
      map.setPaintProperty(layerId, 'circle-radius', eventHaloRadiusExpression as any);
      map.setPaintProperty(layerId, 'circle-opacity', eventHaloOpacityExpression as any);
    }
  });

  [mapLayerIds.clusteredEventCircle, mapLayerIds.rawEventCircle].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'circle-color', eventCircleColorExpression as any);
      map.setPaintProperty(layerId, 'circle-radius', eventCircleRadiusExpression as any);
      map.setPaintProperty(layerId, 'circle-stroke-width', eventStrokeWidthExpression as any);
    }
  });
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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const latestEventsRef = useRef(events);
  const latestBuildingsRef = useRef(buildings);
  const latestEventHandlerRef = useRef(onSelectEvent);
  const latestBuildingHandlerRef = useRef(onSelectBuilding);
  const latestRouteHandlerRef = useRef(onSelectRoute);
  const latestDiningZoneHandlerRef = useRef(onSelectDiningZone);
  const latestActiveRouteIdRef = useRef(activeRouteId);
  const latestActiveDiningZoneIdRef = useRef(activeDiningZoneId);
  const latestActiveBuildingIdRef = useRef(activeBuildingId);
  const latestActiveEventIdRef = useRef(activeEventId);
  const latestRouteShapeRef = useRef(createRouteFeatureCollection(showWalkingRoutes ? campusRoutes : []));
  const latestDiningZoneShapeRef = useRef(
    createDiningZoneFeatureCollection(showDiningZones ? diningZones : []),
  );
  const latestBuildingShapeRef = useRef(createBuildingFeatureCollection(showBuildings ? buildings : []));
  const latestEventShapeRef = useRef(createEventFeatureCollection(showEvents ? events : []));
  const latestUserLocationShapeRef = useRef(createUserLocationFeatureCollection(userLocation ?? null));
  const latestWayfindingShapeRef = useRef(createWayfindingFeatureCollection(wayfindingJourney ?? null));

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

  useEffect(() => {
    latestEventsRef.current = events;
    latestBuildingsRef.current = buildings;
    latestEventHandlerRef.current = onSelectEvent;
    latestBuildingHandlerRef.current = onSelectBuilding;
    latestRouteHandlerRef.current = onSelectRoute;
    latestDiningZoneHandlerRef.current = onSelectDiningZone;
    latestActiveRouteIdRef.current = activeRouteId;
    latestActiveDiningZoneIdRef.current = activeDiningZoneId;
    latestActiveBuildingIdRef.current = activeBuildingId;
    latestActiveEventIdRef.current = activeEventId;
    latestRouteShapeRef.current = routeShape;
    latestDiningZoneShapeRef.current = diningZoneShape;
    latestBuildingShapeRef.current = buildingShape;
    latestEventShapeRef.current = eventShape;
    latestUserLocationShapeRef.current = userLocationShape;
    latestWayfindingShapeRef.current = wayfindingShape;
  }, [
    activeBuildingId,
    activeDiningZoneId,
    activeEventId,
    activeRouteId,
    buildingShape,
    buildings,
    diningZoneShape,
    eventShape,
    events,
    onSelectBuilding,
    onSelectDiningZone,
    onSelectEvent,
    onSelectRoute,
    routeShape,
    userLocationShape,
    wayfindingShape,
  ]);

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container,
      style: campusMapStyle as any,
      center: campusMapCenter,
      zoom: 15.35,
      maxBounds: [campusMapBounds.sw, campusMapBounds.ne],
      attributionControl: false,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on('load', () => {
      map.addSource(mapSourceIds.campusBoundary, {
        type: 'geojson',
        data: boundaryShape as any,
      });
      map.addSource(mapSourceIds.wayfinding, {
        type: 'geojson',
        data: latestWayfindingShapeRef.current as any,
      });
      map.addSource(mapSourceIds.routes, {
        type: 'geojson',
        data: latestRouteShapeRef.current as any,
      });
      map.addSource(mapSourceIds.diningZones, {
        type: 'geojson',
        data: latestDiningZoneShapeRef.current as any,
      });
      map.addSource(mapSourceIds.buildings, {
        type: 'geojson',
        data: latestBuildingShapeRef.current as any,
      });
      map.addSource(mapSourceIds.eventsClustered, {
        type: 'geojson',
        data: latestEventShapeRef.current as any,
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 16,
      });
      map.addSource(mapSourceIds.eventsRaw, {
        type: 'geojson',
        data: latestEventShapeRef.current as any,
      });
      map.addSource(mapSourceIds.userLocation, {
        type: 'geojson',
        data: latestUserLocationShapeRef.current as any,
      });

      map.addLayer(boundaryFillLayer as any);
      map.addLayer(boundaryLineLayer as any);
      map.addLayer(wayfindingCasingLayer as any);
      map.addLayer(wayfindingLineLayer as any);
      map.addLayer(diningZoneFillLayer as any);
      map.addLayer(diningZoneLineLayer as any);
      map.addLayer(routeCasingLayer as any);
      map.addLayer(routeLineLayer as any);
      map.addLayer(buildingHaloLayer as any);
      map.addLayer(buildingCircleLayer as any);
      map.addLayer(buildingLabelLayer as any);
      map.addLayer(eventClusterBubbleLayer as any);
      map.addLayer(eventClusterLabelLayer as any);
      map.addLayer(clusteredEventHaloLayer as any);
      map.addLayer(clusteredEventCircleLayer as any);
      map.addLayer(clusteredEventLabelLayer as any);
      map.addLayer(rawEventHaloLayer as any);
      map.addLayer(rawEventCircleLayer as any);
      map.addLayer(rawEventLabelLayer as any);
      map.addLayer(userLocationHaloLayer as any);
      map.addLayer(userLocationCircleLayer as any);

      applySelectionHighlight(
        map,
        latestActiveRouteIdRef.current,
        latestActiveDiningZoneIdRef.current,
        latestActiveBuildingIdRef.current,
        latestActiveEventIdRef.current,
      );

      const buildingLayerIds = [mapLayerIds.buildingCircle, mapLayerIds.buildingLabel];
      const routeLayerIds = [mapLayerIds.routeCasing, mapLayerIds.routeLine];
      const diningZoneLayerIds = [mapLayerIds.diningZoneFill, mapLayerIds.diningZoneLine];
      const clusteredEventLayerIds = [
        mapLayerIds.clusteredEventCircle,
        mapLayerIds.clusteredEventLabel,
      ];
      const rawEventLayerIds = [mapLayerIds.rawEventCircle, mapLayerIds.rawEventLabel];
      const clusterLayerIds = [mapLayerIds.eventClusterBubble, mapLayerIds.eventClusterLabel];

      buildingLayerIds.forEach((layerId) => {
        map.on('click', layerId, (layerEvent) => {
          const buildingId = getFeatureItemId(layerEvent.features?.[0] as GeoJSON.Feature | undefined);
          const building = latestBuildingsRef.current.find((item) => item.id === buildingId);

          if (building) {
            latestBuildingHandlerRef.current(building);
          }
        });
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      routeLayerIds.forEach((layerId) => {
        map.on('click', layerId, (layerEvent) => {
          const routeId = getFeatureItemId(layerEvent.features?.[0] as GeoJSON.Feature | undefined);
          const route = campusRoutes.find((item) => item.id === routeId);

          if (route) {
            latestRouteHandlerRef.current?.(route);
          }
        });
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      diningZoneLayerIds.forEach((layerId) => {
        map.on('click', layerId, (layerEvent) => {
          const zoneId = getFeatureItemId(layerEvent.features?.[0] as GeoJSON.Feature | undefined);
          const zone = diningZones.find((item) => item.id === zoneId);

          if (zone) {
            latestDiningZoneHandlerRef.current?.(zone);
          }
        });
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      [...clusteredEventLayerIds, ...rawEventLayerIds].forEach((layerId) => {
        map.on('click', layerId, (layerEvent) => {
          const eventId = getFeatureItemId(layerEvent.features?.[0] as GeoJSON.Feature | undefined);
          const event = latestEventsRef.current.find((item) => item.id === eventId);

          if (event) {
            latestEventHandlerRef.current(event);
          }
        });
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      clusterLayerIds.forEach((layerId) => {
        map.on('click', layerId, async (layerEvent) => {
          const clusterFeature = layerEvent.features?.[0] as GeoJSON.Feature | undefined;
          const clusterId = Number((clusterFeature?.properties as Record<string, unknown> | undefined)?.cluster_id);

          if (!Number.isFinite(clusterId) || clusterFeature?.geometry.type !== 'Point') {
            return;
          }

          const source = map.getSource(mapSourceIds.eventsClustered) as
            | (GeoJSONSource & { getClusterExpansionZoom: (clusterId: number) => Promise<number> })
            | undefined;
          const zoom = await source?.getClusterExpansionZoom(clusterId);

          if (typeof zoom === 'number') {
            const [longitude, latitude] = clusterFeature.geometry.coordinates as [number, number];
            map.easeTo({ center: [longitude, latitude], zoom: zoom + 0.35, duration: 550 });
          }
        });
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });
    });

    const handleResize = () => {
      map.resize();
    };

    window.addEventListener('resize', handleResize);
    mapRef.current = map;

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, [boundaryShape]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    setSourceData(map, mapSourceIds.routes, routeShape);
    setSourceData(map, mapSourceIds.diningZones, diningZoneShape);
    setSourceData(map, mapSourceIds.buildings, buildingShape);
    setSourceData(map, mapSourceIds.eventsClustered, eventShape);
    setSourceData(map, mapSourceIds.eventsRaw, eventShape);
    setSourceData(map, mapSourceIds.userLocation, userLocationShape);
    setSourceData(map, mapSourceIds.wayfinding, wayfindingShape);
  }, [buildingShape, diningZoneShape, eventShape, routeShape, userLocationShape, wayfindingShape]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    applySelectionHighlight(
      map,
      activeRouteId,
      activeDiningZoneId,
      activeBuildingId,
      activeEventId,
    );
  }, [activeBuildingId, activeDiningZoneId, activeEventId, activeRouteId]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    setLayerVisibility(map, [mapLayerIds.routeCasing, mapLayerIds.routeLine], showWalkingRoutes);
    setLayerVisibility(map, [mapLayerIds.diningZoneFill, mapLayerIds.diningZoneLine], showDiningZones);
    setLayerVisibility(
      map,
      [
        mapLayerIds.eventClusterBubble,
        mapLayerIds.eventClusterLabel,
        mapLayerIds.clusteredEventHalo,
        mapLayerIds.clusteredEventCircle,
        mapLayerIds.clusteredEventLabel,
      ],
      clusterEvents,
    );
    setLayerVisibility(
      map,
      [mapLayerIds.rawEventHalo, mapLayerIds.rawEventCircle, mapLayerIds.rawEventLabel],
      !clusterEvents,
    );
  }, [clusterEvents, showDiningZones, showWalkingRoutes]);

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
        zoom: focusRequest.zoomLevel ?? 16.55,
        duration: 650,
      });
    }
  }, [focusRequest?.id]);

  return (
    <View style={[styles.wrapper, style]}>
      <div ref={mapContainerRef} style={styles.mapContainer} />
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