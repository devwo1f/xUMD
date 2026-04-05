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

interface CreateEventImageInput {
  base64Data: string;
  fileName: string;
  mimeType: string;
}

interface CreateEventRequest {
  title: string;
  description: string;
  category: 'academic' | 'social' | 'sports' | 'club' | 'career' | 'arts' | 'food' | 'workshop' | 'party' | 'other';
  locationName?: string;
  locationId?: string | null;
  latitude: number;
  longitude: number;
  startsAt: string;
  endsAt: string;
  maxCapacity?: number | null;
  tags?: string[];
  coverImage?: CreateEventImageInput | null;
}

const VALID_CATEGORIES = new Set([
  'academic',
  'social',
  'sports',
  'club',
  'career',
  'arts',
  'food',
  'workshop',
  'party',
  'other',
]);

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
  ).slice(0, 12);
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

    const textModeration = await moderateText(`${body.title}\n${body.description ?? ''}`);
    if (textModeration.flagged) {
      throw new HttpError(400, 'bad_request', 'This event could not be published because it failed moderation.', textModeration.categories);
    }

    if (body.coverImage && !body.coverImage.mimeType.startsWith('image/')) {
      throw new HttpError(400, 'bad_request', 'Cover image must be an image file.');
    }

    if (body.coverImage) {
      const imageModeration = await moderateImage(body.coverImage.base64Data);
      if (imageModeration.flagged) {
        throw new HttpError(400, 'bad_request', 'This event cover image failed moderation.', imageModeration.reasons);
      }
    }

    const [campusLocations, usersById] = await Promise.all([
      fetchCampusLocations(adminClient),
      fetchUsersByIds(adminClient, [userId]),
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

    const eventId = crypto.randomUUID();
    let coverStoragePath: string | null = null;
    if (body.coverImage) {
      const extension = normalizeFileName(body.coverImage.fileName).split('.').pop() ?? 'jpg';
      coverStoragePath = `${userId}/${eventId}/cover.${extension}`;
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

    const insertPayload = {
      id: eventId,
      title: body.title.trim(),
      description: body.description?.trim() ?? '',
      organizer_id: userId,
      organizer_name: organizer.displayName,
      category: body.category,
      location_name: resolvedLocation?.name ?? body.locationName?.trim() ?? 'Pinned campus location',
      location_id: resolvedLocation?.id ?? null,
      latitude: resolvedLocation?.latitude ?? body.latitude,
      longitude: resolvedLocation?.longitude ?? body.longitude,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      cover_image_url: coverStoragePath,
      tags: normalizeTags(body.tags),
      max_capacity: body.maxCapacity ?? null,
      moderation_status: 'approved' as const,
    };

    const { error: insertError } = await adminClient.from('events').insert(insertPayload);
    if (insertError) {
      throw insertError;
    }

    const insertedEvent = await fetchEventById(adminClient, eventId);
    const redis = getRedis();
    await invalidateMapEventCaches(redis);

    try {
      await syncCampusEventToMeilisearch({
        id: insertedEvent.id,
        title: insertedEvent.title,
        description: insertedEvent.description,
        location_name: insertedEvent.location_name,
        category: insertedEvent.category,
        tags: insertedEvent.tags ?? [],
        starts_at: insertedEvent.starts_at,
        latitude: insertedEvent.latitude,
        longitude: insertedEvent.longitude,
      });
    } catch (syncError) {
      console.error('create-event meilisearch sync failed', syncError);
    }

    const signedCoverUrl = await signEventCoverUrl(adminClient, insertedEvent.cover_image_url);
    const responseEvent = toMapEventSummary(insertedEvent as EventRow, {
      density: 1,
      eventCountAtLocation: 1,
      signedCoverUrl,
    });

    return jsonResponse({
      event: responseEvent,
      snappedLocation: resolvedLocation,
      moderationStatus: 'approved',
    });
  } catch (error) {
    return errorResponse(error);
  }
});
