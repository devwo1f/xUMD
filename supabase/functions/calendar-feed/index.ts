import { addDays, eachDayOfInterval, format, getDay, parseISO, set, startOfDay } from 'https://esm.sh/date-fns@4.1.0';
import { withCorsHeaders } from '../_shared/cors.ts';
import { HttpError } from '../_shared/errors.ts';
import { errorResponse, handleOptions } from '../_shared/http.ts';
import { createAdminClient } from '../_shared/supabase.ts';

type CalendarSyncPreferenceRow = {
  user_id: string;
  token: string;
  include_courses: boolean;
  include_events_going: boolean;
  include_events_interested: boolean;
  include_club_meetings: boolean;
  include_personal_blocks: boolean;
  last_synced_at: string | null;
};

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  clubs: string[] | null;
  courses: string[] | null;
};

type CourseRow = {
  id: string;
  course_code: string;
  section: string;
  title: string;
  meeting_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  building_name: string | null;
  room_number: string | null;
};

type ClubRow = {
  id: string;
  name: string;
  meeting_schedule: string | null;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location_name: string;
  starts_at: string;
  ends_at: string;
  category: string;
};

type PersonalBlockRow = {
  id: string;
  title: string;
  location_name: string;
  starts_at: string;
  ends_at: string;
  recurrence: 'never' | 'daily' | 'weekly';
  recurrence_days: number[] | null;
};

type IcsEntry = {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
};

const WINDOW_START = startOfDay(new Date());
const WINDOW_END = addDays(WINDOW_START, 90);
const DAY_TOKEN_MAP: Array<{ token: string; day: number; byDay: string }> = [
  { token: 'sun', day: 0, byDay: 'SU' },
  { token: 'sunday', day: 0, byDay: 'SU' },
  { token: 'mon', day: 1, byDay: 'MO' },
  { token: 'monday', day: 1, byDay: 'MO' },
  { token: 'tue', day: 2, byDay: 'TU' },
  { token: 'tues', day: 2, byDay: 'TU' },
  { token: 'tuesday', day: 2, byDay: 'TU' },
  { token: 'wed', day: 3, byDay: 'WE' },
  { token: 'wednesday', day: 3, byDay: 'WE' },
  { token: 'thu', day: 4, byDay: 'TH' },
  { token: 'thur', day: 4, byDay: 'TH' },
  { token: 'thurs', day: 4, byDay: 'TH' },
  { token: 'thursday', day: 4, byDay: 'TH' },
  { token: 'fri', day: 5, byDay: 'FR' },
  { token: 'friday', day: 5, byDay: 'FR' },
  { token: 'sat', day: 6, byDay: 'SA' },
  { token: 'saturday', day: 6, byDay: 'SA' },
];

function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: withCorsHeaders({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    }),
  });
}

function escapeIcsText(value: string | undefined | null) {
  return (value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

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
    const fallback = new Date(date);
    fallback.setHours(12, fallbackMinutes, 0, 0);
    return fallback;
  }

  return set(date, {
    hours: parsed.hour,
    minutes: parsed.minute,
    seconds: 0,
    milliseconds: 0,
  });
}

function parseMeetingDays(values: Array<string | null> | string | null | undefined) {
  const text = Array.isArray(values)
    ? values.filter(Boolean).join(' ').toLowerCase()
    : (values ?? '').toLowerCase();
  const matches = new Map<number, string>();

  DAY_TOKEN_MAP.forEach(({ token, day, byDay }) => {
    if (text.includes(token)) {
      matches.set(day, byDay);
    }
  });

  return [...matches.entries()].sort((left, right) => left[0] - right[0]);
}

function parseMeetingSchedule(schedule: string | null | undefined) {
  if (!schedule) {
    return null;
  }

  const timeMatch = schedule.match(/(\d{1,2}:\d{2}\s*[AP]M)(?:\s*-\s*(\d{1,2}:\d{2}\s*[AP]M))?/i);
  if (!timeMatch) {
    return null;
  }

  const dayEntries = parseMeetingDays(schedule);
  if (dayEntries.length === 0) {
    return null;
  }

  const locationName = schedule
    .slice((timeMatch.index ?? 0) + timeMatch[0].length)
    .replace(/^\s*,\s*/, '')
    .trim() || 'TBD';

  return {
    dayEntries,
    startLabel: timeMatch[1],
    endLabel: timeMatch[2] ?? null,
    locationName,
  };
}

function buildRecurringEntries({
  days,
  startLabel,
  endLabel,
  windowStart = WINDOW_START,
  windowEnd = WINDOW_END,
  build,
}: {
  days: number[];
  startLabel: string | null | undefined;
  endLabel: string | null | undefined;
  windowStart?: Date;
  windowEnd?: Date;
  build: (date: Date, startsAt: Date, endsAt: Date) => IcsEntry;
}) {
  const allDays = eachDayOfInterval({ start: windowStart, end: windowEnd });
  const entries: IcsEntry[] = [];

  for (const day of allDays) {
    if (!days.includes(getDay(day))) {
      continue;
    }

    const startsAt = buildDateTime(day, startLabel);
    const endsAt = buildDateTime(day, endLabel);
    if (!endLabel) {
      endsAt.setMinutes(endsAt.getMinutes() + 90);
    }
    if (endsAt <= startsAt) {
      endsAt.setHours(startsAt.getHours() + 1, startsAt.getMinutes(), 0, 0);
    }

    entries.push(build(day, startsAt, endsAt));
  }

  return entries;
}

function buildPersonalEntries(blocks: PersonalBlockRow[]) {
  const entries: IcsEntry[] = [];

  for (const block of blocks) {
    const start = parseISO(block.starts_at);
    const end = parseISO(block.ends_at);
    const duration = Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000));

    if (block.recurrence === 'never') {
      if (start >= WINDOW_START && start <= WINDOW_END) {
        entries.push({
          uid: `personal-${block.id}@xumd`,
          summary: block.title,
          description: 'Personal block from xUMD',
          location: block.location_name,
          startsAt: start,
          endsAt: end,
        });
      }
      continue;
    }

    const allDays = eachDayOfInterval({
      start: WINDOW_START > start ? WINDOW_START : startOfDay(start),
      end: WINDOW_END,
    });
    const allowedDays =
      block.recurrence === 'daily'
        ? [0, 1, 2, 3, 4, 5, 6]
        : block.recurrence_days?.length
          ? block.recurrence_days
          : [getDay(start)];

    for (const day of allDays) {
      if (!allowedDays.includes(getDay(day))) {
        continue;
      }

      const startsAt = set(day, {
        hours: start.getHours(),
        minutes: start.getMinutes(),
        seconds: 0,
        milliseconds: 0,
      });
      const endsAt = new Date(startsAt.getTime() + duration * 60000);
      entries.push({
        uid: `personal-${block.id}-${format(day, 'yyyyMMdd')}@xumd`,
        summary: block.title,
        description: 'Personal block from xUMD',
        location: block.location_name,
        startsAt,
        endsAt,
      });
    }
  }

  return entries;
}

function toIcs(entries: IcsEntry[]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//xUMD//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:xUMD Schedule',
    'X-WR-TIMEZONE:UTC',
  ];

  for (const entry of entries.sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeIcsText(entry.uid)}`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(entry.startsAt)}`,
      `DTEND:${formatIcsDate(entry.endsAt)}`,
      `SUMMARY:${escapeIcsText(entry.summary)}`,
      `DESCRIPTION:${escapeIcsText(entry.description)}`,
      `LOCATION:${escapeIcsText(entry.location)}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    if (request.method !== 'GET') {
      throw new HttpError(405, 'bad_request', 'Method not allowed.');
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token')?.trim();
    if (!token) {
      throw new HttpError(400, 'bad_request', 'Missing calendar feed token.');
    }

    const admin = createAdminClient();
    const { data: preferenceRow, error: preferenceError } = await admin
      .from('calendar_sync_preferences')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (preferenceError) {
      throw preferenceError;
    }
    if (!preferenceRow) {
      throw new HttpError(404, 'not_found', 'Calendar feed not found.');
    }

    const preferences = preferenceRow as CalendarSyncPreferenceRow;
    const { data: userRow, error: userError } = await admin
      .from('users')
      .select('id, email, display_name, clubs, courses')
      .eq('id', preferences.user_id)
      .single();

    if (userError) {
      throw userError;
    }

    const user = userRow as UserRow;
    const entries: IcsEntry[] = [];

    if (preferences.include_courses) {
      const semester = (() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        if (month <= 4) return `Spring ${year}`;
        if (month <= 7) return `Summer ${year}`;
        return `Fall ${year}`;
      })();

      const { data: userCourseRows } = await admin
        .from('user_courses')
        .select('course_id, course_code')
        .eq('user_id', user.id)
        .eq('semester', semester);

      let courseRows: CourseRow[] = [];
      if ((userCourseRows ?? []).length > 0) {
        const courseIds = (userCourseRows ?? []).map((row) => row.course_id).filter(Boolean);
        if (courseIds.length > 0) {
          const { data } = await admin
            .from('courses')
            .select('id, course_code, section, title, meeting_days, start_time, end_time, building_name, room_number')
            .in('id', courseIds);
          courseRows = (data ?? []) as CourseRow[];
        }
      } else if ((user.courses ?? []).length > 0) {
        const { data } = await admin
          .from('courses')
          .select('id, course_code, section, title, meeting_days, start_time, end_time, building_name, room_number')
          .eq('semester', semester)
          .in('course_code', user.courses ?? []);
        courseRows = (data ?? []) as CourseRow[];
      }

      for (const course of courseRows) {
        const meetingDays = parseMeetingDays(course.meeting_days ?? []);
        if (meetingDays.length === 0) {
          continue;
        }

        entries.push(
          ...buildRecurringEntries({
            days: meetingDays.map(([day]) => day),
            startLabel: course.start_time,
            endLabel: course.end_time,
            build: (day, startsAt, endsAt) => ({
              uid: `course-${course.id}-${format(day, 'yyyyMMdd')}@xumd`,
              summary: `${course.course_code} · ${course.title}`,
              description: `Section ${course.section} · Synced from xUMD`,
              location: [course.building_name, course.room_number].filter(Boolean).join(' ') || 'TBA',
              startsAt,
              endsAt,
            }),
          }),
        );
      }
    }

    if (preferences.include_club_meetings && (user.clubs ?? []).length > 0) {
      const { data: clubRows } = await admin
        .from('clubs')
        .select('id, name, meeting_schedule')
        .in('name', user.clubs ?? []);

      for (const club of (clubRows ?? []) as ClubRow[]) {
        const parsed = parseMeetingSchedule(club.meeting_schedule);
        if (!parsed) {
          continue;
        }

        entries.push(
          ...buildRecurringEntries({
            days: parsed.dayEntries.map(([day]) => day),
            startLabel: parsed.startLabel,
            endLabel: parsed.endLabel,
            build: (day, startsAt, endsAt) => ({
              uid: `club-${club.id}-${format(day, 'yyyyMMdd')}@xumd`,
              summary: `${club.name} meeting`,
              description: club.meeting_schedule ?? 'Club meeting from xUMD',
              location: parsed.locationName,
              startsAt,
              endsAt,
            }),
          }),
        );
      }
    }

    if (preferences.include_events_going || preferences.include_events_interested) {
      const statuses = [
        ...(preferences.include_events_going ? ['going'] : []),
        ...(preferences.include_events_interested ? ['interested'] : []),
      ];

      if (statuses.length > 0) {
        const { data: rsvpRows } = await admin
          .from('event_rsvps')
          .select('status, event:events(id, title, description, location_name, starts_at, ends_at, category)')
          .eq('user_id', user.id)
          .in('status', statuses);

        for (const row of rsvpRows ?? []) {
          const event = row.event as EventRow | null;
          if (!event) {
            continue;
          }
          const startsAt = parseISO(event.starts_at);
          if (startsAt < WINDOW_START || startsAt > WINDOW_END) {
            continue;
          }

          entries.push({
            uid: `event-${event.id}-${row.status}@xumd`,
            summary: event.title,
            description: `${row.status === 'interested' ? 'Interested' : 'Going'} · ${event.description ?? 'xUMD event'}`,
            location: event.location_name,
            startsAt,
            endsAt: parseISO(event.ends_at),
          });
        }
      }
    }

    if (preferences.include_personal_blocks) {
      const { data: blockRows } = await admin
        .from('calendar_personal_blocks')
        .select('id, title, location_name, starts_at, ends_at, recurrence, recurrence_days')
        .eq('user_id', user.id)
        .order('starts_at', { ascending: true });

      entries.push(...buildPersonalEntries((blockRows ?? []) as PersonalBlockRow[]));
    }

    await admin
      .from('calendar_sync_preferences')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return textResponse(toIcs(entries));
  } catch (error) {
    return errorResponse(error);
  }
});
