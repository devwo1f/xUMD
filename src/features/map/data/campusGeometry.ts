import { buildings } from '../../../assets/data/buildings';
import type { MapBounds, MapCoordinate } from '../types';

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

function getBounds(points: MapCoordinate[]): MapBounds {
  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);

  return {
    sw: [Math.min(...longitudes), Math.min(...latitudes)],
    ne: [Math.max(...longitudes), Math.max(...latitudes)],
  };
}

export const campusPerimeter: MapCoordinate[] = closeRing([
  [-76.9558, 38.9821],
  [-76.9556, 38.9832],
  [-76.9554, 38.9845],
  [-76.9551, 38.9858],
  [-76.9548, 38.9871],
  [-76.9544, 38.9885],
  [-76.9539, 38.9899],
  [-76.9532, 38.9914],
  [-76.9524, 38.9929],
  [-76.9513, 38.9943],
  [-76.95, 38.9955],
  [-76.9484, 38.9965],
  [-76.9468, 38.9972],
  [-76.9449, 38.9977],
  [-76.9429, 38.9978],
  [-76.9408, 38.9977],
  [-76.9389, 38.9974],
  [-76.9372, 38.9969],
  [-76.9358, 38.9961],
  [-76.9348, 38.9951],
  [-76.9341, 38.9937],
  [-76.9338, 38.9922],
  [-76.9338, 38.9906],
  [-76.934, 38.9889],
  [-76.9344, 38.9872],
  [-76.9349, 38.9855],
  [-76.9357, 38.9839],
  [-76.9367, 38.9825],
  [-76.938, 38.9814],
  [-76.9395, 38.9806],
  [-76.9412, 38.9801],
  [-76.9431, 38.9798],
  [-76.9449, 38.9796],
  [-76.9467, 38.9796],
  [-76.9486, 38.9798],
  [-76.9503, 38.9802],
  [-76.9519, 38.9807],
  [-76.9532, 38.9812],
  [-76.9544, 38.9816],
]);

export const campusMaskOuterRing: MapCoordinate[] = closeRing([
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
]);

export const campusBoundingBox = getBounds(campusPerimeter);

export const buildingFootprints: Record<string, MapCoordinate[]> = {
  'bld-001': buildFootprint('bld-001', 0.00058, 0.00034, 0.00004, 0.00003),
  'bld-002': buildFootprint('bld-002', 0.00062, 0.00035, 0.00003, 0.00004),
  'bld-003': buildFootprint('bld-003', 0.00031, 0.00022, 0.00002, 0.00002),
  'bld-004': buildFootprint('bld-004', 0.00038, 0.00028, 0.00003, 0.00002),
  'bld-005': buildFootprint('bld-005', 0.00045, 0.00028, 0.00002, 0.00003),
  'bld-006': buildFootprint('bld-006', 0.00027, 0.00018, 0.00002, 0.00001),
  'bld-007': buildFootprint('bld-007', 0.00074, 0.00042, 0.00005, 0.00003),
  'bld-008': buildFootprint('bld-008', 0.00086, 0.00048, 0.00004, 0.00002),
  'bld-009': buildFootprint('bld-009', 0.00061, 0.00035, 0.00002, 0.00003),
  'bld-010': buildFootprint('bld-010', 0.00052, 0.00028, 0.00002, 0.00002),
  'bld-011': buildFootprint('bld-011', 0.00036, 0.00023, 0.00002, 0.00001),
  'bld-012': buildFootprint('bld-012', 0.00054, 0.00031, 0.00002, 0.00002),
  'bld-013': buildFootprint('bld-013', 0.00071, 0.00044, 0.00003, 0.00003),
  'bld-014': buildFootprint('bld-014', 0.00052, 0.00034, 0.00002, 0.00002),
  'bld-015': buildFootprint('bld-015', 0.00048, 0.00028, 0.00003, 0.00002),
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
