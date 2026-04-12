import { campusBoundingBox } from '../data/campusGeometry';

export const mapboxAccessToken =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN ?? '';

export const hasUsableMapboxToken = /^pk\./.test(mapboxAccessToken.trim());

export const campusMapStyleUrl = 'mapbox://styles/mapbox/light-v11';

// Keep the default first-view anchored on the student-facing center of campus
// even though the administrative boundary includes outlying parcels.
export const campusMapCenter: [number, number] = [-76.9426, 38.9869];

const boundsPadding = {
  longitude: 0.0012,
  latitude: 0.0009,
};

export const campusMapBounds = {
  ne: [campusBoundingBox.ne[0] + boundsPadding.longitude, campusBoundingBox.ne[1] + boundsPadding.latitude] as [number, number],
  sw: [campusBoundingBox.sw[0] - boundsPadding.longitude, campusBoundingBox.sw[1] - boundsPadding.latitude] as [number, number],
};

export const campusMapZoomRange = {
  min: 15.05,
  max: 19.4,
  default: 15.7,
};

export const mapSourceIds = {
  campusMask: 'campus-mask',
  campusBoundary: 'campus-boundary',
  routes: 'campus-routes',
  diningZones: 'campus-dining-zones',
  buildings: 'campus-buildings',
  eventMarkers: 'campus-event-markers',
  eventHeat: 'campus-event-heat',
  wayfinding: 'campus-wayfinding',
  userLocation: 'campus-user-location',
} as const;

export const mapLayerIds = {
  boundaryMask: 'campus-boundary-mask',
  boundaryFill: 'campus-boundary-fill',
  boundaryLine: 'campus-boundary-line',
  wayfindingCasing: 'campus-wayfinding-casing',
  wayfindingLine: 'campus-wayfinding-line',
  routeCasing: 'campus-route-casing',
  routeLine: 'campus-route-line',
  diningZoneFill: 'campus-dining-zone-fill',
  diningZoneLine: 'campus-dining-zone-line',
  buildingFill: 'campus-building-fill',
  buildingLine: 'campus-building-line',
  buildingLabel: 'campus-building-label',
  eventHeat: 'campus-event-heat-layer',
  eventClusterBubble: 'campus-event-cluster-bubble',
  eventClusterLabel: 'campus-event-cluster-label',
  eventMarkerShadow: 'campus-event-marker-shadow',
  eventMarkerHalo: 'campus-event-marker-halo',
  eventLivePulse: 'campus-event-live-pulse',
  eventMarkerCircle: 'campus-event-marker-circle',
  eventMarkerLabel: 'campus-event-marker-label',
  eventRsvpBadge: 'campus-event-rsvp-badge',
  eventRsvpLabel: 'campus-event-rsvp-label',
  userLocationHalo: 'campus-user-location-halo',
  userLocationCircle: 'campus-user-location-circle',
} as const;
