import { HttpError } from '../_shared/errors.ts';
import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';
import {
  buildEventDetailResponse,
  buildTimeWindow,
  computeEventDensityMap,
  computeEventsPerLocation,
  doesEventOverlapWindow,
  getLocationGroupingKey,
  type EventDetailResponse,
} from '../_shared/map.ts';
import {
  fetchCampusLocations,
  fetchCurrentUserRsvp,
  fetchEventById,
  fetchEventReportCount,
  fetchEventRsvpStats,
  fetchFriendAttendingProfiles,
  fetchMapEventRows,
} from '../_shared/map-records.ts';

interface GetEventDetailRequest {
  eventId: string;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<GetEventDetailRequest>(request);

    if (!body.eventId) {
      throw new HttpError(400, 'bad_request', 'eventId is required.');
    }

    const event = await fetchEventById(adminClient, body.eventId);
    if (event.moderation_status !== 'approved' && event.organizer_id !== userId) {
      throw new HttpError(403, 'forbidden', 'This event is not available.');
    }

    const todayWindow = buildTimeWindow('all_today');
    const [campusLocations, currentUserRsvp, rsvpStats, friendsAttending, reportCount, allTodayEvents] =
      await Promise.all([
        fetchCampusLocations(adminClient),
        fetchCurrentUserRsvp(adminClient, userId, body.eventId),
        fetchEventRsvpStats(adminClient, body.eventId),
        fetchFriendAttendingProfiles(adminClient, userId, body.eventId),
        fetchEventReportCount(adminClient, body.eventId),
        fetchMapEventRows(adminClient, { timeFilter: 'all_today' }),
      ]);

    const densityMap = computeEventDensityMap(allTodayEvents, todayWindow.start, todayWindow.end);
    const locationCounts = computeEventsPerLocation(allTodayEvents);
    const location = campusLocations.find((item) => item.id === event.location_id) ?? null;
    const response = (await buildEventDetailResponse({
      adminClient,
      event,
      campusLocation: location,
      currentUserRsvp,
      rsvpStats,
      friendsAttending,
      reportCount,
      density: densityMap.get(event.id) ?? 1,
      eventCountAtLocation:
        locationCounts.get(getLocationGroupingKey(event)) ??
        (doesEventOverlapWindow(event, todayWindow.start, todayWindow.end) ? 1 : 0),
    })) satisfies EventDetailResponse;

    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
});

