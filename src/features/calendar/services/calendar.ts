import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockClubs, mockClubEvents } from '../../../assets/data/mockClubs';
import { mockCampusEvents } from '../../../assets/data/mockEvents';
import { type Event, type UserProfile } from '../../../shared/types';
import { isSupabaseConfigured, supabase } from '../../../services/supabase';
import type {
  CalendarClubMeetingTemplate,
  CalendarCourse,
  CalendarEventRsvp,
  CalendarSourceData,
  CalendarSyncPreferences,
  PersonalCalendarBlock,
} from '../types';

const PERSONAL_BLOCKS_PREFIX = 'xumd:calendar:personal-blocks';
const SYNC_SETTINGS_PREFIX = 'xumd:calendar:sync-settings';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PersonalBlockRow = {
  id: string;
  user_id: string;
  title: string;
  location_name: string;
  location_id: string | null;
  latitude: number | null;
  longitude: number | null;
  starts_at: string;
  ends_at: string;
  recurrence: 'never' | 'daily' | 'weekly';
  recurrence_days: number[] | null;
  created_at: string;
  updated_at: string;
};

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

function inferCurrentSemester() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month <= 4) {
    return `Spring ${year}`;
  }

  if (month <= 7) {
    return `Summer ${year}`;
  }

  return `Fall ${year}`;
}

function personalBlocksKey(userId: string) {
  return `${PERSONAL_BLOCKS_PREFIX}:${userId}`;
}

function syncSettingsKey(userId: string) {
  return `${SYNC_SETTINGS_PREFIX}:${userId}`;
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function shouldUseRemoteCalendar(userId: string) {
  return isSupabaseConfigured && UUID_REGEX.test(userId);
}

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const value = Math.floor(Math.random() * 16);
    const adjusted = token === 'x' ? value : (value & 0x3) | 0x8;
    return adjusted.toString(16);
  });
}

function generateSyncToken() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function toCalendarCourse(row: Record<string, unknown>): CalendarCourse {
  return {
    id: String(row.id),
    courseCode: String(row.course_code ?? ''),
    section: String(row.section ?? ''),
    title: String(row.title ?? ''),
    meetingDays: Array.isArray(row.meeting_days) ? (row.meeting_days as string[]) : [],
    startTime: typeof row.start_time === 'string' ? row.start_time : null,
    endTime: typeof row.end_time === 'string' ? row.end_time : null,
    buildingName: typeof row.building_name === 'string' ? row.building_name : null,
    roomNumber: typeof row.room_number === 'string' ? row.room_number : null,
    locationId: typeof row.location_id === 'string' ? row.location_id : null,
  };
}

function toCalendarEventRsvp(row: Record<string, unknown>): CalendarEventRsvp | null {
  const event = row.event as Event | null | undefined;
  if (!event?.id) {
    return null;
  }

  return {
    eventId: event.id,
    status: row.status === 'interested' ? 'interested' : 'going',
    title: event.title,
    locationName: event.location_name,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    latitude: event.latitude,
    longitude: event.longitude,
    category: event.category,
  };
}

function buildDemoEventRsvps(goingEventIds: string[], interestedEventIds: string[]) {
  const source = uniqueById([...mockCampusEvents, ...mockClubEvents]);
  const byId = new Map(source.map((event) => [event.id, event]));

  const goingEntries = goingEventIds
    .map((id) => byId.get(id))
    .filter((event): event is Event => Boolean(event))
    .map((event) => ({
      eventId: event.id,
      status: 'going' as const,
      title: event.title,
      locationName: event.location_name,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      latitude: event.latitude,
      longitude: event.longitude,
      category: event.category,
    }));

  const interestedEntries = interestedEventIds
    .filter((id) => !goingEventIds.includes(id))
    .map((id) => byId.get(id))
    .filter((event): event is Event => Boolean(event))
    .map((event) => ({
      eventId: event.id,
      status: 'interested' as const,
      title: event.title,
      locationName: event.location_name,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      latitude: event.latitude,
      longitude: event.longitude,
      category: event.category,
    }));

  return [...goingEntries, ...interestedEntries];
}

function buildClubMeetingTemplates(joinedClubIds: string[], userClubs: string[] = []) {
  const resolved = mockClubs.filter(
    (club) => joinedClubIds.includes(club.id) || userClubs.includes(club.name),
  );

  return resolved.map((club) => ({
    id: club.id,
    clubId: club.id,
    clubName: club.name,
    schedule: club.meeting_schedule,
    locationName: club.meeting_schedule?.split(',').slice(-1)[0]?.trim() || club.name,
  }));
}

function toPersonalBlock(row: PersonalBlockRow): PersonalCalendarBlock {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    locationName: row.location_name,
    locationId: row.location_id,
    latitude: row.latitude,
    longitude: row.longitude,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    recurrence: row.recurrence,
    recurrenceDays: row.recurrence_days ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSyncPreferences(row: CalendarSyncPreferenceRow): CalendarSyncPreferences {
  return {
    token: row.token,
    includeCourses: row.include_courses,
    includeEventsGoing: row.include_events_going,
    includeEventsInterested: row.include_events_interested,
    includeClubMeetings: row.include_club_meetings,
    includePersonalBlocks: row.include_personal_blocks,
    lastSyncedAt: row.last_synced_at,
  };
}

async function loadPersonalCalendarBlocksLocal(userId: string) {
  const raw = await AsyncStorage.getItem(personalBlocksKey(userId));
  if (!raw) {
    return [] as PersonalCalendarBlock[];
  }

  try {
    return JSON.parse(raw) as PersonalCalendarBlock[];
  } catch {
    return [] as PersonalCalendarBlock[];
  }
}

async function savePersonalCalendarBlocksLocal(userId: string, blocks: PersonalCalendarBlock[]) {
  await AsyncStorage.setItem(personalBlocksKey(userId), JSON.stringify(blocks));
}

async function loadRemotePersonalBlocks(userId: string) {
  const { data, error } = await supabase
    .from('calendar_personal_blocks')
    .select('*')
    .eq('user_id', userId)
    .order('starts_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toPersonalBlock(row as PersonalBlockRow));
}

async function ensureRemoteSyncPreferences(userId: string) {
  const { data, error } = await supabase
    .from('calendar_sync_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return toSyncPreferences(data as CalendarSyncPreferenceRow);
  }

  const fallback = buildDefaultSyncPreferences();
  const { data: inserted, error: insertError } = await supabase
    .from('calendar_sync_preferences')
    .insert({
      user_id: userId,
      token: fallback.token,
      include_courses: fallback.includeCourses,
      include_events_going: fallback.includeEventsGoing,
      include_events_interested: fallback.includeEventsInterested,
      include_club_meetings: fallback.includeClubMeetings,
      include_personal_blocks: fallback.includePersonalBlocks,
      last_synced_at: fallback.lastSyncedAt,
    })
    .select('*')
    .single();

  if (insertError) {
    throw insertError;
  }

  return toSyncPreferences(inserted as CalendarSyncPreferenceRow);
}

function buildDefaultSyncPreferences(): CalendarSyncPreferences {
  return {
    token: generateSyncToken(),
    includeCourses: true,
    includeEventsGoing: true,
    includeEventsInterested: false,
    includeClubMeetings: true,
    includePersonalBlocks: true,
    lastSyncedAt: null,
  };
}

export async function loadPersonalCalendarBlocks(userId: string) {
  if (shouldUseRemoteCalendar(userId)) {
    try {
      return await loadRemotePersonalBlocks(userId);
    } catch (error) {
      console.warn('Falling back to local personal blocks.', error);
    }
  }

  return loadPersonalCalendarBlocksLocal(userId);
}

export async function upsertPersonalCalendarBlock(
  userId: string,
  block: Omit<PersonalCalendarBlock, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string },
) {
  if (shouldUseRemoteCalendar(userId)) {
    try {
      const nextId = block.id && UUID_REGEX.test(block.id) ? block.id : generateUuid();
      const { data, error } = await supabase
        .from('calendar_personal_blocks')
        .upsert(
          {
            id: nextId,
            user_id: userId,
            title: block.title,
            location_name: block.locationName,
            location_id: block.locationId ?? null,
            latitude: block.latitude ?? null,
            longitude: block.longitude ?? null,
            starts_at: block.startsAt,
            ends_at: block.endsAt,
            recurrence: block.recurrence,
            recurrence_days: block.recurrenceDays ?? [],
          },
          { onConflict: 'id' },
        )
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return toPersonalBlock(data as PersonalBlockRow);
    } catch (error) {
      console.warn('Falling back to local personal block save.', error);
    }
  }

  const current = await loadPersonalCalendarBlocksLocal(userId);
  const now = new Date().toISOString();
  const nextBlock: PersonalCalendarBlock = {
    id: block.id ?? `block-${Date.now()}`,
    userId,
    title: block.title,
    locationName: block.locationName,
    locationId: block.locationId ?? null,
    latitude: block.latitude ?? null,
    longitude: block.longitude ?? null,
    startsAt: block.startsAt,
    endsAt: block.endsAt,
    recurrence: block.recurrence,
    recurrenceDays: block.recurrenceDays ?? [],
    createdAt: current.find((entry) => entry.id === block.id)?.createdAt ?? now,
    updatedAt: now,
  };

  const next = [nextBlock, ...current.filter((entry) => entry.id !== nextBlock.id)];
  await savePersonalCalendarBlocksLocal(userId, next);
  return nextBlock;
}

export async function deletePersonalCalendarBlock(userId: string, blockId: string) {
  if (shouldUseRemoteCalendar(userId) && UUID_REGEX.test(blockId)) {
    try {
      const { error } = await supabase
        .from('calendar_personal_blocks')
        .delete()
        .eq('user_id', userId)
        .eq('id', blockId);

      if (error) {
        throw error;
      }
      return;
    } catch (error) {
      console.warn('Falling back to local personal block delete.', error);
    }
  }

  const current = await loadPersonalCalendarBlocksLocal(userId);
  const next = current.filter((entry) => entry.id !== blockId);
  await savePersonalCalendarBlocksLocal(userId, next);
}

export async function loadCalendarSyncPreferences(userId: string) {
  if (shouldUseRemoteCalendar(userId)) {
    try {
      return await ensureRemoteSyncPreferences(userId);
    } catch (error) {
      console.warn('Falling back to local calendar sync preferences.', error);
    }
  }

  const raw = await AsyncStorage.getItem(syncSettingsKey(userId));
  if (!raw) {
    const next = buildDefaultSyncPreferences();
    await AsyncStorage.setItem(syncSettingsKey(userId), JSON.stringify(next));
    return next;
  }

  try {
    return JSON.parse(raw) as CalendarSyncPreferences;
  } catch {
    const next = buildDefaultSyncPreferences();
    await AsyncStorage.setItem(syncSettingsKey(userId), JSON.stringify(next));
    return next;
  }
}

export async function saveCalendarSyncPreferences(userId: string, preferences: CalendarSyncPreferences) {
  if (shouldUseRemoteCalendar(userId)) {
    try {
      const { error } = await supabase.from('calendar_sync_preferences').upsert(
        {
          user_id: userId,
          token: preferences.token,
          include_courses: preferences.includeCourses,
          include_events_going: preferences.includeEventsGoing,
          include_events_interested: preferences.includeEventsInterested,
          include_club_meetings: preferences.includeClubMeetings,
          include_personal_blocks: preferences.includePersonalBlocks,
          last_synced_at: preferences.lastSyncedAt,
        },
        { onConflict: 'user_id' },
      );

      if (error) {
        throw error;
      }
      return;
    } catch (error) {
      console.warn('Falling back to local calendar sync preference save.', error);
    }
  }

  await AsyncStorage.setItem(syncSettingsKey(userId), JSON.stringify(preferences));
}

export async function regenerateCalendarSyncToken(userId: string) {
  const next = {
    ...(await loadCalendarSyncPreferences(userId)),
    token: generateSyncToken(),
    lastSyncedAt: new Date().toISOString(),
  } satisfies CalendarSyncPreferences;

  await saveCalendarSyncPreferences(userId, next);
  return next;
}

export function buildCalendarFeedUrl(preferences: CalendarSyncPreferences) {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL
    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/calendar-feed`
    : 'https://calendar.xumd.app/feed';

  return `${base}?token=${preferences.token}`;
}

export async function loadCalendarSourceData({
  viewerId,
  user,
  joinedClubIds,
  goingEventIds,
  interestedEventIds,
}: {
  viewerId: string;
  user: UserProfile | null;
  joinedClubIds: string[];
  goingEventIds: string[];
  interestedEventIds: string[];
}): Promise<CalendarSourceData> {
  const personalBlocks = await loadPersonalCalendarBlocks(viewerId);
  const clubMeetings = buildClubMeetingTemplates(joinedClubIds, user?.clubs ?? []);

  if (!isSupabaseConfigured || !user?.id) {
    return {
      courses: [],
      clubMeetings,
      eventRsvps: buildDemoEventRsvps(goingEventIds, interestedEventIds),
      personalBlocks,
    };
  }

  const semester = inferCurrentSemester();
  let courses: CalendarCourse[] = [];

  const { data: userCourseRows } = await supabase
    .from('user_courses')
    .select('id, course_code, section, semester, meeting_days, start_time, end_time, building_name, room_number, course_id')
    .eq('user_id', user.id)
    .eq('semester', semester);

  if ((userCourseRows ?? []).length > 0) {
    const { data: courseRows } = await supabase
      .from('courses')
      .select('id, course_code, section, title, meeting_days, start_time, end_time, building_name, room_number, location_id')
      .eq('semester', semester)
      .in('id', (userCourseRows ?? []).map((row) => row.course_id).filter(Boolean));

    courses = (courseRows ?? []).map((row) => toCalendarCourse(row as Record<string, unknown>));
  } else if ((user.courses ?? []).length > 0) {
    const { data: courseRows } = await supabase
      .from('courses')
      .select('id, course_code, section, title, meeting_days, start_time, end_time, building_name, room_number, location_id')
      .eq('semester', semester)
      .in('course_code', user.courses ?? [])
      .order('course_code', { ascending: true })
      .order('section', { ascending: true });

    const firstByCode = new Map<string, CalendarCourse>();
    (courseRows ?? []).forEach((row) => {
      const next = toCalendarCourse(row as Record<string, unknown>);
      if (!firstByCode.has(next.courseCode)) {
        firstByCode.set(next.courseCode, next);
      }
    });
    courses = [...firstByCode.values()];
  }

  const { data: rsvpRows } = await supabase
    .from('event_rsvps')
    .select('status, event:events(*)')
    .eq('user_id', user.id);

  const eventRsvps = (rsvpRows ?? [])
    .map((row) => toCalendarEventRsvp(row as Record<string, unknown>))
    .filter((entry): entry is CalendarEventRsvp => Boolean(entry));

  return {
    courses,
    clubMeetings,
    eventRsvps:
      eventRsvps.length > 0
        ? eventRsvps
        : buildDemoEventRsvps(goingEventIds, interestedEventIds),
    personalBlocks,
  };
}
