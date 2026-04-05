import type { Building } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';
import { campusMapBounds } from '../config/campusMapStyle';
import {
  buildingTypeMeta,
  campusRoutes,
  diningZones,
  type CampusRoute,
  type DiningZone,
} from '../data/campusOverlays';
import type {
  EventLocationGroup,
  MapCoordinate,
  MapUserLocation,
  MarkerVisualMode,
  WayfindingJourney,
} from '../types';

export interface BuildingFeatureProperties {
  itemId: string;
  code: string;
  name: string;
  buildingType: Building['building_type'];
  color: string;
}

export interface EventMarkerFeatureProperties {
  itemId: string;
  locationKey: string;
  locationName: string;
  density: number;
  densityLabel: string;
  eventCount: number;
  primaryCategory: string;
  color: string;
  glyph: string;
  markerSize: number;
  markerOpacity: number;
  haloSize: number;
  haloOpacity: number;
  isLive: boolean;
  mode: MarkerVisualMode;
}

export interface EventHeatFeatureProperties {
  itemId: string;
  density: number;
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

type PointFeatureCollection<T> = GeoJSON.FeatureCollection<GeoJSON.Point, T>;
type PolygonFeatureCollection<T> = GeoJSON.FeatureCollection<GeoJSON.Polygon, T>;
type LineFeatureCollection<T> = GeoJSON.FeatureCollection<GeoJSON.LineString, T>;

export function createBuildingFeatureCollection(
  buildings: Building[],
): PointFeatureCollection<BuildingFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: buildings.map((building) => ({
      type: 'Feature',
      id: building.id,
      geometry: {
        type: 'Point',
        coordinates: [building.longitude, building.latitude],
      },
      properties: {
        itemId: building.id,
        code: building.code,
        name: building.name,
        buildingType: building.building_type,
        color: buildingTypeMeta[building.building_type].color,
      },
    })),
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
        color: group.markerColor,
        glyph: group.glyph,
        markerSize: group.markerSize,
        markerOpacity: group.markerOpacity,
        haloSize: group.markerSize + 8,
        haloOpacity: mode === 'heatmap' ? 0.3 : 0.2,
        isLive: group.isLive,
        mode,
      },
    })),
  };
}

export function createEventHeatFeatureCollection(
  events: Event[],
  densityByEventId: Map<string, number>,
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
          density: densityByEventId.get(event.id) ?? 1,
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

export function createCampusBoundaryFeatureCollection(): PolygonFeatureCollection<{
  name: string;
}> {
  const [west, south] = campusMapBounds.sw;
  const [east, north] = campusMapBounds.ne;

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'campus-focus-zone',
        properties: {
          name: 'University of Maryland core campus',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
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
