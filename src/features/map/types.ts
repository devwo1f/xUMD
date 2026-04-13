export type MapCoordinate = [number, number];

export type MapTimeFilter =
  | 'all'
  | 'happening_now'
  | 'next_2_hours'
  | 'today'
  | 'this_week'
  | 'custom';

export type MapSortOption = 'soonest' | 'most_popular' | 'nearest';

export type MarkerVisualMode = 'heatmap' | 'category';
export type MapMarkerCategoryKey =
  | 'career'
  | 'academic'
  | 'social'
  | 'sports'
  | 'arts'
  | 'food'
  | 'tech'
  | 'talks'
  | 'workshop'
  | 'featured'
  | 'other';

export interface MapUserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export interface MapBounds {
  ne: MapCoordinate;
  sw: MapCoordinate;
}

export interface MapFocusRequest {
  id: string;
  centerCoordinate?: MapCoordinate;
  zoomLevel?: number;
  bounds?: MapBounds;
  coordinatePoints?: MapCoordinate[];
  padding?: number;
}

export interface WayfindingJourney {
  id: string;
  destinationId: string;
  destinationType: 'building' | 'event';
  title: string;
  subtitle: string;
  startLabel: string;
  endLabel: string;
  durationMinutes: number;
  durationLabel: string;
  distanceMiles: number;
  distanceLabel: string;
  color: string;
  coordinates: MapCoordinate[];
}

export interface MapMarkerEventSummary {
  id: string;
  title: string;
  category: string;
  clubId: string | null;
  organizerName: string;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string;
  locationName: string;
  attendeeCount: number;
  interestedCount: number;
  isLive: boolean;
  isGoing: boolean;
  isFeatured: boolean;
}

export interface EventLocationGroup {
  id: string;
  locationKey: string;
  locationName: string;
  coordinate: MapCoordinate;
  events: MapMarkerEventSummary[];
  primaryCategory: string;
  categoryKey: MapMarkerCategoryKey;
  density: number;
  eventCount: number;
  isLive: boolean;
  hasRsvpdEvents: boolean;
  containsFeatured: boolean;
  pulse: boolean;
  markerColor: string;
  markerSize: number;
  markerOpacity: number;
  glyph: string;
  densityLabel: string;
  pinImageId: string;
  pinScale: number;
  badgeScale: number;
  pulseRadius: number;
  countTextSize: number;
  isMultiEvent: boolean;
}
