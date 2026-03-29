import { colors } from '../../../shared/theme/colors';

export const campusMapCenter: [number, number] = [-76.9428, 38.9876];

export const campusMapBounds = {
  ne: [-76.9325, 38.9955] as [number, number],
  sw: [-76.9535, 38.9805] as [number, number],
};

export const campusMapStyle = {
  version: 8,
  name: 'xUMD Campus',
  sources: {
    openstreetmap: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'openstreetmap',
      type: 'raster',
      source: 'openstreetmap',
    },
    {
      id: 'xumd-tint',
      type: 'background',
      paint: {
        'background-color': colors.background.primary,
        'background-opacity': 0,
      },
    },
  ],
} as const;

export const mapSourceIds = {
  campusBoundary: 'campus-boundary',
  routes: 'campus-routes',
  diningZones: 'campus-dining-zones',
  buildings: 'campus-buildings',
  eventsClustered: 'campus-events-clustered',
  eventsRaw: 'campus-events-raw',
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
  eventClusterBubble: 'campus-event-cluster-bubble',
  eventClusterLabel: 'campus-event-cluster-label',
  clusteredEventHalo: 'campus-clustered-event-halo',
  clusteredEventCircle: 'campus-clustered-event-circle',
  clusteredEventLabel: 'campus-clustered-event-label',
  rawEventHalo: 'campus-raw-event-halo',
  rawEventCircle: 'campus-raw-event-circle',
  rawEventLabel: 'campus-raw-event-label',
  userLocationHalo: 'campus-user-location-halo',
  userLocationCircle: 'campus-user-location-circle',
} as const;