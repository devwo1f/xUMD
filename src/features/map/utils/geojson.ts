import type { Building } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';
import {
  buildingTypeMeta,
  campusRoutes,
  diningZones,
  type CampusRoute,
  type DiningZone,
} from '../data/campusOverlays';
import {
  campusLandscapeAreas,
  campusLandscapePaths,
  type LandscapeArea,
  type LandscapeAreaKind,
  type LandscapePath,
} from '../data/campusLandscape';
import {
  buildingDirectoryProfiles,
  buildingFootprints,
  campusBoundaryPolygons,
  campusMaskHoles,
  campusMaskOuterRing,
} from '../data/campusGeometry';
import type {
  EventLocationGroup,
  MapCoordinate,
  MapMarkerCategoryKey,
  MapUserLocation,
  MarkerVisualMode,
  WayfindingJourney,
} from '../types';

export interface BuildingFeatureProperties {
  itemId: string;
  code: string;
  name: string;
  shortLabel: string;
  longLabel: string;
  buildingType: Building['building_type'];
  color: string;
  hoursLabel: string;
  address: string;
  isLandmark: boolean;
  heightMeters: number;
}

export interface EventMarkerFeatureProperties {
  itemId: string;
  locationKey: string;
  locationName: string;
  density: number;
  densityLabel: string;
  eventCount: number;
  primaryCategory: string;
  categoryKey: MapMarkerCategoryKey;
  color: string;
  glyph: string;
  markerSize: number;
  markerOpacity: number;
  haloSize: number;
  haloOpacity: number;
  pinImageId: string;
  pinScale: number;
  badgeScale: number;
  pulseRadius: number;
  countTextSize: number;
  isMultiEvent: boolean;
  isLive: boolean;
  isFeatured: boolean;
  isGoing: boolean;
  mode: MarkerVisualMode;
}

export interface EventHeatFeatureProperties {
  itemId: string;
  density: number;
  weight: number;
  category: Event['category'];
}

export interface RouteFeatureProperties {
  itemId: string;
  name: string;
  description: string;
  duration: string;
  color: string;
}

export interface ZoneFeatureProperties {
  itemId: string;
  name: string;
  description: string;
  fillColor: string;
  lineColor: string;
}

export interface JourneyFeatureProperties {
  itemId: string;
  title: string;
  color: string;
}

export interface UserLocationFeatureProperties {
  itemId: string;
  accuracy: number;
}

export interface LandscapeAreaFeatureProperties {
  itemId: string;
  name: string;
  kind: LandscapeAreaKind;
}

export interface LandscapePathFeatureProperties {
  itemId: string;
  name: string;
  kind: LandscapePath['kind'];
}

type PointFeatureCollection<T> = GeoJSON.FeatureCollection<GeoJSON.Point, T>;
type PolygonFeatureCollection<T> = GeoJSON.FeatureCollection<GeoJSON.Polygon, T>;
type AreaFeatureCollection<T> = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, T>;
type LineFeatureCollection<T> = GeoJSON.FeatureCollection<GeoJSON.LineString, T>;

function estimateBuildingHeight(building: Building, isLandmark: boolean) {
  const baseHeightByType: Record<Building['building_type'], number> = {
    library: 22,
    student_center: 20,
    academic: 18,
    engineering: 24,
    athletics: 28,
    dining: 14,
    recreation: 18,
    performing_arts: 20,
  };

  const baseHeight = baseHeightByType[building.building_type] ?? 18;
  return isLandmark ? baseHeight + 8 : baseHeight;
}

export function createBuildingFeatureCollection(
  buildings: Building[],
): PolygonFeatureCollection<BuildingFeatureProperties> {
  const features: Array<GeoJSON.Feature<GeoJSON.Polygon, BuildingFeatureProperties>> = [];

  buildings.forEach((building) => {
    const coordinates = buildingFootprints[building.id];
    if (!coordinates || coordinates.length < 4) {
      return;
    }

    const profile = buildingDirectoryProfiles[building.id];
    const isLandmark = ['bld-001', 'bld-002', 'bld-003', 'bld-005', 'bld-007', 'bld-008', 'bld-013', 'bld-014'].includes(
      building.id,
    );

    features.push({
      type: 'Feature',
      id: building.id,
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
      properties: {
        itemId: building.id,
        code: building.code,
        name: building.name,
        shortLabel: building.code,
        longLabel: building.name,
        buildingType: building.building_type,
        color: buildingTypeMeta[building.building_type].color,
        hoursLabel: profile?.hoursLabel ?? 'Hours vary',
        address: profile?.address ?? '',
        isLandmark,
        heightMeters: estimateBuildingHeight(building, isLandmark),
      },
    });
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

function createLandscapeAreaFeature(
  area: LandscapeArea,
): GeoJSON.Feature<GeoJSON.Polygon, LandscapeAreaFeatureProperties> {
  return {
    type: 'Feature',
    id: area.id,
    properties: {
      itemId: area.id,
      name: area.name,
      kind: area.kind,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [area.coordinates],
    },
  };
}

function createLandscapePathFeature(
  path: LandscapePath,
): GeoJSON.Feature<GeoJSON.LineString, LandscapePathFeatureProperties> {
  return {
    type: 'Feature',
    id: path.id,
    properties: {
      itemId: path.id,
      name: path.name,
      kind: path.kind,
    },
    geometry: {
      type: 'LineString',
      coordinates: path.coordinates,
    },
  };
}

export function createLandscapeAreaFeatureCollection(
  areas: LandscapeArea[] = campusLandscapeAreas,
): PolygonFeatureCollection<LandscapeAreaFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: areas.map(createLandscapeAreaFeature),
  };
}

export function createLandscapePathFeatureCollection(
  paths: LandscapePath[] = campusLandscapePaths,
): LineFeatureCollection<LandscapePathFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: paths.map(createLandscapePathFeature),
  };
}

export function createEventMarkerFeatureCollection(
  groups: EventLocationGroup[],
  mode: MarkerVisualMode,
): PointFeatureCollection<EventMarkerFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: groups.map((group) => ({
      type: 'Feature',
      id: group.id,
      geometry: {
        type: 'Point',
        coordinates: group.coordinate,
      },
      properties: {
        itemId: group.id,
        locationKey: group.locationKey,
        locationName: group.locationName,
        density: group.density,
        densityLabel: group.densityLabel,
        eventCount: group.eventCount,
        primaryCategory: group.primaryCategory,
        categoryKey: group.categoryKey,
        color: group.markerColor,
        glyph: group.glyph,
        markerSize: group.markerSize,
        markerOpacity: group.markerOpacity,
        haloSize: group.markerSize + 10,
        haloOpacity: mode === 'heatmap' ? 0.34 : 0.22,
        pinImageId: group.pinImageId,
        pinScale: group.pinScale,
        badgeScale: group.badgeScale,
        pulseRadius: group.pulseRadius,
        countTextSize: group.countTextSize,
        isMultiEvent: group.isMultiEvent,
        isLive: group.isLive,
        isFeatured: group.containsFeatured,
        isGoing: group.hasRsvpdEvents,
        mode,
      },
    })),
  };
}

export function createEventHeatFeatureCollection(
  events: Event[],
  weightByEventId: Map<string, number>,
): PointFeatureCollection<EventHeatFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: events
      .filter((event) => event.latitude !== null && event.longitude !== null)
      .map((event) => ({
        type: 'Feature',
        id: event.id,
        geometry: {
          type: 'Point',
          coordinates: [event.longitude as number, event.latitude as number],
        },
        properties: {
          itemId: event.id,
          density: weightByEventId.get(event.id) ?? 1,
          weight: weightByEventId.get(event.id) ?? 1,
          category: event.category,
        },
      })),
  };
}

function createRouteFeature(route: CampusRoute): GeoJSON.Feature<GeoJSON.LineString, RouteFeatureProperties> {
  return {
    type: 'Feature',
    id: route.id,
    properties: {
      itemId: route.id,
      name: route.name,
      description: route.description,
      duration: route.duration,
      color: route.color,
    },
    geometry: {
      type: 'LineString',
      coordinates: route.coordinates,
    },
  };
}

function createZoneFeature(zone: DiningZone): GeoJSON.Feature<GeoJSON.Polygon, ZoneFeatureProperties> {
  return {
    type: 'Feature',
    id: zone.id,
    properties: {
      itemId: zone.id,
      name: zone.name,
      description: zone.description,
      fillColor: zone.fillColor,
      lineColor: zone.lineColor,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [zone.coordinates],
    },
  };
}

export function createRouteFeatureCollection(
  routes: CampusRoute[] = campusRoutes,
): LineFeatureCollection<RouteFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: routes.map(createRouteFeature),
  };
}

export function createDiningZoneFeatureCollection(
  zones: DiningZone[] = diningZones,
): PolygonFeatureCollection<ZoneFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: zones.map(createZoneFeature),
  };
}

export function createWayfindingFeatureCollection(
  journey: WayfindingJourney | null = null,
): LineFeatureCollection<JourneyFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: journey
      ? [
          {
            type: 'Feature',
            id: journey.id,
            properties: {
              itemId: journey.id,
              title: journey.title,
              color: journey.color,
            },
            geometry: {
              type: 'LineString',
              coordinates: journey.coordinates,
            },
          },
        ]
      : [],
  };
}

export function createUserLocationFeatureCollection(
  userLocation: MapUserLocation | null = null,
): PointFeatureCollection<UserLocationFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: userLocation
      ? [
          {
            type: 'Feature',
            id: 'current-user-location',
            properties: {
              itemId: 'current-user-location',
              accuracy: userLocation.accuracy ?? 0,
            },
            geometry: {
              type: 'Point',
              coordinates: [userLocation.longitude, userLocation.latitude],
            },
          },
        ]
      : [],
  };
}

export function createCampusBoundaryFeatureCollection(): AreaFeatureCollection<{
  name: string;
}> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'umd-campus-boundary',
        properties: { name: 'University of Maryland campus boundary' },
        geometry: {
          type: 'MultiPolygon',
          coordinates: campusBoundaryPolygons,
        },
      },
    ],
  };
}

export function createCampusMaskFeatureCollection(): PolygonFeatureCollection<{
  name: string;
}> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'umd-campus-mask',
        properties: { name: 'UMD campus focus mask' },
        geometry: {
          type: 'Polygon',
          coordinates: [campusMaskOuterRing, ...campusMaskHoles],
        },
      },
    ],
  };
}

export function getFeatureItemId(feature?: GeoJSON.Feature | null) {
  const properties = feature?.properties as Record<string, unknown> | null | undefined;
  const itemId = properties?.itemId;
  return typeof itemId === 'string' ? itemId : null;
}

export function toCoordinateTuple(feature?: GeoJSON.Feature | null): MapCoordinate | null {
  if (!feature || feature.geometry.type !== 'Point') {
    return null;
  }

  const [longitude, latitude] = feature.geometry.coordinates as [number, number];
  return [longitude, latitude];
}
