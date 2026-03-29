import type { Building } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';
import { colors } from '../../../shared/theme/colors';
import { campusMapBounds } from '../config/campusMapStyle';
import {
  buildingTypeMeta,
  campusRoutes,
  diningZones,
  type CampusRoute,
  type DiningZone,
} from '../data/campusOverlays';
import type { MapUserLocation, WayfindingJourney } from '../types';

export interface BuildingFeatureProperties {
  itemId: string;
  code: string;
  name: string;
  buildingType: Building['building_type'];
  color: string;
}

export interface EventFeatureProperties {
  itemId: string;
  title: string;
  locationName: string;
  category: Event['category'];
  color: string;
  glyph: string;
  isFeatured: boolean;
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

export function createEventFeatureCollection(
  events: Event[],
): PointFeatureCollection<EventFeatureProperties> {
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
          title: event.title,
          locationName: event.location_name,
          category: event.category,
          color:
            colors.eventCategory[event.category as keyof typeof colors.eventCategory] ??
            colors.primary.main,
          glyph: event.title.trim().charAt(0).toUpperCase() || 'E',
          isFeatured: event.is_featured,
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