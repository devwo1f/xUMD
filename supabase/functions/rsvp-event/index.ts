import { HttpError } from '../_shared/errors.ts';
import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { invalidateMapEventCaches } from '../_shared/map.ts';
import { fetchCurrentUserRsvp, fetchEventById, fetchEventRsvpStats } from '../_shared/map-records.ts';
import { ensurePublicUserRow, requireAuthenticatedUser } from '../_shared/supabase.ts';
import { getRedis } from '../_shared/upstash.ts';

interface RsvpEventRequest {
  eventId: string;
  status?: 'going' | 'interested';
  action?: 'upsert' | 'remove';
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, authUser, adminClient } = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<RsvpEventRequest>(request);

    await ensurePublicUserRow(adminClient, authUser);

    if (!body.eventId) {
      throw new HttpError(400, 'bad_request', 'eventId is required.');
    }

    const event = await fetchEventById(adminClient, body.eventId);
    if (event.status === 'cancelled' || event.status === 'completed') {
      throw new HttpError(400, 'bad_request', 'You cannot RSVP to this event anymore.');
    }

    const action = body.action ?? 'upsert';
    if (action === 'remove') {
      const { error } = await adminClient.rpc('clear_event_rsvp_atomic', {
        p_event_id: body.eventId,
        p_user_id: userId,
      });

      if (error) {
        throw error;
      }
    } else {
      const status = body.status ?? 'interested';
      const { error } = await adminClient.rpc('rsvp_event_atomic', {
        p_event_id: body.eventId,
        p_user_id: userId,
        p_status: status,
      });

      if (error) {
        throw error;
      }
    }

    const redis = getRedis();
    await invalidateMapEventCaches(redis);

    const [currentUserRsvp, rsvpStats] = await Promise.all([
      fetchCurrentUserRsvp(adminClient, userId, body.eventId),
      fetchEventRsvpStats(adminClient, body.eventId),
    ]);

    return jsonResponse({
      success: true,
      current_user_rsvp: currentUserRsvp,
      rsvp_stats: rsvpStats,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
