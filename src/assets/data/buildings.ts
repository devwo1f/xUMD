/**
 * UMD Campus Buildings Data
 *
 * Major campus buildings with coordinates for the map feature.
 */

export type BuildingType =
  | 'library'
  | 'student_center'
  | 'academic'
  | 'engineering'
  | 'athletics'
  | 'dining'
  | 'recreation'
  | 'performing_arts';

export interface Building {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  building_type: BuildingType;
  description: string;
}

export const buildings: Building[] = [
  {
    id: 'bld-001',
    name: 'McKeldin Library',
    code: 'MCK',
    latitude: 38.9860,
    longitude: -76.9451,
    building_type: 'library',
    description:
      'The main library on campus, offering study spaces, research resources, and the iconic McKeldin Mall view.',
  },
  {
    id: 'bld-002',
    name: 'Adele H. Stamp Student Union',
    code: 'SU',
    latitude: 38.9882,
    longitude: -76.9447,
    building_type: 'student_center',
    description:
      'The hub of student life featuring dining, meeting rooms, event spaces, and student organization offices.',
  },
  {
    id: 'bld-003',
    name: 'Brendan Iribe Center for Computer Science and Engineering',
    code: 'IRB',
    latitude: 38.9891,
    longitude: -76.9365,
    building_type: 'engineering',
    description:
      'State-of-the-art facility for computer science, home to labs, classrooms, and collaborative work areas.',
  },
  {
    id: 'bld-004',
    name: 'A. James Clark Hall (Kim Engineering)',
    code: 'KEB',
    latitude: 38.9910,
    longitude: -76.9368,
    building_type: 'engineering',
    description:
      'Houses the A. James Clark School of Engineering with advanced research labs and lecture halls.',
  },
  {
    id: 'bld-005',
    name: 'Edward St. John Learning and Teaching Center',
    code: 'ESJ',
    latitude: 38.9869,
    longitude: -76.9396,
    building_type: 'academic',
    description:
      'A modern learning center with flexible classrooms, auditoriums, and student collaboration spaces.',
  },
  {
    id: 'bld-006',
    name: 'Hornbake Library',
    code: 'HBK',
    latitude: 38.9885,
    longitude: -76.9421,
    building_type: 'library',
    description:
      'Home to special collections, the National Public Broadcasting Archives, and quiet study areas.',
  },
  {
    id: 'bld-007',
    name: 'XFINITY Center',
    code: 'XFC',
    latitude: 38.9937,
    longitude: -76.9426,
    building_type: 'athletics',
    description:
      'The 17,950-seat arena hosting Maryland Terrapins basketball, concerts, and major campus events.',
  },
  {
    id: 'bld-008',
    name: 'Maryland Stadium',
    code: 'STD',
    latitude: 38.9907,
    longitude: -76.9484,
    building_type: 'athletics',
    description:
      'Capital One Field at Maryland Stadium, home of the Terrapins football team with 51,802 seats.',
  },
  {
    id: 'bld-009',
    name: 'Cole Field House',
    code: 'CFH',
    latitude: 38.9935,
    longitude: -76.9451,
    building_type: 'athletics',
    description:
      'Historic arena being transformed into a state-of-the-art facility for athletics and human performance.',
  },
  {
    id: 'bld-010',
    name: 'Van Munching Hall',
    code: 'VMH',
    latitude: 38.9836,
    longitude: -76.9457,
    building_type: 'academic',
    description:
      'Home to the Robert H. Smith School of Business, offering MBA programs and business research centers.',
  },
  {
    id: 'bld-011',
    name: 'Tydings Hall',
    code: 'TYD',
    latitude: 38.9842,
    longitude: -76.9439,
    building_type: 'academic',
    description:
      'Houses the Department of Economics and the Department of Government and Politics.',
  },
  {
    id: 'bld-012',
    name: 'Biology-Psychology Building',
    code: 'BPS',
    latitude: 38.9886,
    longitude: -76.9401,
    building_type: 'academic',
    description:
      'A large academic building housing the Departments of Biology and Psychology with research labs.',
  },
  {
    id: 'bld-013',
    name: 'The Clarice Smith Performing Arts Center',
    code: 'CSP',
    latitude: 38.9907,
    longitude: -76.9502,
    building_type: 'performing_arts',
    description:
      'A world-class performing arts center with theaters, galleries, and studios for music, dance, and theater.',
  },
  {
    id: 'bld-014',
    name: 'Eppley Recreation Center',
    code: 'ERC',
    latitude: 38.9930,
    longitude: -76.9467,
    building_type: 'recreation',
    description:
      'Campus recreation facility with fitness areas, pools, courts, and group exercise studios.',
  },
  {
    id: 'bld-015',
    name: 'South Campus Dining Hall',
    code: 'SCD',
    latitude: 38.9831,
    longitude: -76.9474,
    building_type: 'dining',
    description:
      'All-you-care-to-eat dining hall on the south end of campus with diverse food stations.',
  },
];
