export type MapCoordinate = [number, number];

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