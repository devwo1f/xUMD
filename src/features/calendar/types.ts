import type { EventCategory } from '../../shared/types';

export type CalendarEntryType =
  | 'course'
  | 'club_meeting'
  | 'event_going'
  | 'event_interested'
  | 'personal';

export type CalendarViewMode = 'day' | 'week' | 'month';
export type CalendarConflictSeverity = 'hard' | 'soft' | 'travel';
export type PersonalBlockRecurrence = 'never' | 'daily' | 'weekly';

export interface PersonalCalendarBlock {
  id: string;
  userId: string;
  title: string;
  locationName: string;
  locationId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startsAt: string;
  endsAt: string;
  recurrence: PersonalBlockRecurrence;
  recurrenceDays?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarSyncPreferences {
  token: string;
  includeCourses: boolean;
  includeEventsGoing: boolean;
  includeEventsInterested: boolean;
  includeClubMeetings: boolean;
  includePersonalBlocks: boolean;
  lastSyncedAt: string | null;
}

export interface CalendarCourse {
  id: string;
  courseCode: string;
  section: string;
  title: string;
  meetingDays: string[];
  startTime: string | null;
  endTime: string | null;
  buildingName: string | null;
  roomNumber: string | null;
  locationId?: string | null;
}

export interface CalendarClubMeetingTemplate {
  id: string;
  clubId: string;
  clubName: string;
  schedule: string | null;
  locationName: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CalendarEventRsvp {
  eventId: string;
  status: 'going' | 'interested';
  title: string;
  locationName: string;
  startsAt: string;
  endsAt: string;
  latitude?: number | null;
  longitude?: number | null;
  category: EventCategory;
}

export interface CalendarSourceData {
  courses: CalendarCourse[];
  clubMeetings: CalendarClubMeetingTemplate[];
  eventRsvps: CalendarEventRsvp[];
  personalBlocks: PersonalCalendarBlock[];
}

export interface CalendarEntry {
  id: string;
  sourceId: string;
  type: CalendarEntryType;
  title: string;
  sourceLabel: string;
  locationName: string;
  startsAt: string;
  endsAt: string;
  color: string;
  icon: string;
  latitude?: number | null;
  longitude?: number | null;
  locationId?: string | null;
  detail?: string | null;
  eventId?: string;
  clubId?: string;
  courseCode?: string;
  isDashed?: boolean;
  isRecurring?: boolean;
  travelMinutesToNext?: number | null;
}

export interface CalendarConflict {
  id: string;
  severity: CalendarConflictSeverity;
  date: string;
  title: string;
  detail: string;
  entryIds: string[];
}

export interface CalendarDateRange {
  start: Date;
  end: Date;
}

export interface CalendarDetailContext {
  entry: CalendarEntry | null;
  relatedEntries: CalendarEntry[];
}
