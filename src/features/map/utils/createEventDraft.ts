import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMonths, addWeeks, endOfDay } from 'date-fns';
import { colors } from '../../../shared/theme/colors';
import { EventCategory, type Event, type EventAttachment } from '../../../shared/types';

export type EventRecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly';
export type EventVisibility = 'public' | 'club_members_only';

export interface CreateEventClubOption {
  id: string | null;
  name: string;
  logoUrl: string | null;
  type: 'personal' | 'club';
}

export interface CreateEventPersonOption {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface CreateEventLocationSelection {
  locationId: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
}

export interface EventDraftMediaAsset {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  kind: EventAttachment['kind'];
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  thumbnailUri?: string | null;
  base64Data?: string | null;
}

export interface CreateEventDraft {
  coverImage: EventDraftMediaAsset | null;
  title: string;
  category: EventCategory | null;
  startsAt: string;
  endsAt: string;
  isRecurring: boolean;
  recurrenceFrequency: EventRecurrenceFrequency;
  recurrenceUntil: string | null;
  locationQuery: string;
  locationId: string | null;
  locationName: string;
  locationDetails: string;
  latitude: number | null;
  longitude: number | null;
  organizerClubId: string | null;
  coHostClubs: CreateEventClubOption[];
  organizers: CreateEventPersonOption[];
  description: string;
  attachments: EventDraftMediaAsset[];
  maxCapacity: string;
  waitlistEnabled: boolean;
  requireApproval: boolean;
  isFree: boolean;
  ticketPrice: string;
  tags: string[];
  tagInput: string;
  visibility: EventVisibility;
  contactInfo: string;
}

export type CreateEventDraftErrors = Partial<Record<
  | 'title'
  | 'category'
  | 'startsAt'
  | 'endsAt'
  | 'location'
  | 'visibility'
  | 'ticketPrice'
  | 'maxCapacity',
  string
>>;

const DRAFT_STORAGE_KEY = 'xumd:create-event:draft';

export const EVENT_CATEGORY_OPTIONS: Array<{
  value: EventCategory;
  label: string;
  color: string;
}> = [
  { value: EventCategory.Social, label: 'Social', color: colors.eventCategory.social },
  { value: EventCategory.Academic, label: 'Academic', color: colors.eventCategory.academic },
  { value: EventCategory.Career, label: 'Career', color: colors.eventCategory.career },
  { value: EventCategory.Sports, label: 'Sports', color: colors.eventCategory.sports },
  { value: EventCategory.Arts, label: 'Arts', color: colors.eventCategory.arts },
  { value: EventCategory.Food, label: 'Food', color: colors.eventCategory.food },
  { value: EventCategory.Tech, label: 'Tech', color: colors.eventCategory.tech },
  { value: EventCategory.Workshop, label: 'Workshop', color: colors.eventCategory.workshop },
  { value: EventCategory.Talks, label: 'Talks', color: colors.eventCategory.talks },
  { value: EventCategory.Other, label: 'Other', color: colors.eventCategory.other },
];

export const TAG_SUGGESTIONS = [
  'free food',
  'networking',
  'beginner friendly',
  'outdoor',
  'workshop',
  'competition',
  'panel',
  'mixer',
];

function roundToNextQuarterHour(date: Date) {
  const next = new Date(date);
  const minutes = next.getMinutes();
  const roundedMinutes = minutes === 0 ? 0 : Math.ceil(minutes / 15) * 15;
  next.setMinutes(roundedMinutes, 0, 0);
  if (roundedMinutes === 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  }
  return next;
}

function iso(value: Date) {
  return value.toISOString();
}

function addRecurrence(date: Date, frequency: EventRecurrenceFrequency) {
  if (frequency === 'weekly') {
    return addWeeks(date, 1);
  }

  if (frequency === 'biweekly') {
    return addWeeks(date, 2);
  }

  return addMonths(date, 1);
}

export function makeDefaultCreateEventDraft(
  initialLocation?: Partial<CreateEventLocationSelection> | null,
): CreateEventDraft {
  const start = roundToNextQuarterHour(new Date(Date.now() + 60 * 60 * 1000));
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  return {
    coverImage: null,
    title: '',
    category: null,
    startsAt: iso(start),
    endsAt: iso(end),
    isRecurring: false,
    recurrenceFrequency: 'weekly',
    recurrenceUntil: null,
    locationQuery: initialLocation?.locationName ?? '',
    locationId: initialLocation?.locationId ?? null,
    locationName: initialLocation?.locationName ?? '',
    locationDetails: '',
    latitude:
      typeof initialLocation?.latitude === 'number' ? initialLocation.latitude : null,
    longitude:
      typeof initialLocation?.longitude === 'number' ? initialLocation.longitude : null,
    organizerClubId: null,
    coHostClubs: [],
    organizers: [],
    description: '',
    attachments: [],
    maxCapacity: '',
    waitlistEnabled: false,
    requireApproval: false,
    isFree: true,
    ticketPrice: '',
    tags: [],
    tagInput: '',
    visibility: 'public',
    contactInfo: '',
  };
}

export function buildCreateEventDraftErrors(draft: CreateEventDraft): CreateEventDraftErrors {
  const nextErrors: CreateEventDraftErrors = {};
  const startsAt = new Date(draft.startsAt);
  const endsAt = new Date(draft.endsAt);

  if (draft.title.trim().length < 3) {
    nextErrors.title = 'Event name must be at least 3 characters.';
  }

  if (!draft.category) {
    nextErrors.category = 'Choose a category.';
  }

  if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
    nextErrors.startsAt = 'Start time must be in the future.';
  }

  if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    nextErrors.endsAt = 'End time must be after the start time.';
  }

  if (
    !draft.locationName.trim() ||
    typeof draft.latitude !== 'number' ||
    typeof draft.longitude !== 'number'
  ) {
    nextErrors.location = 'Pick a campus location.';
  }

  if (draft.visibility === 'club_members_only' && !draft.organizerClubId) {
    nextErrors.visibility = 'Club Members Only requires an organizing club.';
  }

  if (!draft.isFree) {
    const price = Number(draft.ticketPrice);
    if (!Number.isFinite(price) || price < 0) {
      nextErrors.ticketPrice = 'Enter a valid ticket price.';
    }
  }

  if (draft.maxCapacity.trim().length > 0) {
    const capacity = Number(draft.maxCapacity);
    if (!Number.isFinite(capacity) || capacity < 1) {
      nextErrors.maxCapacity = 'Capacity must be at least 1.';
    }
  }

  return nextErrors;
}

export function isCreateEventDraftPublishable(draft: CreateEventDraft) {
  return Object.keys(buildCreateEventDraftErrors(draft)).length === 0;
}

export function normalizeTag(value: string) {
  return value.trim().replace(/^#/, '').toLowerCase();
}

export function addTagToDraft(draft: CreateEventDraft, rawValue: string) {
  const normalized = normalizeTag(rawValue);
  if (!normalized || draft.tags.includes(normalized) || draft.tags.length >= 8) {
    return draft.tags;
  }

  return [...draft.tags, normalized];
}

export function buildDraftOccurrences(draft: CreateEventDraft) {
  const startsAt = new Date(draft.startsAt);
  const endsAt = new Date(draft.endsAt);

  if (!draft.isRecurring || !draft.recurrenceUntil) {
    return [{ startsAt, endsAt }];
  }

  const inclusiveUntil = endOfDay(new Date(draft.recurrenceUntil));
  const occurrences: Array<{ startsAt: Date; endsAt: Date }> = [];
  let cursorStart = new Date(startsAt);
  let cursorEnd = new Date(endsAt);

  while (cursorStart <= inclusiveUntil && occurrences.length < 52) {
    occurrences.push({ startsAt: new Date(cursorStart), endsAt: new Date(cursorEnd) });
    cursorStart = addRecurrence(cursorStart, draft.recurrenceFrequency);
    cursorEnd = addRecurrence(cursorEnd, draft.recurrenceFrequency);
  }

  return occurrences;
}

export async function loadSavedCreateEventDraft() {
  const raw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CreateEventDraft;
  } catch {
    return null;
  }
}

export async function saveCreateEventDraft(draft: CreateEventDraft) {
  await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export async function clearSavedCreateEventDraft() {
  await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
}

function buildAttachmentItems(
  attachments: EventDraftMediaAsset[],
): EventAttachment[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    path: attachment.uri,
    file_name: attachment.fileName,
    mime_type: attachment.mimeType,
    kind: attachment.kind,
    size_bytes: attachment.sizeBytes ?? null,
  }));
}

export function buildLocalDraftEvents(input: {
  draft: CreateEventDraft;
  viewerId: string;
  viewerName: string;
  coverImageUrl?: string | null;
}) {
  const occurrences = buildDraftOccurrences(input.draft);
  const baseId = `local-event-${Date.now()}`;

  return occurrences.map((occurrence, index) => ({
    id: `${baseId}-${index}`,
    title: input.draft.title.trim(),
    description: input.draft.description.trim(),
    club_id: input.draft.organizerClubId,
    created_by: input.viewerId,
    organizer_name: input.viewerName,
    organizer_ids: [input.viewerId, ...input.draft.organizers.map((person) => person.id)],
    co_host_club_ids: input.draft.coHostClubs
      .map((club) => club.id)
      .filter((clubId): clubId is string => Boolean(clubId)),
    category: input.draft.category ?? EventCategory.Other,
    starts_at: occurrence.startsAt.toISOString(),
    ends_at: occurrence.endsAt.toISOString(),
    recurrence_frequency: input.draft.isRecurring ? input.draft.recurrenceFrequency : null,
    recurs_until: input.draft.isRecurring ? input.draft.recurrenceUntil : null,
    series_root_id: input.draft.isRecurring ? baseId : null,
    status: 'upcoming' as const,
    moderation_status: 'approved' as const,
    location_name: input.draft.locationName.trim(),
    location_id: input.draft.locationId,
    location_details: input.draft.locationDetails.trim() || null,
    latitude: input.draft.latitude,
    longitude: input.draft.longitude,
    image_url: input.coverImageUrl ?? input.draft.coverImage?.uri ?? null,
    attachments: buildAttachmentItems(input.draft.attachments),
    rsvp_count: 1,
    attendee_count: 1,
    interested_count: 0,
    max_capacity:
      input.draft.maxCapacity.trim().length > 0 ? Number(input.draft.maxCapacity) : null,
    waitlist_enabled:
      input.draft.maxCapacity.trim().length > 0 && input.draft.waitlistEnabled,
    require_approval: input.draft.requireApproval,
    is_free: input.draft.isFree,
    ticket_price: input.draft.isFree ? null : Number(input.draft.ticketPrice),
    visibility: input.draft.visibility,
    contact_info: input.draft.contactInfo.trim() || null,
    is_featured: false,
    tags: input.draft.tags,
    location: input.draft.locationName.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) satisfies Event[];
}
