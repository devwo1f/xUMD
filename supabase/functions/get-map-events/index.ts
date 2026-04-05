import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';
import { getRedis } from '../_shared/upstash.ts';
import {
  buildMapEventsCacheKey,
  buildTimeWindow,
  computeEventDensityMap,
  computeEventsPerLocation,
  filterEventsInMemory,
  sortEventsInMemory,
  getLocationGroupingKey,
  toMapEventSummary,
  type MapEventFilters,
  type MapEventSummary,
} from '../_shared/map.ts';
import {
  fetchFriendAttendingEventIds,
  fetchMapEventRows,
} from '../_shared/map-records.ts';

interface GetMapEventsResponse {
  items: MapEventSummary[];
  generatedAt: string;
  source: 'redis' | 'recomputed';
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const filters = await parseJsonBody<MapEventFilters>(request);
    const redis = getRedis();
    const cacheKey = await buildMapEventsCacheKey(filters, redis);

    if (redis) {
      const cached = await redis.getJson<GetMapEventsResponse>(cacheKey);
      if (cached) {
        return jsonResponse({ ...cached, source: 'redis' });
      }
    }

    const rawEvents = await fetchMapEventRows(adminClient, filters);
    let filteredEvents = filterEventsInMemory(rawEvents, filters);

    if (filters.onlyFriendsAttending) {
      const friendEventIds = await fetchFriendAttendingEventIds(adminClient, userId);
      filteredEvents = filteredEvents.filter((event) => friendEventIds.has(event.id));
    }

    const sortedEvents = sortEventsInMemory(filteredEvents, filters);
    const { start, end } = buildTimeWindow(filters.timeFilter, filters.customRange);
    const densityByEventId = computeEventDensityMap(sortedEvents, start, end);
    const eventsPerLocation = computeEventsPerLocation(sortedEvents);

    const items = sortedEvents.map((event) =>
      toMapEventSummary(event, {
        density: densityByEventId.get(event.id) ?? 1,
        eventCountAtLocation:
          eventsPerLocation.get(getLocationGroupingKey(event)) ?? 1,
      }),
    );

    const payload: GetMapEventsResponse = {
      items,
      generatedAt: new Date().toISOString(),
      source: 'recomputed',
    };

    if (redis) {
      await redis.setJson(cacheKey, payload, 60);
    }

    return jsonResponse(payload);
  } catch (error) {
    return errorResponse(error);
  }
});
