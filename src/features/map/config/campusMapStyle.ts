import { campusBoundingBox } from '../data/campusGeometry';

export const mapboxAccessToken =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN ?? '';

export const hasUsableMapboxToken = /^pk\./.test(mapboxAccessToken.trim());

export const campusMapStyleUrl = 'mapbox://styles/mapbox/streets-v12';

export const campusMapPalette = {
  terrainBase: '#F2EDE8',
  terrainTint: 'rgba(255, 255, 255, 0)',
  lushGreen: '#A8D5A2',
  treeGreen: '#7CB87A',
  water: '#9ECAE1',
  roadLabel: '#6B6560',
  buildingFill: '#E8E4E0',
  buildingLandmarkFill: '#EDE1DE',
  buildingActiveFill: '#F1DFDB',
  buildingStroke: '#C5C0BA',
  buildingActiveStroke: '#A96A62',
  buildingLabel: '#3D3A37',
  walkingPath: '#D4D0CC',
  parking: '#E0DCD7',
  plaza: '#E9E0D8',
  sportsField: '#8EC98A',
  sportsFieldLine: 'rgba(255,255,255,0.52)',
  mask: 'rgba(17, 24, 39, 0.5)',
} as const;

export const campusMapLandmarkIds = new Set([
  'bld-001',
  'bld-002',
  'bld-003',
  'bld-005',
  'bld-007',
  'bld-008',
  'bld-013',
  'bld-014',
]);

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
  landscapeAreas: 'campus-landscape-areas',
  landscapePaths: 'campus-landscape-paths',
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
  landscapeWater: 'campus-landscape-water',
  landscapeParking: 'campus-landscape-parking',
  landscapePlaza: 'campus-landscape-plaza',
  landscapeLawn: 'campus-landscape-lawn',
  landscapeTrees: 'campus-landscape-trees',
  landscapeSports: 'campus-landscape-sports',
  landscapeSportsLine: 'campus-landscape-sports-line',
  landscapePath: 'campus-landscape-path',
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
