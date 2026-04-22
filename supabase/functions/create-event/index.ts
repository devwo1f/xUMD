import { HttpError } from '../_shared/errors.ts';
import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import {
  findNearestCampusLocation,
  invalidateMapEventCaches,
  signEventCoverUrl,
  toMapEventSummary,
  type CampusLocationRow,
  type EventRow,
} from '../_shared/map.ts';
import { fetchCampusLocations, fetchEventById } from '../_shared/map-records.ts';
import { syncCampusEventToMeilisearch } from '../_shared/meilisearch.ts';
import { moderateImage } from '../_shared/moderation.ts';
import { moderateText } from '../_shared/openai.ts';
import { fetchUsersByIds } from '../_shared/records.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';
import { getRedis } from '../_shared/upstash.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

interface CreateEventImageInput {
  base64Data: string;
  fileName: string;
  mimeType: string;
}

interface CreateEventAttachmentInput extends CreateEventImageInput {
  kind: 'image' | 'video' | 'document';
  sizeBytes?: number | null;
}

interface CreateEventRecurrenceInput {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  until: string;
}

interface CreateEventRequest {
  title: string;
  description: string;
  category:
    | 'academic'
    | 'social'
    | 'sports'
    | 'club'
    | 'career'
    | 'arts'
    | 'food'
    | 'tech'
    | 'talks'
    | 'workshop'
    | 'party'
    | 'other';
  clubId?: string | null;
  coHostClubIds?: string[];
  organizerIds?: string[];
  locationName?: string;
  locationId?: string | null;
  locationDetails?: string | null;
  latitude: number;
  longitude: number;
  startsAt: string;
  endsAt: string;
  recurrence?: CreateEventRecurrenceInput | null;
  maxCapacity?: number | null;
  waitlistEnabled?: boolean;
  requireApproval?: boolean;
  isFree?: boolean;
  ticketPrice?: number | null;
  visibility?: 'public' | 'club_members_only';
  contactInfo?: string | null;
  tags?: string[];
  coverImage?: CreateEventImageInput | null;
  attachments?: CreateEventAttachmentInput[];
}

type EventAttachmentRecord = {
  id: string;
  path: string;
  file_name: string;
  mime_type: string;
  kind: 'image' | 'video' | 'document';
  size_bytes?: number | null;
};

const VALID_CATEGORIES = new Set([
  'academic',
  'social',
  'sports',
  'club',
  'career',
  'arts',
  'food',
  'tech',
  'talks',
  'workshop',
  'party',
  'other',
]);

const ORGANIZER_ROLES = new Set(['president', 'officer', 'admin']);
const MAX_ATTACHMENTS = 5;
const MAX_OCCURRENCES = 52;

function decodeBase64(input: string) {
  const binary = atob(input);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function normalizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
}

function normalizeTags(tags: string[] | undefined) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

function normalizeUuidList(values: string[] | undefined) {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  );
}

function resolveCampusLocation(
  requestedLocationId: string | null | undefined,
  requestedLocationName: string | undefined,
  coordinate: { latitude: number; longitude: number },
  locations: CampusLocationRow[],
) {
  const byId = requestedLocationId
    ? locations.find((location) => location.id === requestedLocationId) ?? null
    : null;

  if (byId) {
    return byId;
  }

  const nearest = findNearestCampusLocation(coordinate, locations, 50);
  if (nearest) {
    return nearest.location;
  }

  if (requestedLocationName?.trim()) {
    return null;
  }

  return null;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  const anchorDay = next.getDate();
  next.setMonth(next.getMonth() + amount);

  if (next.getDate() < anchorDay) {
    next.setDate(0);
  }

  return next;
}

function addRecurrence(date: Date, frequency: CreateEventRecurrenceInput['frequency']) {
  const next = new Date(date);
  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
    return next;
  }

  if (frequency === 'biweekly') {
    next.setDate(next.getDate() + 14);
    return next;
  }

  return addMonths(next, 1);
}

function buildOccurrenceSchedule(
  startsAt: Date,
  endsAt: Date,
  recurrence: CreateEventRecurrenceInput | null | undefined,
) {
  if (!recurrence) {
    return [{ startsAt, endsAt }];
  }

  const untilDate = new Date(recurrence.until);
  if (Number.isNaN(untilDate.getTime())) {
    throw new HttpError(400, 'bad_request', 'Recurring events need a valid end date.');
  }

  const inclusiveUntil = new Date(untilDate);
  inclusiveUntil.setHours(23, 59, 59, 999);

  const occurrences: Array<{ startsAt: Date; endsAt: Date }> = [];
  let cursorStart = new Date(startsAt);
  let cursorEnd = new Date(endsAt);

  while (cursorStart <= inclusiveUntil) {
    occurrences.push({ startsAt: new Date(cursorStart), endsAt: new Date(cursorEnd) });
    if (occurrences.length >= MAX_OCCURRENCES) {
      break;
    }

    cursorStart = addRecurrence(cursorStart, recurrence.frequency);
    cursorEnd = addRecurrence(cursorEnd, recurrence.frequency);
  }

  return occurrences;
}

async function ensureOrganizerCanHostForClub(
  adminClient: SupabaseClient,
  userId: string,
  clubId: string | null | undefined,
) {
  if (!clubId) {
    return;
  }

  const { data, error } = await adminClient
    .from('club_members')
    .select('role, status')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const role = data?.role ?? null;
  if (data?.status !== 'approved' || !role || !ORGANIZER_ROLES.has(role)) {
    throw new HttpError(
      403,
      'forbidden',
      'You can only organize events for clubs where you are an officer or president.',
    );
  }
}

async function validateClubIds(adminClient: SupabaseClient, clubIds: string[]) {
  if (clubIds.length === 0) {
    return [] as string[];
  }

  const { data, error } = await adminClient
    .from('clubs')
    .select('id')
    .eq('is_active', true)
    .in('id', clubIds);

  if (error) {
    throw error;
  }

  const resolvedIds = new Set((data ?? []).map((row: { id: string }) => row.id));
  const missing = clubIds.filter((id) => !resolvedIds.has(id));
  if (missing.length > 0) {
    throw new HttpError(400, 'bad_request', 'One or more selected clubs no longer exist.');
  }

  return clubIds;
}

async function validateOrganizerIds(
  adminClient: SupabaseClient,
  creatorId: string,
  organizerIds: string[],
) {
  const normalized = Array.from(new Set([creatorId, ...organizerIds]));
  const usersById = await fetchUsersByIds(adminClient, normalized);
  const missing = normalized.filter((id) => !usersById.has(id));
  if (missing.length > 0) {
    throw new HttpError(400, 'bad_request', 'One or more selected organizers could not be found.');
  }

  return normalized;
}

async function moderateAttachment(input: CreateEventAttachmentInput) {
  if (!input.mimeType.startsWith('image/')) {
    return;
  }

  const imageModeration = await moderateImage(input.base64Data);
  if (imageModeration.flagged) {
    throw new HttpError(
      400,
      'bad_request',
      'One of the uploaded event images failed moderation.',
      imageModeration.reasons,
    );
  }
}

async function uploadEventAttachments(input: {
  adminClient: SupabaseClient;
  userId: string;
  seriesId: string;
  attachments: CreateEventAttachmentInput[];
}) {
  const uploaded: EventAttachmentRecord[] = [];

  for (const attachment of input.attachments) {
    const extension = normalizeFileName(attachment.fileName).split('.').pop() ?? 'bin';
    const attachmentId = crypto.randomUUID();
    const storagePath = `${input.userId}/${input.seriesId}/attachments/${attachmentId}.${extension}`;
    const { error: uploadError } = await input.adminClient.storage
      .from('event-media')
      .upload(storagePath, decodeBase64(attachment.base64Data), {
        contentType: attachment.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    uploaded.push({
      id: attachmentId,
      path: storagePath,
      file_name: normalizeFileName(attachment.fileName),
      mime_type: attachment.mimeType,
      kind: attachment.kind,
      size_bytes: attachment.sizeBytes ?? null,
    });
  }

  return uploaded;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<CreateEventRequest>(request);

    if (!body.title?.trim()) {
      throw new HttpError(400, 'bad_request', 'Title is required.');
    }

    if (body.title.trim().length < 3) {
      throw new HttpError(400, 'bad_request', 'Title must be at least 3 characters long.');
    }

    if (body.title.trim().length > 150) {
      throw new HttpError(400, 'bad_request', 'Title must be 150 characters or fewer.');
    }

    if ((body.description?.trim().length ?? 0) > 2000) {
      throw new HttpError(400, 'bad_request', 'Description must be 2000 characters or fewer.');
    }

    if (!VALID_CATEGORIES.has(body.category)) {
      throw new HttpError(400, 'bad_request', 'Unsupported event category.');
    }

    if (!Number.isFinite(body.latitude) || !Number.isFinite(body.longitude)) {
      throw new HttpError(400, 'bad_request', 'A valid map location is required.');
    }

    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new HttpError(400, 'bad_request', 'Event end time must be after the start time.');
    }

    if (startsAt <= new Date()) {
      throw new HttpError(400, 'bad_request', 'Event start time must be in the future.');
    }

    const maxCapacity =
      typeof body.maxCapacity === 'number' && Number.isFinite(body.maxCapacity)
        ? Math.max(1, Math.floor(body.maxCapacity))
        : null;

    if (body.visibility === 'club_members_only' && !body.clubId) {
      throw new HttpError(
        400,
        'bad_request',
        'Club-members-only visibility requires an organizing club.',
      );
    }

    const ticketPrice =
      body.isFree === false && typeof body.ticketPrice === 'number' && Number.isFinite(body.ticketPrice)
        ? Number(body.ticketPrice.toFixed(2))
        : null;

    if (body.isFree === false && ticketPrice === null) {
      throw new HttpError(400, 'bad_request', 'Ticketed events need a valid ticket price.');
    }

    const recurrence = body.recurrence ?? null;
    const occurrences = buildOccurrenceSchedule(startsAt, endsAt, recurrence);
    if (occurrences.length === 0) {
      throw new HttpError(400, 'bad_request', 'Unable to build the event schedule.');
    }

    const textModeration = await moderateText(`${body.title}\n${body.description ?? ''}`);
    if (textModeration.flagged) {
      throw new HttpError(
        400,
        'bad_request',
        'This event could not be published because it failed moderation.',
        textModeration.categories,
      );
    }

    if (body.coverImage && !body.coverImage.mimeType.startsWith('image/')) {
      throw new HttpError(400, 'bad_request', 'Cover image must be an image file.');
    }

    if (body.coverImage) {
      const imageModeration = await moderateImage(body.coverImage.base64Data);
      if (imageModeration.flagged) {
        throw new HttpError(
          400,
          'bad_request',
          'This event cover image failed moderation.',
          imageModeration.reasons,
        );
      }
    }

    const attachments = (body.attachments ?? []).slice(0, MAX_ATTACHMENTS);
    for (const attachment of attachments) {
      await moderateAttachment(attachment);
    }

    await ensureOrganizerCanHostForClub(adminClient, userId, body.clubId ?? null);

    const normalizedCoHostIds = normalizeUuidList(body.coHostClubIds).filter(
      (clubId) => clubId !== body.clubId,
    );
    const normalizedOrganizerIds = normalizeUuidList(body.organizerIds);

    const [campusLocations, usersById, coHostClubIds, organizerIds] = await Promise.all([
      fetchCampusLocations(adminClient),
      fetchUsersByIds(adminClient, [userId]),
      validateClubIds(adminClient, normalizedCoHostIds),
      validateOrganizerIds(adminClient, userId, normalizedOrganizerIds),
    ]);

    const organizer = usersById.get(userId);
    if (!organizer) {
      throw new HttpError(500, 'internal_error', 'Unable to resolve the organizer profile.');
    }

    const resolvedLocation = resolveCampusLocation(
      body.locationId,
      body.locationName,
      { latitude: body.latitude, longitude: body.longitude },
      campusLocations,
    );

    const seriesId = crypto.randomUUID();
    let coverStoragePath: string | null = null;
    if (body.coverImage) {
      const extension = normalizeFileName(body.coverImage.fileName).split('.').pop() ?? 'jpg';
      coverStoragePath = `${userId}/${seriesId}/cover.${extension}`;
      const { error: uploadError } = await adminClient.storage
        .from('event-covers')
        .upload(coverStoragePath, decodeBase64(body.coverImage.base64Data), {
          contentType: body.coverImage.mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }
    }

    const uploadedAttachments = await uploadEventAttachments({
      adminClient,
      userId,
      seriesId,
      attachments,
    });

    const rowsToInsert = occurrences.map((occurrence, index) => ({
      id: crypto.randomUUID(),
      title: body.title.trim(),
      description: body.description?.trim() ?? '',
      club_id: body.clubId ?? null,
      organizer_id: userId,
      organizer_name: organizer.displayName,
      organizer_ids: organizerIds,
      co_host_club_ids: coHostClubIds,
      category: body.category,
      location_name: resolvedLocation?.name ?? body.locationName?.trim() ?? 'Pinned campus location',
      location_id: resolvedLocation?.id ?? null,
      location_details: body.locationDetails?.trim() || null,
      latitude: resolvedLocation?.latitude ?? body.latitude,
      longitude: resolvedLocation?.longitude ?? body.longitude,
      starts_at: occurrence.startsAt.toISOString(),
      ends_at: occurrence.endsAt.toISOString(),
      series_root_id: recurrence ? seriesId : null,
      recurrence_frequency: recurrence?.frequency ?? null,
      recurs_until: recurrence ? new Date(recurrence.until).toISOString() : null,
      cover_image_url: coverStoragePath,
      attachments: uploadedAttachments,
      tags: normalizeTags(body.tags),
      max_capacity: maxCapacity,
      waitlist_enabled: Boolean(maxCapacity && body.waitlistEnabled),
      require_approval: Boolean(body.requireApproval),
      is_free: body.isFree !== false,
      ticket_price: body.isFree === false ? ticketPrice : null,
      visibility: body.visibility ?? 'public',
      contact_info: body.contactInfo?.trim() || null,
      moderation_status: 'approved' as const,
      is_featured: index === 0 ? false : false,
    }));

    const { error: insertError } = await adminClient.from('events').insert(rowsToInsert);
    if (insertError) {
      throw insertError;
    }

    const { error: rsvpInsertError } = await adminClient.from('event_rsvps').upsert(
      rowsToInsert.map((row) => ({
        event_id: row.id,
        user_id: userId,
        status: 'going' as const,
      })),
      { onConflict: 'event_id,user_id' },
    );
    if (rsvpInsertError) {
      console.error('create-event organizer RSVP seed failed', rsvpInsertError);
    }

    const insertedEvents = await Promise.all(rowsToInsert.map((row) => fetchEventById(adminClient, row.id)));
    const redis = getRedis();
    await invalidateMapEventCaches(redis);

    try {
      await Promise.all(
        insertedEvents
          .filter((event) => event.visibility === 'public')
          .map((event) =>
            syncCampusEventToMeilisearch({
              id: event.id,
              title: event.title,
              description: event.description,
              location_name: event.location_name,
              category: event.category,
              tags: event.tags ?? [],
              starts_at: event.starts_at,
              latitude: event.latitude,
              longitude: event.longitude,
            }),
          ),
      );
    } catch (syncError) {
      console.error('create-event meilisearch sync failed', syncError);
    }

    const signedCoverUrl = await signEventCoverUrl(adminClient, coverStoragePath);
    const responseEvents = insertedEvents.map((event) =>
      toMapEventSummary(event as EventRow, {
        density: 1,
        eventCountAtLocation: 1,
        signedCoverUrl,
      }),
    );

    return jsonResponse({
      event: responseEvents[0],
      events: responseEvents,
      snappedLocation: resolvedLocation,
      moderationStatus: 'approved',
    });
  } catch (error) {
    return errorResponse(error);
  }
});
