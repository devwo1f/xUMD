import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isWithinInterval,
  parseISO,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { buildings } from '../../../assets/data/buildings';
import { colors } from '../../../shared/theme/colors';
import { EventCategory } from '../../../shared/types';
import { getDistanceMeters } from '../../map/utils/wayfinding';
import type {
  CalendarConflict,
  CalendarDateRange,
  CalendarEntry,
  CalendarSourceData,
  CalendarViewMode,
  PersonalCalendarBlock,
} from '../types';

const DAY_TOKEN_MAP: Array<{ token: string; day: number }> = [
  { token: 'sun', day: 0 },
  { token: 'sunday', day: 0 },
  { token: 'mon', day: 1 },
  { token: 'monday', day: 1 },
  { token: 'tue', day: 2 },
  { token: 'tues', day: 2 },
  { token: 'tuesday', day: 2 },
  { token: 'wed', day: 3 },
  { token: 'wednesday', day: 3 },
  { token: 'thu', day: 4 },
  { token: 'thur', day: 4 },
  { token: 'thurs', day: 4 },
  { token: 'thursday', day: 4 },
  { token: 'fri', day: 5 },
  { token: 'friday', day: 5 },
  { token: 'sat', day: 6 },
  { token: 'saturday', day: 6 },
];

const COURSE_COLOR = colors.primary.main;
const CLUB_COLOR = '#9C27B0';
const PERSONAL_COLOR = '#607D8B';
const TRAVEL_WALK_METERS_PER_MINUTE = 82;

const EVENT_ICON_MAP: Record<EventCategory, string> = {
  [EventCategory.Academic]: 'school-outline',
  [EventCategory.Social]: 'people-outline',
  [EventCategory.Sports]: 'trophy-outline',
  [EventCategory.Club]: 'flag-outline',
  [EventCategory.Career]: 'briefcase-outline',
  [EventCategory.Arts]: 'color-palette-outline',
  [EventCategory.Food]: 'restaurant-outline',
  [EventCategory.Tech]: 'hardware-chip-outline',
  [EventCategory.Talks]: 'mic-outline',
  [EventCategory.Workshop]: 'build-outline',
  [EventCategory.Party]: 'sparkles-outline',
  [EventCategory.Other]: 'calendar-outline',
};

function parseClockLabel(label: string | null | undefined) {
  if (!label) {
    return null;
  }

  const trimmed = label.trim();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const minute = Number(ampmMatch[2]);
    const period = ampmMatch[3].toUpperCase();

    if (period === 'PM' && hour < 12) {
      hour += 12;
    }
    if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    return { hour, minute };
  }

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    return {
      hour: Number(twentyFourHourMatch[1]),
      minute: Number(twentyFourHourMatch[2]),
    };
  }

  return null;
}

function buildDateTime(date: Date, clockLabel: string | null | undefined, fallbackMinutes = 0) {
  const parsed = parseClockLabel(clockLabel);
  if (!parsed) {
    const fallbackDate = new Date(date);
    fallbackDate.setMinutes(fallbackMinutes, 0, 0);
    return fallbackDate;
  }

  return set(date, {
    hours: parsed.hour,
    minutes: parsed.minute,
    seconds: 0,
    milliseconds: 0,
  });
}

function cleanScheduleText(schedule: string) {
  return schedule.toLowerCase().replace(/days?/g, '').replace(/&/g, ',').replace(/\s+/g, ' ');
}

function parseMeetingDays(schedule: string | null | undefined) {
  if (!schedule) {
    return [];
  }

  const cleaned = cleanScheduleText(schedule);
  const matches = new Set<number>();

  DAY_TOKEN_MAP.forEach(({ token, day }) => {
    if (cleaned.includes(token)) {
      matches.add(day);
    }
  });

  return [...matches].sort((left, right) => left - right);
}

function parseMeetingSchedule(schedule: string | null | undefined) {
  if (!schedule) {
    return null;
  }

  const timeMatch = schedule.match(/(\d{1,2}:\d{2}\s*[AP]M)(?:\s*-\s*(\d{1,2}:\d{2}\s*[AP]M))?/i);
  if (!timeMatch) {
    return null;
  }

  const days = parseMeetingDays(schedule);
  const locationName = schedule.slice(timeMatch.index! + timeMatch[0].length).replace(/^\s*,\s*/, '').trim();

  return {
    days,
    startLabel: timeMatch[1],
    endLabel: timeMatch[2] ?? null,
    locationName: locationName || 'TBD',
  };
}

function getClubMeetingCoordinate(locationName: string) {
  const normalized = locationName.toLowerCase();
  const match = buildings.find(
    (building) =>
      normalized.includes(building.name.toLowerCase()) ||
      normalized.includes(building.code.toLowerCase()),
  );

  return match
    ? { latitude: match.latitude, longitude: match.longitude, locationId: match.id }
    : { latitude: null, longitude: null, locationId: null };
}

function eventEntryColor(category: EventCategory) {
  return colors.eventCategory[category as keyof typeof colors.eventCategory] ?? colors.eventCategory.other;
}

export function getCalendarRange(anchorDate: Date, viewMode: CalendarViewMode): CalendarDateRange {
  if (viewMode === 'day') {
    return {
      start: startOfDay(anchorDate),
      end: endOfDay(anchorDate),
    };
  }

  if (viewMode === 'month') {
    return {
      start: startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 1 }),
    };
  }

  return {
    start: startOfWeek(anchorDate, { weekStartsOn: 1 }),
    end: endOfWeek(anchorDate, { weekStartsOn: 1 }),
  };
}

function overlapsWindow(startsAt: Date, endsAt: Date, range: CalendarDateRange) {
  return startsAt <= range.end && endsAt >= range.start;
}

function buildCourseEntries(data: CalendarSourceData, range: CalendarDateRange): CalendarEntry[] {
  const days = eachDayOfInterval({ start: range.start, end: range.end });

  return data.courses.flatMap((course) => {
    if (!course.startTime || !course.endTime) {
      return [];
    }

    const meetingDays = course.meetingDays
      .map((day) => parseMeetingDays(day)[0])
      .filter((value): value is number => typeof value === 'number');

    return days
      .filter((day) => meetingDays.includes(getDay(day)))
      .map((day) => {
        const startsAt = buildDateTime(day, course.startTime);
        const endsAt = buildDateTime(day, course.endTime);
        const locationName = [course.buildingName, course.roomNumber].filter(Boolean).join(' ') || 'TBA';
        const coordinates = getClubMeetingCoordinate(locationName);

        return {
          id: `course-${course.id}-${format(day, 'yyyy-MM-dd')}`,
          sourceId: course.id,
          type: 'course' as const,
          title: course.courseCode,
          sourceLabel: `${course.courseCode} Â· ${course.title}`,
          locationName,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          color: COURSE_COLOR,
          icon: 'school-outline',
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          locationId: coordinates.locationId,
          detail: `${course.section} Â· ${course.title}`,
          courseCode: course.courseCode,
          isRecurring: true,
        } satisfies CalendarEntry;
      });
  });
}

function buildClubMeetingEntries(data: CalendarSourceData, range: CalendarDateRange): CalendarEntry[] {
  const days = eachDayOfInterval({ start: range.start, end: range.end });

  return data.clubMeetings.flatMap((club) => {
    const parsed = parseMeetingSchedule(club.schedule);
    if (!parsed || parsed.days.length === 0) {
      return [];
    }

    const coordinates = club.latitude && club.longitude
      ? { latitude: club.latitude, longitude: club.longitude, locationId: null }
      : getClubMeetingCoordinate(parsed.locationName);

    return days
      .filter((day) => parsed.days.includes(getDay(day)))
      .map((day) => {
        const startsAt = buildDateTime(day, parsed.startLabel);
        const endsAt = buildDateTime(day, parsed.endLabel ?? null);
        if (!parsed.endLabel) {
          endsAt.setMinutes(endsAt.getMinutes() + 90);
        }

        return {
          id: `club-${club.id}-${format(day, 'yyyy-MM-dd')}`,
          sourceId: club.id,
          type: 'club_meeting' as const,
          title: club.clubName,
          sourceLabel: 'Club meeting',
          locationName: parsed.locationName,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          color: CLUB_COLOR,
          icon: 'people-outline',
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          locationId: coordinates.locationId,
          detail: club.schedule,
          clubId: club.clubId,
          isRecurring: true,
        } satisfies CalendarEntry;
      });
  });
}

function buildEventEntries(data: CalendarSourceData, range: CalendarDateRange): CalendarEntry[] {
  return data.eventRsvps
    .filter((entry) => overlapsWindow(parseISO(entry.startsAt), parseISO(entry.endsAt), range))
    .map((entry) => ({
      id: `event-${entry.eventId}-${entry.status}`,
      sourceId: entry.eventId,
      type: entry.status === 'interested' ? 'event_interested' : 'event_going',
      title: entry.title,
      sourceLabel: entry.status === 'interested' ? 'Interested' : 'Going',
      locationName: entry.locationName,
      startsAt: entry.startsAt,
      endsAt: entry.endsAt,
      color: eventEntryColor(entry.category),
      icon: EVENT_ICON_MAP[entry.category as EventCategory] ?? 'calendar-outline',
      latitude: entry.latitude ?? null,
      longitude: entry.longitude ?? null,
      detail: entry.status === 'interested' ? 'Interested RSVP' : 'Going RSVP',
      eventId: entry.eventId,
      isDashed: entry.status === 'interested',
    } satisfies CalendarEntry));
}

function shouldIncludePersonalBlock(block: PersonalCalendarBlock, date: Date) {
  if (block.recurrence === 'daily') {
    return true;
  }

  if (block.recurrence === 'weekly') {
    return (block.recurrenceDays ?? [getDay(parseISO(block.startsAt))]).includes(getDay(date));
  }

  return format(parseISO(block.startsAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
}

function buildPersonalEntries(data: CalendarSourceData, range: CalendarDateRange): CalendarEntry[] {
  const days = eachDayOfInterval({ start: range.start, end: range.end });

  return data.personalBlocks.flatMap((block) => {
    const sourceStart = parseISO(block.startsAt);
    const sourceEnd = parseISO(block.endsAt);
    const durationMinutes = Math.max(30, Math.round((sourceEnd.getTime() - sourceStart.getTime()) / 60000));

    return days
      .filter((day) => shouldIncludePersonalBlock(block, day))
      .filter((day) => day >= startOfDay(sourceStart))
      .map((day) => {
        const startsAt = set(day, {
          hours: sourceStart.getHours(),
          minutes: sourceStart.getMinutes(),
          seconds: 0,
          milliseconds: 0,
        });
        const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000);

        return {
          id: `personal-${block.id}-${format(day, 'yyyy-MM-dd')}`,
          sourceId: block.id,
          type: 'personal' as const,
          title: block.title,
          sourceLabel: 'Personal block',
          locationName: block.locationName || 'Personal time',
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          color: PERSONAL_COLOR,
          icon: 'time-outline',
          latitude: block.latitude ?? null,
          longitude: block.longitude ?? null,
          locationId: block.locationId ?? null,
          detail: block.recurrence === 'never' ? 'One-time block' : `Repeats ${block.recurrence}`,
          isRecurring: block.recurrence !== 'never',
        } satisfies CalendarEntry;
      });
  });
}

export function buildCalendarEntries(data: CalendarSourceData, range: CalendarDateRange) {
  return [
    ...buildCourseEntries(data, range),
    ...buildClubMeetingEntries(data, range),
    ...buildEventEntries(data, range),
    ...buildPersonalEntries(data, range),
  ].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
}

export function buildTodayEntries(data: CalendarSourceData, now = new Date()) {
  return buildCalendarEntries(data, {
    start: startOfDay(now),
    end: endOfDay(now),
  });
}

export function getEntryTypeLabel(entry: CalendarEntry) {
  switch (entry.type) {
    case 'course':
      return 'Course';
    case 'club_meeting':
      return 'Club meeting';
    case 'event_going':
      return 'Going';
    case 'event_interested':
      return 'Interested';
    case 'personal':
      return 'Personal';
    default:
      return 'Entry';
  }
}

export function formatCalendarTime(entry: CalendarEntry) {
  return `${format(parseISO(entry.startsAt), 'h:mm a')} - ${format(parseISO(entry.endsAt), 'h:mm a')}`;
}

export function getUpNextEntry(entries: CalendarEntry[], now = new Date()) {
  return entries.find((entry) => parseISO(entry.endsAt) >= now) ?? null;
}

function describeOverlap(left: CalendarEntry, right: CalendarEntry) {
  return `${left.title} overlaps ${right.title}`;
}

function toCoordinate(entry: CalendarEntry): [number, number] | null {
  if (typeof entry.latitude !== 'number' || typeof entry.longitude !== 'number') {
    return null;
  }

  return [entry.longitude, entry.latitude];
}

function estimateWalkingMinutes(left: CalendarEntry, right: CalendarEntry) {
  const leftCoordinate = toCoordinate(left);
  const rightCoordinate = toCoordinate(right);
  if (!leftCoordinate || !rightCoordinate) {
    return null;
  }

  const distance = getDistanceMeters(leftCoordinate, rightCoordinate);
  return Math.max(1, Math.round(distance / TRAVEL_WALK_METERS_PER_MINUTE));
}

export function buildCalendarConflicts(entries: CalendarEntry[]): CalendarConflict[] {
  const conflicts: CalendarConflict[] = [];
  const entriesByDay = new Map<string, CalendarEntry[]>();

  entries.forEach((entry) => {
    const key = format(parseISO(entry.startsAt), 'yyyy-MM-dd');
    const collection = entriesByDay.get(key) ?? [];
    collection.push(entry);
    entriesByDay.set(key, collection);
  });

  entriesByDay.forEach((dayEntries, date) => {
    const sorted = dayEntries
      .slice()
      .sort((left, right) => parseISO(left.startsAt).getTime() - parseISO(right.startsAt).getTime());

    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index];
      const currentStart = parseISO(current.startsAt);
      const currentEnd = parseISO(current.endsAt);

      for (let compareIndex = index + 1; compareIndex < sorted.length; compareIndex += 1) {
        const candidate = sorted[compareIndex];
        const candidateStart = parseISO(candidate.startsAt);
        const candidateEnd = parseISO(candidate.endsAt);

        const overlaps = currentStart < candidateEnd && candidateStart < currentEnd;
        if (!overlaps) {
          if (candidateStart > currentEnd) {
            break;
          }
          continue;
        }

        const severity = current.type === 'event_interested' || candidate.type === 'event_interested' ? 'soft' : 'hard';
        conflicts.push({
          id: `overlap-${current.id}-${candidate.id}`,
          severity,
          date,
          title: severity === 'hard' ? 'Schedule conflict' : 'Potential overlap',
          detail: describeOverlap(current, candidate),
          entryIds: [current.id, candidate.id],
        });
      }

      const next = sorted[index + 1];
      if (!next) {
        continue;
      }

      const gapMinutes = Math.round((parseISO(next.startsAt).getTime() - currentEnd.getTime()) / 60000);
      const travelMinutes = estimateWalkingMinutes(current, next);
      if (travelMinutes && gapMinutes >= 0 && gapMinutes < travelMinutes) {
        conflicts.push({
          id: `travel-${current.id}-${next.id}`,
          severity: 'travel',
          date,
          title: 'Tight travel window',
          detail: `${current.title} to ${next.title} needs about ${travelMinutes} min to walk.`,
          entryIds: [current.id, next.id],
        });
      }
    }
  });

  return conflicts;
}

export function getConflictsForDate(conflicts: CalendarConflict[], date: Date) {
  const key = format(date, 'yyyy-MM-dd');
  return conflicts.filter((conflict) => conflict.date === key);
}

export function buildMiniCalendarSummary(entries: CalendarEntry[], now = new Date()) {
  const upcoming = entries.filter((entry) => parseISO(entry.endsAt) >= now);
  const next = upcoming[0] ?? null;

  if (!next) {
    return 'Nothing scheduled today.';
  }

  const minutes = Math.max(0, Math.round((parseISO(next.startsAt).getTime() - now.getTime()) / 60000));
  const lead = minutes <= 0 ? 'Now' : `${minutes} min`;
  return `${upcoming.length} upcoming Â· Next: ${next.title} in ${lead}`;
}

export function getMonthCells(anchorDate: Date) {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 1 }),
  });
}

export function getWeekDays(anchorDate: Date) {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function entryTimesOverlap(left: CalendarEntry, right: CalendarEntry) {
  const leftStart = parseISO(left.startsAt).getTime();
  const leftEnd = parseISO(left.endsAt).getTime();
  const rightStart = parseISO(right.startsAt).getTime();
  const rightEnd = parseISO(right.endsAt).getTime();

  return leftStart < rightEnd && rightStart < leftEnd;
}

export function buildEntryLayout(entries: CalendarEntry[]) {
  const sorted = entries
    .slice()
    .sort((left, right) => {
      const startDiff = parseISO(left.startsAt).getTime() - parseISO(right.startsAt).getTime();
      if (startDiff !== 0) {
        return startDiff;
      }

      return parseISO(right.endsAt).getTime() - parseISO(left.endsAt).getTime();
    });

  const layout = new Map<string, { lane: number; laneCount: number; span: number }>();
  let cluster: CalendarEntry[] = [];
  let clusterEnd = new Date(0);

  const finalizeCluster = () => {
    if (cluster.length === 0) {
      return;
    }

    const columns: CalendarEntry[][] = [];
    const placements = new Map<string, number>();

    cluster.forEach((entry) => {
      let lane = columns.findIndex((column) => !entryTimesOverlap(column[column.length - 1], entry));
      if (lane === -1) {
        lane = columns.length;
        columns.push([]);
      }

      columns[lane].push(entry);
      placements.set(entry.id, lane);
    });

    const laneCount = Math.max(columns.length, 1);

    cluster.forEach((entry) => {
      const lane = placements.get(entry.id) ?? 0;
      let span = 1;

      for (let nextLane = lane + 1; nextLane < laneCount; nextLane += 1) {
        const blocked = columns[nextLane].some((candidate) => entryTimesOverlap(candidate, entry));
        if (blocked) {
          break;
        }
        span += 1;
      }

      layout.set(entry.id, { lane, laneCount, span });
    });

    cluster = [];
  };

  sorted.forEach((entry) => {
    const start = parseISO(entry.startsAt);
    const end = parseISO(entry.endsAt);

    if (cluster.length > 0 && start >= clusterEnd) {
      finalizeCluster();
      clusterEnd = new Date(0);
    }

    cluster.push(entry);
    clusterEnd = clusterEnd > end ? clusterEnd : end;
  });

  finalizeCluster();
  return layout;
}

export function getTimelineMetrics(
  entry: CalendarEntry,
  dayStartHour = 7,
  hourHeight = 64,
  dayEndHour = 23,
) {
  const start = parseISO(entry.startsAt);
  const end = parseISO(entry.endsAt);
  const visibleStart = set(start, {
    hours: dayStartHour,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const visibleEnd = set(start, {
    hours: dayEndHour + 1,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  if (end <= visibleStart || start >= visibleEnd) {
    return {
      top: 0,
      height: 0,
      isHidden: true,
      startsBeforeVisible: start < visibleStart,
      endsAfterVisible: end > visibleEnd,
    };
  }

  const clippedStart = start < visibleStart ? visibleStart : start;
  const clippedEnd = end > visibleEnd ? visibleEnd : end;
  const startMinutes = Math.max(0, Math.round((clippedStart.getTime() - visibleStart.getTime()) / 60000));
  const durationMinutes = Math.max(25, Math.round((clippedEnd.getTime() - clippedStart.getTime()) / 60000));

  return {
    top: (startMinutes / 60) * hourHeight,
    height: Math.max(48, (durationMinutes / 60) * hourHeight),
    isHidden: false,
    startsBeforeVisible: start < visibleStart,
    endsAfterVisible: end > visibleEnd,
  };
}

export function countEntriesForDate(entries: CalendarEntry[], date: Date) {
  return entries.filter((entry) => isWithinInterval(parseISO(entry.startsAt), { start: startOfDay(date), end: endOfDay(date) })).length;
}

export function getEntryBorderStyle(entry: CalendarEntry) {
  return entry.isDashed ? 'dashed' : 'solid';
}
