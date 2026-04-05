import { HttpError } from '../_shared/errors.ts';
import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { invalidateMapEventCaches } from '../_shared/map.ts';
import { fetchEventById, fetchEventReportCount } from '../_shared/map-records.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';
import { getRedis } from '../_shared/upstash.ts';

interface ReportEventRequest {
  eventId: string;
  reason: 'spam' | 'inappropriate' | 'misleading' | 'harassment' | 'other';
  details?: string;
}

const VALID_REASONS = new Set(['spam', 'inappropriate', 'misleading', 'harassment', 'other']);

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<ReportEventRequest>(request);

    if (!body.eventId || !body.reason) {
      throw new HttpError(400, 'bad_request', 'eventId and reason are required.');
    }

    if (!VALID_REASONS.has(body.reason)) {
      throw new HttpError(400, 'bad_request', 'Unsupported report reason.');
    }

    await fetchEventById(adminClient, body.eventId);

    const { error } = await adminClient.from('event_reports').insert({
      event_id: body.eventId,
      reporter_id: userId,
      reason: body.reason,
      details: body.details?.trim() || null,
    });

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new HttpError(409, 'bad_request', 'You already reported this event.');
      }

      throw error;
    }

    const redis = getRedis();
    await invalidateMapEventCaches(redis);
    const reportCount = await fetchEventReportCount(adminClient, body.eventId);

    return jsonResponse({
      success: true,
      reportCount,
      reviewTriggered: reportCount >= 3,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
