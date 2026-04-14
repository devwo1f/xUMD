import { EventCategory, type Event } from '../../../shared/types';
import type { MapMarkerCategoryKey } from '../types';

type PinIconKey =
  | 'briefcase'
  | 'academic'
  | 'people'
  | 'trophy'
  | 'music'
  | 'food'
  | 'tech'
  | 'talks'
  | 'workshop'
  | 'star'
  | 'calendar';

interface PinCategoryMeta {
  color: string;
  iconKey: PinIconKey;
  clusterProperty: string;
}

export interface PinRenderMetrics {
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
}

export const MAP_PIN_CATEGORY_KEYS: MapMarkerCategoryKey[] = [
  'career',
  'academic',
  'social',
  'sports',
  'arts',
  'food',
  'tech',
  'talks',
  'workshop',
  'featured',
  'other',
];

export const MAP_PIN_META: Record<MapMarkerCategoryKey, PinCategoryMeta> = {
  career: { color: '#1565C0', iconKey: 'briefcase', clusterProperty: 'careerCount' },
  academic: { color: '#5E35B1', iconKey: 'academic', clusterProperty: 'academicCount' },
  social: { color: '#E21833', iconKey: 'people', clusterProperty: 'socialCount' },
  sports: { color: '#2E7D32', iconKey: 'trophy', clusterProperty: 'sportsCount' },
  arts: { color: '#E91E63', iconKey: 'music', clusterProperty: 'artsCount' },
  food: { color: '#F57C00', iconKey: 'food', clusterProperty: 'foodCount' },
  tech: { color: '#00838F', iconKey: 'tech', clusterProperty: 'techCount' },
  talks: { color: '#6D4C41', iconKey: 'talks', clusterProperty: 'talksCount' },
  workshop: { color: '#455A64', iconKey: 'workshop', clusterProperty: 'workshopCount' },
  featured: { color: '#FFD520', iconKey: 'star', clusterProperty: 'featuredCount' },
  other: { color: '#757575', iconKey: 'calendar', clusterProperty: 'otherCount' },
};

const SVG_WIDTH = 72;
const SVG_HEIGHT = 96;
const BADGE_OUTER_RADIUS = 8.5;
const BADGE_CENTER_X = 56;
const BADGE_CENTER_Y = 18;

const TECH_KEYWORDS = [
  'hackathon',
  'hack umd',
  'hackumd',
  'code',
  'coding',
  'programming',
  'developer',
  'software',
  'ai',
  'ml',
  'robotics',
  'cyber',
  'computer science',
  'tech',
  'buildathon',
];

const TALK_KEYWORDS = [
  'talk',
  'lecture',
  'speaker',
  'fireside',
  'panel',
  'seminar',
  'keynote',
  'colloquium',
  'research talk',
  'guest speaker',
];

const MUSIC_KEYWORDS = ['music', 'concert', 'choir', 'band', 'jam', 'dj', 'orchestra', 'singer'];

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function buildSearchableText(event: Pick<Event, 'title' | 'description' | 'tags'>) {
  return [event.title, event.description, event.tags?.join(' ') ?? '']
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function containsAnyKeyword(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function renderIcon(iconKey: PinIconKey) {
  switch (iconKey) {
    case 'briefcase':
      return `
        <rect x="21" y="33" width="30" height="20" rx="5" fill="#FFFFFF" />
        <path d="M30 33v-5c0-2 1.8-3.5 4-3.5h4c2.2 0 4 1.5 4 3.5v5" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
      `;
    case 'academic':
      return `
        <path d="M18 34 36 24 54 34 36 43 18 34Z" fill="#FFFFFF" />
        <path d="M26 38v6.5c0 4 7.2 6.8 10 6.8s10-2.8 10-6.8V38" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M54 34v11" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" />
        <circle cx="54" cy="47.5" r="2.6" fill="#FFFFFF" />
      `;
    case 'people':
      return `
        <circle cx="29" cy="31" r="6" fill="#FFFFFF" />
        <circle cx="43.5" cy="32" r="5" fill="#FFFFFF" />
        <path d="M20.5 46c0-5 3.8-8.5 8.5-8.5 4.7 0 8.5 3.5 8.5 8.5" fill="none" stroke="#FFFFFF" stroke-width="4.4" stroke-linecap="round" />
        <path d="M36 45.5c0-3.9 3.1-6.5 7.2-6.5 4.1 0 7.3 2.6 7.8 6.5" fill="none" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" />
      `;
    case 'trophy':
      return `
        <path d="M25 26h22v8c0 7-5 12-11 12s-11-5-11-12v-8Z" fill="#FFFFFF" />
        <path d="M25 29h-5c0 6 2.6 9 7 10" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M47 29h5c0 6-2.6 9-7 10" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M36 46v8" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
        <path d="M29 58h14" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
      `;
    case 'music':
      return `
        <path d="M44 24v18.5c0 4.5-3.2 7.5-7.5 7.5S29 47.2 29 43.6c0-3.8 3.4-6.6 7.8-6.6 1.4 0 2.8.3 4 .9V28l10-2.8v17.1c0 4.5-3.2 7.7-7.3 7.7-4 0-7.2-2.8-7.2-6.3 0-3.9 3.5-6.7 7.8-6.7 1 0 2 .1 2.9.5V24Z" fill="#FFFFFF" />
      `;
    case 'food':
      return `
        <path d="M24 24v13" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
        <path d="M19 24v8" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" />
        <path d="M24 24v8" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" />
        <path d="M29 24v8" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" />
        <path d="M24 37v17" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
        <path d="M44 24v13c0 3-1.6 5.3-4 6.2V54" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M44 24c4 0 6 3.1 6 7v5" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
      `;
    case 'tech':
      return `
        <path d="M29 26 19 38l10 12" fill="none" stroke="#FFFFFF" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M43 26 53 38 43 50" fill="none" stroke="#FFFFFF" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M39 23 33 53" fill="none" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" />
      `;
    case 'talks':
      return `
        <rect x="26" y="23" width="20" height="27" rx="10" fill="#FFFFFF" />
        <path d="M22 38c0 8 6 14 14 14s14-6 14-14" fill="none" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" />
        <path d="M36 52v8" fill="none" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" />
        <path d="M29 60h14" fill="none" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" />
      `;
    case 'workshop':
      return `
        <path d="M27 23c4 0 7 3 7 6.5 0 2.2-1.2 4.1-3.1 5.2l5 5-4.3 4.2-5-5c-1.1 1.9-3 3.1-5.2 3.1-3.5 0-6.4-3-6.4-6.5S18 29 21.4 29c1.1 0 2.1.3 3 .7l4.6-4.8c1.2-1.2 2.4-1.9 4-1.9H41v4h-5.5l-3.3 3.3" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M42 39 53 50" fill="none" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" />
        <path d="M48 33 58 43" fill="none" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" />
      `;
    case 'star':
      return `
        <path d="M36 22.5l4.9 10 11 1.6-8 7.8 1.9 11L36 47.8l-9.8 5.1 1.9-11-8-7.8 11-1.6 4.9-10Z" fill="#FFFFFF" />
      `;
    case 'calendar':
    default:
      return `
        <rect x="21" y="27" width="30" height="26" rx="5" fill="#FFFFFF" />
        <path d="M21 35h30" fill="none" stroke="#757575" stroke-width="0" />
        <path d="M28 22v8" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
        <path d="M44 22v8" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
        <path d="M21 35h30" fill="none" stroke="${'#FFFFFF'}" stroke-width="4" stroke-linecap="round" />
        <rect x="27" y="40" width="7" height="6" rx="2" fill="rgba(255,255,255,0.55)" />
        <rect x="38" y="40" width="7" height="6" rx="2" fill="rgba(255,255,255,0.55)" />
      `;
  }
}

function buildPinSvg(
  color: string,
  iconMarkup: string,
  showBadge: boolean,
  groupVariant: boolean,
) {
  const pinPath =
    'M36 92c-3.2 0-6.2-1.5-8.2-4.1L14.5 69.8C8.3 62.6 5 54 5 45.1 5 27.9 18.9 14 36 14s31 13.9 31 31.1c0 8.9-3.3 17.5-9.5 24.7L44.2 87.9C42.2 90.5 39.2 92 36 92Z';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
      <path d="${pinPath}" fill="rgba(15,23,42,0.18)" transform="translate(0 4)" />
      <path d="${pinPath}" fill="${color}" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round" />
      <circle cx="36" cy="40" r="${groupVariant ? 0 : 0}" fill="none" />
      ${groupVariant ? '' : iconMarkup}
      ${
        showBadge
          ? `
            <circle cx="${BADGE_CENTER_X}" cy="${BADGE_CENTER_Y}" r="${BADGE_OUTER_RADIUS}" fill="#FFFFFF" />
            <path d="M52.5 18.1l2.5 2.6 5.4-5.4" fill="none" stroke="#0F766E" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
          `
          : ''
      }
    </svg>
  `;
}

function toDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildPinImageEntries() {
  return MAP_PIN_CATEGORY_KEYS.reduce<Record<string, string>>((entries, categoryKey) => {
    const meta = MAP_PIN_META[categoryKey];
    const iconMarkup = renderIcon(meta.iconKey);

    entries[getPinAssetId(categoryKey, false, false)] = toDataUri(buildPinSvg(meta.color, iconMarkup, false, false));
    entries[getPinAssetId(categoryKey, false, true)] = toDataUri(buildPinSvg(meta.color, iconMarkup, true, false));
    entries[getPinAssetId(categoryKey, true, false)] = toDataUri(buildPinSvg(meta.color, '', false, true));
    entries[getPinAssetId(categoryKey, true, true)] = toDataUri(buildPinSvg(meta.color, '', true, true));

    return entries;
  }, {});
}

export const MAP_PIN_IMAGE_ENTRIES = buildPinImageEntries();

export function getMapPinColor(categoryKey: MapMarkerCategoryKey) {
  return MAP_PIN_META[categoryKey].color;
}

export function getMapPinBaseCategoryKey(
  event: Pick<Event, 'category' | 'title' | 'description' | 'tags'>,
): Exclude<MapMarkerCategoryKey, 'featured'> {
  const searchableText = buildSearchableText(event);

  if (
    event.category === EventCategory.Career
  ) {
    return 'career';
  }

  if (event.category === EventCategory.Sports) {
    return 'sports';
  }

  if (event.category === EventCategory.Arts || containsAnyKeyword(searchableText, MUSIC_KEYWORDS)) {
    return 'arts';
  }

  if (event.category === EventCategory.Food) {
    return 'food';
  }

  if (event.category === EventCategory.Workshop) {
    return containsAnyKeyword(searchableText, TECH_KEYWORDS) ? 'tech' : 'workshop';
  }

  if (containsAnyKeyword(searchableText, TECH_KEYWORDS)) {
    return 'tech';
  }

  if (containsAnyKeyword(searchableText, TALK_KEYWORDS)) {
    return 'talks';
  }

  if (event.category === EventCategory.Academic) {
    return 'academic';
  }

  if (
    event.category === EventCategory.Social ||
    event.category === EventCategory.Club ||
    event.category === EventCategory.Party
  ) {
    return 'social';
  }

  return 'other';
}

export function getMapPinCategoryKey(
  event: Pick<Event, 'category' | 'is_featured' | 'title' | 'description' | 'tags'>,
): MapMarkerCategoryKey {
  if (event.is_featured) {
    return 'featured';
  }

  return getMapPinBaseCategoryKey(event);
}

export function getDominantMapPinCategoryKey(
  events: Array<Pick<Event, 'category' | 'title' | 'description' | 'tags'>>,
) {
  const counts = new Map<Exclude<MapMarkerCategoryKey, 'featured'>, number>();

  events.forEach((event) => {
    const categoryKey = getMapPinBaseCategoryKey(event);
    counts.set(categoryKey, (counts.get(categoryKey) ?? 0) + 1);
  });

  let winner: Exclude<MapMarkerCategoryKey, 'featured'> = 'social';
  let winnerCount = 0;
  let tied = false;

  counts.forEach((count, categoryKey) => {
    if (count > winnerCount) {
      winner = categoryKey;
      winnerCount = count;
      tied = false;
      return;
    }

    if (count === winnerCount) {
      tied = true;
    }
  });

  return tied ? 'social' : winner;
}

export function getPinAssetId(
  categoryKey: MapMarkerCategoryKey,
  isGroup: boolean,
  isGoing: boolean,
) {
  return `event-pin-${categoryKey}-${isGroup ? 'group' : 'single'}-${isGoing ? 'going' : 'default'}`;
}

export function getResponsivePinScale(
  metrics: PinRenderMetrics,
  options: { isMultiEvent?: boolean; isFeatured?: boolean } = {},
) {
  const viewportRatio = Math.min(metrics.viewportWidth / 390, metrics.viewportHeight / 844);
  const densityNudge = 0.94 + clampNumber(metrics.pixelRatio, 2, 3.5) * 0.045;
  const emphasis = options.isMultiEvent || options.isFeatured ? 1.2 : 1;
  return clampNumber(viewportRatio * densityNudge * 0.62 * emphasis, 0.5, 0.88);
}

export function getPinHeadRadius(scale: number) {
  return 16 * scale;
}

export function getPinBadgeScale(scale: number) {
  return clampNumber(scale * 0.86, 0.42, 0.84);
}

export function getPinCountTextSize(scale: number) {
  return clampNumber(scale * 18, 11, 18);
}

export function buildClusterProperties() {
  return MAP_PIN_CATEGORY_KEYS.reduce<Record<string, unknown>>(
    (properties, categoryKey) => {
      properties[MAP_PIN_META[categoryKey].clusterProperty] = [
        '+',
        ['case', ['==', ['get', 'categoryKey'], categoryKey], ['get', 'eventCount'], 0],
      ];
      return properties;
    },
    {
      totalEvents: ['+', ['get', 'eventCount']],
    },
  );
}

export function buildClusterDominantColorExpression() {
  const countExpressions = MAP_PIN_CATEGORY_KEYS.map((categoryKey) => [
    'get',
    MAP_PIN_META[categoryKey].clusterProperty,
  ]);

  const maxExpression = ['max', ...countExpressions];
  const cases: unknown[] = [];

  MAP_PIN_CATEGORY_KEYS.forEach((categoryKey) => {
    cases.push(
      ['==', ['get', MAP_PIN_META[categoryKey].clusterProperty], maxExpression],
      MAP_PIN_META[categoryKey].color,
    );
  });

  return ['case', ...cases, MAP_PIN_META.social.color];
}
