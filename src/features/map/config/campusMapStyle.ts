export const mapboxAccessToken =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN ?? '';

export const hasUsableMapboxToken = /^pk\./.test(mapboxAccessToken.trim());

export const campusMapStyleUrl = 'mapbox://styles/mapbox/light-v11';

export const campusMapCenter: [number, number] = [-76.9426, 38.9869];

export const campusMapBounds = {
  ne: [-76.9330, 38.9980] as [number, number],
  sw: [-76.9560, 38.9795] as [number, number],
};

export const campusMapZoomRange = {
  min: 14,
  max: 19,
  default: 15.35,
};

export const mapSourceIds = {
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
  boundaryFill: 'campus-boundary-fill',
  boundaryLine: 'campus-boundary-line',
  wayfindingCasing: 'campus-wayfinding-casing',
  wayfindingLine: 'campus-wayfinding-line',
  routeCasing: 'campus-route-casing',
  routeLine: 'campus-route-line',
  diningZoneFill: 'campus-dining-zone-fill',
  diningZoneLine: 'campus-dining-zone-line',
  buildingHalo: 'campus-building-halo',
  buildingCircle: 'campus-building-circle',
  buildingLabel: 'campus-building-label',
  eventHeat: 'campus-event-heat-layer',
  eventClusterBubble: 'campus-event-cluster-bubble',
  eventClusterLabel: 'campus-event-cluster-label',
  eventMarkerHalo: 'campus-event-marker-halo',
  eventLivePulse: 'campus-event-live-pulse',
  eventMarkerCircle: 'campus-event-marker-circle',
  eventMarkerLabel: 'campus-event-marker-label',
  userLocationHalo: 'campus-user-location-halo',
  userLocationCircle: 'campus-user-location-circle',
} as const;
