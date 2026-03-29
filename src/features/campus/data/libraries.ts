import { colors } from '../../../shared/theme/colors';

export type LibraryId =
  | 'mckeldin'
  | 'architecture'
  | 'art'
  | 'hornbake'
  | 'mspal'
  | 'stem'
  | 'severn'
  | 'priddy';

type WeekdayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface LibraryFeature {
  label: string;
  icon: string;
}

export interface LibraryProfile {
  id: LibraryId;
  name: string;
  shortName: string;
  officialHoursName?: string;
  campusLabel: string;
  address: string;
  phone: string;
  heroImage: string;
  accentColor: string;
  description: string;
  features: LibraryFeature[];
  fallbackHours: Record<WeekdayKey, string>;
}

export interface LibraryHoursStatus {
  label: string;
  isOpen: boolean;
  source: 'live' | 'fallback';
  updatedLabel: string;
}

const weekdayOrder: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const libraryProfiles: LibraryProfile[] = [
  {
    id: 'mckeldin',
    name: 'McKeldin Library',
    shortName: 'McKeldin',
    officialHoursName: 'McKeldin',
    campusLabel: 'College Park Campus',
    address: '7649 Library Lane, College Park, MD 20742',
    phone: '(301) 405-0800',
    heroImage:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80',
    accentColor: colors.primary.main,
    description:
      'McKeldin is the main library on the College Park campus, with broad study space, research support, and the most central academic energy on campus.',
    features: [
      { label: 'Quiet floors', icon: 'book-open-page-variant' },
      { label: 'Group study zones', icon: 'account-group-outline' },
      { label: 'Research help', icon: 'magnify' },
      { label: 'Late-night access', icon: 'clock-outline' },
    ],
    fallbackHours: {
      sun: '11:00AM - 24 Hours',
      mon: '24 Hours',
      tue: '24 Hours',
      wed: '24 Hours',
      thu: '24 Hours',
      fri: '12:00AM - 8:00PM',
      sat: '11:00AM - 8:00PM',
    },
  },
  {
    id: 'architecture',
    name: 'Architecture Library',
    shortName: 'Architecture',
    officialHoursName: 'Architecture',
    campusLabel: 'College Park Campus',
    address: '3835 Campus Drive, College Park, MD 20742',
    phone: '(301) 405-6317',
    heroImage:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#D97706',
    description:
      'Located in the School of Architecture, Preservation and Planning, this library supports architecture, planning, preservation, and real estate students with focused collections and quieter study space.',
    features: [
      { label: 'Reading room', icon: 'lamp-outline' },
      { label: 'Group study room', icon: 'account-multiple-outline' },
      { label: 'iMacs', icon: 'monitor' },
      { label: 'Scanners + printing', icon: 'printer-outline' },
    ],
    fallbackHours: {
      sun: 'Closed',
      mon: '11:00AM - 4:00PM',
      tue: '11:00AM - 4:00PM',
      wed: '11:00AM - 4:00PM',
      thu: '11:00AM - 4:00PM',
      fri: 'Closed',
      sat: 'Closed',
    },
  },
  {
    id: 'art',
    name: 'Art Library',
    shortName: 'Art',
    officialHoursName: 'Art',
    campusLabel: 'College Park Campus',
    address: '3834 Campus Drive, College Park, MD 20742',
    phone: '(301) 405-9061',
    heroImage:
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#9333EA',
    description:
      'The Art Library supports studio art, art history, archaeology, decorative arts, photography, and graphic design with specialized collections close to the art studios and classrooms.',
    features: [
      { label: 'Art history collections', icon: 'palette-outline' },
      { label: 'Seminar room', icon: 'presentation' },
      { label: 'Reserve materials', icon: 'bookmark-outline' },
      { label: 'Focused study tables', icon: 'table-furniture' },
    ],
    fallbackHours: {
      sun: 'Closed',
      mon: '9:00AM - 6:00PM',
      tue: '9:00AM - 6:00PM',
      wed: '9:00AM - 6:00PM',
      thu: '9:00AM - 6:00PM',
      fri: '11:00AM - 4:00PM',
      sat: 'Closed',
    },
  },
  {
    id: 'hornbake',
    name: 'Hornbake Library',
    shortName: 'Hornbake',
    officialHoursName: 'Hornbake',
    campusLabel: 'College Park Campus',
    address: 'Hornbake Plaza, College Park, MD 20742',
    phone: '(301) 405-9212',
    heroImage:
      'https://www.lib.umd.edu/sites/default/files/styles/optimized/public/2022-03/IMG_0339.JPG?itok=efLASkU2',
    accentColor: '#2563EB',
    description:
      'Hornbake is home to Special Collections, University Archives, exhibitions, and a quieter study environment for students who want space away from the main mall flow.',
    features: [
      { label: 'Special collections', icon: 'archive-outline' },
      { label: 'University archives', icon: 'file-cabinet-outline' },
      { label: 'Exhibition gallery', icon: 'image-outline' },
      { label: 'Quiet study space', icon: 'book-outline' },
    ],
    fallbackHours: {
      sun: 'Closed',
      mon: '7:00AM - 10:00PM',
      tue: '7:00AM - 10:00PM',
      wed: '7:00AM - 10:00PM',
      thu: '7:00AM - 10:00PM',
      fri: '7:00AM - 6:00PM',
      sat: 'Closed',
    },
  },
  {
    id: 'mspal',
    name: 'Michelle Smith Performing Arts Library',
    shortName: 'MSPAL',
    officialHoursName: 'Michelle Smith Performing Arts',
    campusLabel: 'College Park Campus',
    address: '8270 Alumni Drive, College Park, MD 20742',
    phone: '(301) 405-9217',
    heroImage:
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#EC4899',
    description:
      'MSPAL connects students and artists to music, theatre, and dance resources, with archives, media support, and a seminar-room-style study environment inside The Clarice.',
    features: [
      { label: 'Seminar room', icon: 'presentation' },
      { label: 'Equipment for loan', icon: 'camera-outline' },
      { label: 'Scan + print', icon: 'printer-outline' },
      { label: 'Performing arts archives', icon: 'music-clef-treble' },
    ],
    fallbackHours: {
      sun: '2:00PM - 10:00PM',
      mon: '9:00AM - 10:00PM',
      tue: '9:00AM - 10:00PM',
      wed: '9:00AM - 10:00PM',
      thu: '9:00AM - 10:00PM',
      fri: '9:00AM - 5:00PM',
      sat: 'Closed',
    },
  },
  {
    id: 'stem',
    name: 'STEM Library',
    shortName: 'STEM',
    officialHoursName: 'STEM',
    campusLabel: 'College Park Campus',
    address: 'Mathematics Building, College Park, MD 20742',
    phone: '(301) 405-9157',
    heroImage:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    accentColor: colors.status.info,
    description:
      'The STEM Library supports engineering, computer science, mathematics, and natural sciences with research help, study seating, and tech-forward workspaces.',
    features: [
      { label: 'Group study rooms', icon: 'account-group-outline' },
      { label: 'Research support', icon: 'flask-outline' },
      { label: 'Scanners + printing', icon: 'printer-outline' },
      { label: 'Collaborative seating', icon: 'laptop' },
    ],
    fallbackHours: {
      sun: '2:00PM - 9:00PM',
      mon: '8:00AM - 9:00PM',
      tue: '8:00AM - 9:00PM',
      wed: '8:00AM - 9:00PM',
      thu: '8:00AM - 9:00PM',
      fri: '8:00AM - 5:00PM',
      sat: 'Closed',
    },
  },
  {
    id: 'severn',
    name: 'Severn Library',
    shortName: 'Severn',
    campusLabel: 'Beyond College Park',
    address: 'Severn Building, Greenbelt Road, Maryland',
    phone: '(301) 314-1313',
    heroImage:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#475569',
    description:
      'Severn houses the Libraries high-density storage collections and supports long-term access to unique, semi-rare, and research-intensive materials.',
    features: [
      { label: 'High-density storage', icon: 'archive-outline' },
      { label: 'Collection retrieval', icon: 'package-variant-closed' },
      { label: 'Research support', icon: 'magnify' },
      { label: 'Special handling', icon: 'shield-check-outline' },
    ],
    fallbackHours: {
      sun: 'Closed',
      mon: '9:00AM - 5:00PM',
      tue: '9:00AM - 5:00PM',
      wed: '9:00AM - 5:00PM',
      thu: '9:00AM - 5:00PM',
      fri: '9:00AM - 5:00PM',
      sat: 'Closed',
    },
  },
  {
    id: 'priddy',
    name: 'Priddy Library',
    shortName: 'Priddy',
    campusLabel: 'Universities at Shady Grove',
    address: '9630 Gudelsky Drive, Rockville, MD 20850',
    phone: '(301) 738-6025',
    heroImage:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80',
    accentColor: '#0F766E',
    description:
      'Priddy Library serves students at the Universities at Shady Grove with study space, research support, and access to University System of Maryland resources.',
    features: [
      { label: 'Study seating', icon: 'book-outline' },
      { label: 'Research help', icon: 'magnify' },
      { label: 'Computer workstations', icon: 'desktop-classic' },
      { label: 'Shared USM resources', icon: 'school-outline' },
    ],
    fallbackHours: {
      sun: 'Closed',
      mon: '8:00AM - 10:00PM',
      tue: '8:00AM - 10:00PM',
      wed: '8:00AM - 10:00PM',
      thu: '8:00AM - 10:00PM',
      fri: '8:00AM - 5:00PM',
      sat: '10:00AM - 6:00PM',
    },
  },
];

export function getLibraryById(libraryId: string) {
  return libraryProfiles.find((library) => library.id === libraryId);
}

export function getWeekdayKey(date: Date): WeekdayKey {
  return weekdayOrder[date.getDay()] ?? 'sun';
}

function parseTimeLabel(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})(AM|PM)/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM') {
    hours += 12;
  }

  return hours * 60 + minutes;
}

export function normalizeHoursLabel(label: string) {
  return label.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
}

export function isHoursLabelOpen(label: string, date: Date = new Date()) {
  const normalized = normalizeHoursLabel(label);

  if (/closed/i.test(normalized)) {
    return false;
  }

  if (/^24 hours$/i.test(normalized)) {
    return true;
  }

  const rangeMatch = normalized.match(/(\d{1,2}:\d{2}[AP]M)\s*-\s*(24 Hours|\d{1,2}:\d{2}[AP]M)/i);

  if (!rangeMatch) {
    return true;
  }

  const openAt = parseTimeLabel(rangeMatch[1]);
  const closeAt = /24 hours/i.test(rangeMatch[2]) ? 24 * 60 : parseTimeLabel(rangeMatch[2]);

  if (openAt === null || closeAt === null) {
    return true;
  }

  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  return nowMinutes >= openAt && nowMinutes < closeAt;
}

export function getFallbackLibraryHours(profile: LibraryProfile, date: Date = new Date()): LibraryHoursStatus {
  const label = profile.fallbackHours[getWeekdayKey(date)] ?? 'Closed';

  return {
    label,
    isOpen: isHoursLabelOpen(label, date),
    source: 'fallback',
    updatedLabel: 'Campus fallback schedule',
  };
}

export function formatHoursCallout(status: LibraryHoursStatus) {
  return status.isOpen ? 'Open now' : 'Closed now';
}

