import { addDays, endOfDay, format, isSameDay, isTomorrow, startOfDay } from 'date-fns';
import type { Building } from '../../../assets/data/buildings';
import { colors } from '../../../shared/theme/colors';
import { EventCategory, type Event } from '../../../shared/types';
import type {
  EventLocationGroup,
  MapCoordinate,
  MapSortOption,
  MapTimeFilter,
  MapUserLocation,
  MarkerVisualMode,
} from '../types';
import { getDistanceMeters, toMapCoordinate } from './wayfinding';

const DENSITY_RADIUS_METERS = 100;

export const HEATMAP_STOPS = [
  { threshold: 1, color: '#90A4AE', label: 'Quiet' },
  { threshold: 2, color: '#42A5F5', label: 'A couple' },
  { threshold: 3, color: '#26A69A', label: 'Moderate' },
  { threshold: 5, color: '#FFA726', label: 'Busy' },
  { threshold: 7, color: '#FF5722', label: 'Very busy' },
  { threshold: 10, color: '#D32F2F', label: 'Hotspot' },
] as const;

export const MAP_CATEGORY_OPTIONS: Array<{
  value: EventCategory | 'all';
  label: string;
  color: string;
}> = [
  { value: 'all', label: 'All', color: colors.primary.main },
  { value: EventCategory.Academic, label: 'Academic', color: colors.eventCategory.academic },
  { value: EventCategory.Social, label: 'Social', color: colors.eventCategory.social },
  { value: EventCategory.Sports, label: 'Sports', color: colors.eventCategory.sports },
  { value: EventCategory.Club, label: 'Club', color: colors.eventCategory.club },
  { value: EventCategory.Career, label: 'Career', color: colors.eventCategory.career },
  { value: EventCategory.Arts, label: 'Arts', color: colors.eventCategory.arts },
  { value: EventCategory.Food, label: 'Food', color: colors.eventCategory.food },
  { value: EventCategory.Workshop, label: 'Workshop', color: colors.eventCategory.workshop },
  { value: EventCategory.Party, label: 'Party', color: colors.eventCategory.party },
];

export const CATEGORY_GLYPHS: Record<EventCategory, string> = {
  [EventCategory.Academic]: 'A',
  [EventCategory.Social]: 'S',
  [EventCategory.Sports]: 'T',
  [EventCategory.Club]: 'C',
  [EventCategory.Career]: 'J',
  [EventCategory.Arts]: 'R',
  [EventCategory.Food]: 'F',
  [EventCategory.Workshop]: 'W',
  [EventCategory.Party]: 'P',
  [EventCategory.Other]: '•',
};

export interface EventFilterOptions {
  searchQuery: string;
  selectedCategories: EventCategory[];
  timeFilter: MapTimeFilter;
  sortBy: MapSortOption;
  customRange?: { start: string; end: string } | null;
  onlyFriendsAttending?: boolean;
  userLocation?: MapUserLocation | null;
}

export interface LiveEventCounter {
  liveCount: number;
  nextTwoHoursCount: number;
}

export interface CampusSearchResult {
  id: string;
  type: 'event' | 'location';
  title: string;
  subtitle: string;
  coordinate: MapCoordinate;
  eventIds: string[];
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function isEventApproved(event: Event) {
  return (event.moderation_status ?? 'approved') === 'approved';
}

export function getEventStatus(event: Event, now = new Date()) {
  if ((event.status ?? 'upcoming') === 'cancelled') {
    return 'cancelled';
  }

  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);

  if (startsAt <= now && endsAt > now) {
    return 'live';
  }

  if (endsAt <= now) {
    return 'completed';
  }

  return 'upcoming';
}

export function isEventLive(event: Event, now = new Date()) {
  return getEventStatus(event, now) === 'live';
}

export function getCategoryColor(category: Event['category']) {
  return (
    colors.eventCategory[category as keyof typeof colors.eventCategory] ?? colors.eventCategory.other
  );
}

export function getDensityColor(density: number) {
  for (let index = HEATMAP_STOPS.length - 1; index >= 0; index -= 1) {
    if (density >= HEATMAP_STOPS[index].threshold) {
      return HEATMAP_STOPS[index].color;
    }
  }

  return HEATMAP_STOPS[0].color;
}

export function getDensityLabel(density: number) {
  for (let index = HEATMAP_STOPS.length - 1; index >= 0; index -= 1) {
    if (density >= HEATMAP_STOPS[index].threshold) {
      return HEATMAP_STOPS[index].label;
    }
  }

  return HEATMAP_STOPS[0].label;
}

export function getDensityOpacity(density: number) {
  if (density >= 5) {
    return 1;
  }

  if (density >= 3) {
    return 0.9;
  }

  return 0.75;
}

export function getDensityMarkerSize(density: number) {
  return 32 + Math.min(density, 10) * 2;
}

export function getContextualTimeLabel(event: Event, now = new Date()) {
  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);

  if (isEventLive(event, now)) {
    return `Happening now · until ${format(endsAt, 'h:mm a')}`;
  }

  const timeRange = `${format(startsAt, 'h:mm a')} - ${format(endsAt, 'h:mm a')}`;

  if (isSameDay(startsAt, now)) {
    return `Today · ${timeRange}`;
  }

  if (isTomorrow(startsAt)) {
    return `Tomorrow · ${format(startsAt, 'h:mm a')}`;
  }

  return `${format(startsAt, 'EEE, MMM d')} · ${timeRange}`;
}

function getLocationKey(event: Event) {
  if (event.location_name.trim().length > 0) {
    return normalizeText(event.location_name);
  }

  const latitude = event.latitude ?? 0;
  const longitude = event.longitude ?? 0;
  return `${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
}

function getEventCoordinate(event: Event): MapCoordinate | null {
  if (event.latitude === null || event.longitude === null) {
    return null;
  }

  return [event.longitude, event.latitude];
}

function matchesTimeFilter(
  event: Event,
  timeFilter: MapTimeFilter,
  customRange: EventFilterOptions['customRange'],
  now = new Date(),
) {
  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);

  switch (timeFilter) {
    case 'happening_now':
      return startsAt <= now && endsAt > now;
    case 'next_2_hours': {
      const nextWindow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return startsAt <= nextWindow && endsAt >= now;
    }
    case 'today': {
      const dayStart = startOfDay(now);
      const dayEnd = endOfDay(now);
      return startsAt <= dayEnd && endsAt >= dayStart;
    }
    case 'this_week': {
      const weekEnd = endOfDay(addDays(now, 7));
      return startsAt <= weekEnd && endsAt >= now;
    }
    case 'custom':
      if (!customRange) {
        return true;
      }
      return startsAt <= new Date(customRange.end) && endsAt >= new Date(customRange.start);
    default:
      return true;
  }
}

function matchesSearch(event: Event, query: string) {
  const needle = normalizeText(query);

  if (!needle) {
    return true;
  }

  const haystack = `${event.title} ${event.location_name} ${event.description} ${event.tags?.join(' ') ?? ''}`.toLowerCase();
  return haystack.includes(needle);
}

export function filterAndSortEvents(events: Event[], options: EventFilterOptions) {
  const filtered = events.filter((event) => {
    if (!isEventApproved(event)) {
      return false;
    }

    if (getEventStatus(event) === 'cancelled') {
      return false;
    }

    if (options.selectedCategories.length > 0 && !options.selectedCategories.includes(event.category)) {
      return false;
    }

    if (!matchesTimeFilter(event, options.timeFilter, options.customRange)) {
      return false;
    }

    if (!matchesSearch(event, options.searchQuery)) {
      return false;
    }

    if (options.onlyFriendsAttending && (event.interested_count ?? 0) <= 0) {
      return false;
    }

    return true;
  });

  return filtered.sort((left, right) => {
    if (options.sortBy === 'most_popular') {
      return (right.attendee_count ?? right.rsvp_count) - (left.attendee_count ?? left.rsvp_count);
    }

    if (options.sortBy === 'nearest' && options.userLocation) {
      const origin = toMapCoordinate(options.userLocation);
      const leftDistance = getEventCoordinate(left)
        ? getDistanceMeters(origin, getEventCoordinate(left) as MapCoordinate)
        : Number.POSITIVE_INFINITY;
      const rightDistance = getEventCoordinate(right)
        ? getDistanceMeters(origin, getEventCoordinate(right) as MapCoordinate)
        : Number.POSITIVE_INFINITY;
      return leftDistance - rightDistance;
    }

    return new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime();
  });
}

export function buildEventLocationGroups(
  events: Event[],
  mode: MarkerVisualMode,
): EventLocationGroup[] {
  const grouped = new Map<
    string,
    {
      locationName: string;
      coordinates: MapCoordinate[];
      events: Event[];
    }
  >();

  events.forEach((event) => {
    const coordinate = getEventCoordinate(event);

    if (!coordinate) {
      return;
    }

    const key = getLocationKey(event);
    const current = grouped.get(key);

    if (current) {
      current.coordinates.push(coordinate);
      current.events.push(event);
      return;
    }

    grouped.set(key, {
      locationName: event.location_name,
      coordinates: [coordinate],
      events: [event],
    });
  });

  const groups = [...grouped.entries()].map(([locationKey, group], index) => {
    const longitude =
      group.coordinates.reduce((sum, [currentLongitude]) => sum + currentLongitude, 0) /
      group.coordinates.length;
    const latitude =
      group.coordinates.reduce((sum, [, currentLatitude]) => sum + currentLatitude, 0) /
      group.coordinates.length;
    const coordinate: MapCoordinate = [longitude, latitude];
    const density = events.reduce((count, event) => {
      const eventCoordinate = getEventCoordinate(event);
      if (!eventCoordinate) {
        return count;
      }

      return getDistanceMeters(coordinate, eventCoordinate) <= DENSITY_RADIUS_METERS ? count + 1 : count;
    }, 0);

    const categoryCounts = new Map<Event['category'], number>();
    group.events.forEach((event) => {
      categoryCounts.set(event.category, (categoryCounts.get(event.category) ?? 0) + 1);
    });

    const primaryCategory =
      [...categoryCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? EventCategory.Other;
    const topAttendance = Math.max(
      ...group.events.map((event) => event.attendee_count ?? event.rsvp_count),
      0,
    );
    const isLive = group.events.some((event) => isEventLive(event));
    const markerColor = mode === 'heatmap' ? getDensityColor(density) : getCategoryColor(primaryCategory);
    const markerSize =
      mode === 'heatmap'
        ? getDensityMarkerSize(density)
        : Math.round(36 * (topAttendance > 20 ? 1.2 : 1));
    const glyph =
      mode === 'heatmap'
        ? density >= 2
          ? String(density)
          : '•'
        : CATEGORY_GLYPHS[primaryCategory] ?? CATEGORY_GLYPHS[EventCategory.Other];

    return {
      id: `group-${locationKey}-${index}`,
      locationKey,
      locationName: group.locationName,
      coordinate,
      events: group.events
        .slice()
        .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())
        .map((event) => ({
          id: event.id,
          title: event.title,
          category: event.category,
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          locationName: event.location_name,
          attendeeCount: event.attendee_count ?? event.rsvp_count,
          interestedCount: event.interested_count ?? 0,
          isLive: isEventLive(event),
        })),
      primaryCategory,
      density,
      eventCount: group.events.length,
      isLive,
      markerColor,
      markerSize,
      markerOpacity: mode === 'heatmap' ? getDensityOpacity(density) : 1,
      glyph,
      densityLabel: getDensityLabel(density),
    } satisfies EventLocationGroup;
  });

  return groups;
}

export function getLiveEventCounter(events: Event[]): LiveEventCounter {
  const now = new Date();
  const nextTwoHoursCutoff = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return {
    liveCount: events.filter((event) => isEventLive(event, now)).length,
    nextTwoHoursCount: events.filter((event) => {
      const startsAt = new Date(event.starts_at);
      return startsAt > now && startsAt <= nextTwoHoursCutoff;
    }).length,
  };
}

export function getNearestLiveEvent(events: Event[], userLocation?: MapUserLocation | null) {
  const liveEvents = events.filter((event) => isEventLive(event));

  if (liveEvents.length === 0) {
    return null;
  }

  if (!userLocation) {
    return liveEvents[0];
  }

  const origin = toMapCoordinate(userLocation);

  return liveEvents
    .filter((event) => event.latitude !== null && event.longitude !== null)
    .sort((left, right) => {
      const leftDistance = getDistanceMeters(origin, [left.longitude as number, left.latitude as number]);
      const rightDistance = getDistanceMeters(origin, [right.longitude as number, right.latitude as number]);
      return leftDistance - rightDistance;
    })[0] ?? null;
}

export function buildCampusSearchResults(
  query: string,
  events: Event[],
  buildings: Building[],
): CampusSearchResult[] {
  const needle = normalizeText(query);

  if (needle.length < 2) {
    return [];
  }

  const eventResults = events
    .filter((event) => matchesSearch(event, needle) && event.latitude !== null && event.longitude !== null)
    .slice(0, 5)
    .map((event) => ({
      id: `event-${event.id}`,
      type: 'event' as const,
      title: event.title,
      subtitle: `${event.location_name} · ${getContextualTimeLabel(event)}`,
      coordinate: [event.longitude as number, event.latitude as number] as MapCoordinate,
      eventIds: [event.id],
    }));

  const locationResults = buildings
    .filter(
      (building) =>
        normalizeText(building.name).includes(needle) ||
        normalizeText(building.code).includes(needle),
    )
    .slice(0, 5)
    .map((building) => ({
      id: `location-${building.id}`,
      type: 'location' as const,
      title: building.name,
      subtitle: `${building.code} · ${building.building_type}`,
      coordinate: [building.longitude, building.latitude] as MapCoordinate,
      eventIds: events
        .filter((event) => normalizeText(event.location_name).includes(normalizeText(building.name)))
        .map((event) => event.id),
    }));

  return [...eventResults, ...locationResults];
}
