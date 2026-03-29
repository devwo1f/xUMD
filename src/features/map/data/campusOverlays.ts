import type { BuildingType } from '../../../assets/data/buildings';
import { EventCategory } from '../../../shared/types';
import { colors } from '../../../shared/theme/colors';

export interface CampusRoute {
  id: string;
  name: string;
  description: string;
  duration: string;
  color: string;
  coordinates: [number, number][];
}

export interface DiningZone {
  id: string;
  name: string;
  description: string;
  fillColor: string;
  lineColor: string;
  coordinates: [number, number][];
}

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
  color: string;
}

export const buildingTypeMeta: Record<
  BuildingType,
  { label: string; shortLabel: string; color: string }
> = {
  library: { label: 'Libraries', shortLabel: 'Library', color: colors.status.info },
  student_center: {
    label: 'Student life',
    shortLabel: 'Student life',
    color: colors.primary.main,
  },
  academic: { label: 'Academic', shortLabel: 'Academic', color: colors.gray[700] },
  engineering: {
    label: 'Engineering',
    shortLabel: 'Engineering',
    color: colors.status.info,
  },
  athletics: { label: 'Athletics', shortLabel: 'Athletics', color: colors.status.success },
  dining: { label: 'Dining', shortLabel: 'Dining', color: colors.secondary.dark },
  recreation: {
    label: 'Recreation',
    shortLabel: 'Recreation',
    color: colors.status.success,
  },
  performing_arts: { label: 'Arts', shortLabel: 'Arts', color: colors.clubCategory.arts },
};

const buildingTypeOrder: BuildingType[] = [
  'library',
  'student_center',
  'academic',
  'engineering',
  'athletics',
  'dining',
  'recreation',
  'performing_arts',
];

export const buildingTypeOptions: FilterChipOption<BuildingType>[] = buildingTypeOrder.map((type) => ({
  value: type,
  label: buildingTypeMeta[type].shortLabel,
  color: buildingTypeMeta[type].color,
}));

export type ExploreEventCategoryFilter = EventCategory | 'all';

export const eventCategoryOptions: FilterChipOption<ExploreEventCategoryFilter>[] = [
  { value: 'all', label: 'All events', color: colors.text.primary },
  { value: EventCategory.Academic, label: 'Academic', color: colors.eventCategory.academic },
  { value: EventCategory.Career, label: 'Career', color: colors.eventCategory.career },
  { value: EventCategory.Sports, label: 'Sports', color: colors.eventCategory.sports },
  { value: EventCategory.Social, label: 'Social', color: colors.eventCategory.social },
  { value: EventCategory.Arts, label: 'Arts', color: colors.eventCategory.arts },
];

export const campusRoutes: CampusRoute[] = [
  {
    id: 'route-mall-loop',
    name: 'Mall Loop',
    description: 'A central walk linking McKeldin, Stamp, and Hornbake.',
    duration: '12 min',
    color: colors.primary.main,
    coordinates: [
      [-76.9451, 38.9860],
      [-76.9447, 38.9882],
      [-76.9421, 38.9885],
      [-76.9396, 38.9869],
      [-76.9451, 38.9860],
    ],
  },
  {
    id: 'route-stem-link',
    name: 'STEM Link',
    description: 'Fastest corridor between Iribe, ESJ, and the engineering spine.',
    duration: '9 min',
    color: colors.status.info,
    coordinates: [
      [-76.9365, 38.9891],
      [-76.9368, 38.9910],
      [-76.9396, 38.9869],
      [-76.9421, 38.9885],
    ],
  },
  {
    id: 'route-game-day',
    name: 'Game Day Walk',
    description: 'A high-energy path from student life to the stadium district.',
    duration: '11 min',
    color: colors.secondary.dark,
    coordinates: [
      [-76.9447, 38.9882],
      [-76.9451, 38.9935],
      [-76.9426, 38.9937],
      [-76.9484, 38.9907],
    ],
  },
];

export const diningZones: DiningZone[] = [
  {
    id: 'zone-stamp-dining',
    name: 'Stamp Dining Core',
    description: 'Food court, quick bites, and meetup density around Stamp.',
    fillColor: 'rgba(255, 210, 0, 0.18)',
    lineColor: colors.secondary.dark,
    coordinates: [
      [-76.9463, 38.9874],
      [-76.9436, 38.9874],
      [-76.9436, 38.9894],
      [-76.9463, 38.9894],
      [-76.9463, 38.9874],
    ],
  },
  {
    id: 'zone-south-campus-dining',
    name: 'South Campus Dining',
    description: 'Dining hall zone with nearby residence and study traffic.',
    fillColor: 'rgba(255, 210, 0, 0.16)',
    lineColor: colors.secondary.dark,
    coordinates: [
      [-76.9492, 38.9822],
      [-76.9460, 38.9822],
      [-76.9460, 38.9843],
      [-76.9492, 38.9843],
      [-76.9492, 38.9822],
    ],
  },
];

