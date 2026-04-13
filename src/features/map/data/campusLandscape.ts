import type { MapCoordinate } from '../types';

export type LandscapeAreaKind =
  | 'lawn'
  | 'trees'
  | 'parking'
  | 'water'
  | 'sports'
  | 'plaza';

export interface LandscapeArea {
  id: string;
  name: string;
  kind: LandscapeAreaKind;
  coordinates: MapCoordinate[];
}

export interface LandscapePath {
  id: string;
  name: string;
  kind: 'walk';
  coordinates: MapCoordinate[];
}

function closeRing(coordinates: MapCoordinate[]): MapCoordinate[] {
  if (coordinates.length === 0) {
    return coordinates;
  }

  const [firstLongitude, firstLatitude] = coordinates[0];
  const [lastLongitude, lastLatitude] = coordinates[coordinates.length - 1];
  if (firstLongitude === lastLongitude && firstLatitude === lastLatitude) {
    return coordinates;
  }

  return [...coordinates, coordinates[0]];
}

function area(id: string, name: string, kind: LandscapeAreaKind, coordinates: MapCoordinate[]): LandscapeArea {
  return { id, name, kind, coordinates: closeRing(coordinates) };
}

export const campusLandscapeAreas: LandscapeArea[] = [];

export const campusLandscapePaths: LandscapePath[] = [];
