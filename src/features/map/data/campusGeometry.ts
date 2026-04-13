import { buildings } from '../../../assets/data/buildings';
import type { MapBounds, MapCoordinate } from '../types';
import { umdAdministrativeBoundaryPolygons } from './umdAdministrativeBoundary';

export interface BuildingAccessibilityProfile {
  wheelchair: boolean;
  elevator: boolean;
  automaticDoors?: boolean;
}

export interface BuildingDirectoryProfile {
  departments: string[];
  hoursLabel: string;
  accessibility: BuildingAccessibilityProfile;
  address?: string;
}

const buildingById = new Map(buildings.map((building) => [building.id, building]));

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

function closePolygonRings(polygons: MapCoordinate[][][]): MapCoordinate[][][] {
  return polygons.map((polygon) => polygon.map((ring) => closeRing(ring)));
}

function buildFootprint(
  id: string,
  halfLongitude: number,
  halfLatitude: number,
  skewLongitude = 0,
  skewLatitude = 0,
): MapCoordinate[] {
  const building = buildingById.get(id);
  if (!building) {
    return [];
  }

  const { longitude, latitude } = building;

  return closeRing([
    [longitude - halfLongitude + skewLongitude, latitude - halfLatitude],
    [longitude + halfLongitude, latitude - halfLatitude + skewLatitude],
    [longitude + halfLongitude - skewLongitude, latitude + halfLatitude],
    [longitude - halfLongitude, latitude + halfLatitude - skewLatitude],
  ]);
}

function buildCustomFootprint(id: string, offsets: MapCoordinate[]): MapCoordinate[] {
  const building = buildingById.get(id);
  if (!building) {
    return [];
  }

  return closeRing(
    offsets.map(([longitudeOffset, latitudeOffset]) => [
      building.longitude + longitudeOffset,
      building.latitude + latitudeOffset,
    ]),
  );
}

function buildOvalFootprint(
  id: string,
  radiusLongitude: number,
  radiusLatitude: number,
  pointCount = 18,
): MapCoordinate[] {
  const building = buildingById.get(id);
  if (!building) {
    return [];
  }

  const coordinates: MapCoordinate[] = [];
  for (let index = 0; index < pointCount; index += 1) {
    const theta = (Math.PI * 2 * index) / pointCount;
    coordinates.push([
      building.longitude + Math.cos(theta) * radiusLongitude,
      building.latitude + Math.sin(theta) * radiusLatitude,
    ]);
  }

  return closeRing(coordinates);
}

function getBounds(points: MapCoordinate[]): MapBounds {
  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);

  return {
    sw: [Math.min(...longitudes), Math.min(...latitudes)],
    ne: [Math.max(...longitudes), Math.max(...latitudes)],
  };
}

export const campusBoundaryPolygons: MapCoordinate[][][] = closePolygonRings(
  umdAdministrativeBoundaryPolygons,
);

export const campusMaskHoles: MapCoordinate[][] = campusBoundaryPolygons
  .map((polygon) => polygon[0])
  .filter((ring): ring is MapCoordinate[] => Array.isArray(ring) && ring.length >= 4);

export const campusPerimeter: MapCoordinate[] = campusMaskHoles[0] ?? [];

export const campusMaskOuterRing: MapCoordinate[] = closeRing([
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
]);

export const campusBoundingBox = getBounds(campusBoundaryPolygons.flat(2));

export const buildingFootprints: Record<string, MapCoordinate[]> = {
  'bld-001': buildCustomFootprint('bld-001', [
    [-0.00052, -0.00029],
    [0.00048, -0.00029],
    [0.00048, 0.00012],
    [0.00014, 0.00012],
    [0.00014, 0.00028],
    [-0.00016, 0.00028],
    [-0.00016, 0.00012],
    [-0.00052, 0.00012],
  ]),
  'bld-002': buildCustomFootprint('bld-002', [
    [-0.00056, -0.00028],
    [0.00056, -0.00028],
    [0.00056, -0.00002],
    [0.0002, -0.00002],
    [0.0002, 0.0003],
    [-0.00018, 0.0003],
    [-0.00018, 0.00002],
    [-0.00056, 0.00002],
  ]),
  'bld-003': buildCustomFootprint('bld-003', [
    [-0.00031, -0.00022],
    [0.00029, -0.00022],
    [0.00029, 0.00002],
    [0.00008, 0.00002],
    [0.00008, 0.00022],
    [-0.00031, 0.00022],
  ]),
  'bld-004': buildCustomFootprint('bld-004', [
    [-0.00041, -0.00025],
    [0.00038, -0.00025],
    [0.00038, -0.00002],
    [0.00014, -0.00002],
    [0.00014, 0.00024],
    [-0.0001, 0.00024],
    [-0.0001, 0.00006],
    [-0.00041, 0.00006],
  ]),
  'bld-005': buildCustomFootprint('bld-005', [
    [-0.00051, -0.00025],
    [0.00049, -0.00025],
    [0.00049, -0.00002],
    [0.00018, -0.00002],
    [0.00018, 0.00025],
    [-0.00018, 0.00025],
    [-0.00018, 0.00005],
    [-0.00051, 0.00005],
  ]),
  'bld-006': buildCustomFootprint('bld-006', [
    [-0.0003, -0.00019],
    [0.00028, -0.00019],
    [0.00028, -0.00001],
    [0.00008, -0.00001],
    [0.00008, 0.00018],
    [-0.0003, 0.00018],
  ]),
  'bld-007': buildOvalFootprint('bld-007', 0.00072, 0.00046, 22),
  'bld-008': buildOvalFootprint('bld-008', 0.00088, 0.0005, 26),
  'bld-009': buildCustomFootprint('bld-009', [
    [-0.00068, -0.00028],
    [0.00062, -0.00028],
    [0.00062, 0.00004],
    [0.00022, 0.00004],
    [0.00022, 0.0003],
    [-0.00022, 0.0003],
    [-0.00022, 0.00004],
    [-0.00068, 0.00004],
  ]),
  'bld-010': buildCustomFootprint('bld-010', [
    [-0.00052, -0.00024],
    [0.00049, -0.00024],
    [0.00049, 0.00012],
    [0.00016, 0.00012],
    [0.00016, 0.00024],
    [-0.00018, 0.00024],
    [-0.00018, 0.00012],
    [-0.00052, 0.00012],
  ]),
  'bld-011': buildCustomFootprint('bld-011', [
    [-0.00036, -0.0002],
    [0.00034, -0.0002],
    [0.00034, 0.00004],
    [0.00008, 0.00004],
    [0.00008, 0.0002],
    [-0.00036, 0.0002],
  ]),
  'bld-012': buildCustomFootprint('bld-012', [
    [-0.00058, -0.00028],
    [0.00056, -0.00028],
    [0.00056, 0.00003],
    [0.00022, 0.00003],
    [0.00022, 0.00028],
    [-0.00018, 0.00028],
    [-0.00018, 0.0001],
    [-0.00058, 0.0001],
  ]),
  'bld-013': buildCustomFootprint('bld-013', [
    [-0.00073, -0.00038],
    [0.00074, -0.00038],
    [0.00074, -0.00006],
    [0.00026, -0.00006],
    [0.00026, 0.00042],
    [-0.00024, 0.00042],
    [-0.00024, -0.00002],
    [-0.00073, -0.00002],
  ]),
  'bld-014': buildCustomFootprint('bld-014', [
    [-0.00056, -0.0003],
    [0.00054, -0.0003],
    [0.00054, 0.00012],
    [0.00018, 0.00012],
    [0.00018, 0.0003],
    [-0.00018, 0.0003],
    [-0.00018, 0.00012],
    [-0.00056, 0.00012],
  ]),
  'bld-015': buildCustomFootprint('bld-015', [
    [-0.00049, -0.00022],
    [0.00045, -0.00022],
    [0.00045, 0.00008],
    [0.00014, 0.00008],
    [0.00014, 0.00022],
    [-0.00016, 0.00022],
    [-0.00016, 0.00008],
    [-0.00049, 0.00008],
  ]),
};

export const buildingDirectoryProfiles: Record<string, BuildingDirectoryProfile> = {
  'bld-001': {
    departments: ['Libraries Administration', 'Research Services', 'Learning Commons'],
    hoursLabel: 'Open daily - 8 AM to 11 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '7649 Library Lane',
  },
  'bld-002': {
    departments: ['Student Organizations Resource Center', 'Dining Services', 'Stamp Events'],
    hoursLabel: 'Open daily - 8 AM to 11 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '3972 Campus Drive',
  },
  'bld-003': {
    departments: ['Computer Science', 'Institute for Advanced Computer Studies'],
    hoursLabel: 'Open weekdays - 8 AM to 10 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '8125 Paint Branch Drive',
  },
  'bld-004': {
    departments: ['Clark School of Engineering', 'Engineering Student Services'],
    hoursLabel: 'Open weekdays - 8 AM to 9 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '8278 Paint Branch Drive',
  },
  'bld-005': {
    departments: ['General Assignment Classrooms', 'Teaching Innovation Hub'],
    hoursLabel: 'Open weekdays - 7:30 AM to 9 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '4131 Campus Drive',
  },
  'bld-006': {
    departments: ['Special Collections', 'Digital Scholarship Center'],
    hoursLabel: 'Open weekdays - 9 AM to 8 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '4130 Campus Drive',
  },
  'bld-007': {
    departments: ['Maryland Athletics', 'Event Operations'],
    hoursLabel: 'Event-based hours - opens 90 min before major events',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '8500 Paint Branch Drive',
  },
  'bld-008': {
    departments: ['Football Operations', 'Terrapin Athletics'],
    hoursLabel: 'Event-based hours - varies by game and practice schedule',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '90 Stadium Drive',
  },
  'bld-009': {
    departments: ['Human Performance Innovation', 'Athletics Innovation'],
    hoursLabel: 'Open weekdays - 8 AM to 8 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '4095 Fieldhouse Drive',
  },
  'bld-010': {
    departments: ['Smith School of Business', 'Undergraduate Programs Office'],
    hoursLabel: 'Open weekdays - 8 AM to 8 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '7699 Mowatt Lane',
  },
  'bld-011': {
    departments: ['Economics', 'Government and Politics'],
    hoursLabel: 'Open weekdays - 8 AM to 7 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '7343 Preinkert Drive',
  },
  'bld-012': {
    departments: ['Biology', 'Psychology'],
    hoursLabel: 'Open weekdays - 8 AM to 8 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '4094 Campus Drive',
  },
  'bld-013': {
    departments: ['School of Music', 'School of Theatre, Dance, and Performance Studies'],
    hoursLabel: 'Open daily - 10 AM to 10 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '8270 Alumni Drive',
  },
  'bld-014': {
    departments: ['RecWell', 'Aquatics', 'Fitness Programs'],
    hoursLabel: 'Open daily - 6 AM to 11 PM',
    accessibility: { wheelchair: true, elevator: true, automaticDoors: true },
    address: '4128 Valley Drive',
  },
  'bld-015': {
    departments: ['South Campus Dining', 'Campus Dining Services'],
    hoursLabel: 'Open daily - 7 AM to 10 PM',
    accessibility: { wheelchair: true, elevator: false, automaticDoors: true },
    address: '7093 Preinkert Drive',
  },
};
