import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { searchCampusFallback } from '../_shared/map-records.ts';
import { searchMeilisearch } from '../_shared/meilisearch.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';

interface SearchEventsRequest {
  query: string;
  limit?: number;
}

interface MeiliCampusEventHit {
  id: string;
  title: string;
  location_name: string;
  category: string;
  latitude: number;
  longitude: number;
}

interface MeiliCampusLocationHit {
  id: string;
  name: string;
  short_name: string;
  building_type: string;
  latitude: number;
  longitude: number;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { adminClient } = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<SearchEventsRequest>(request);
    const query = body.query?.trim() ?? '';
    const limit = Math.max(1, Math.min(body.limit ?? 8, 12));

    if (!query) {
      return jsonResponse({ items: [] });
    }

    const [eventHits, locationHits] = await Promise.all([
      searchMeilisearch<MeiliCampusEventHit>('campus_events', query, limit),
      searchMeilisearch<MeiliCampusLocationHit>('campus_locations', query, limit),
    ]);

    if (eventHits.length > 0 || locationHits.length > 0) {
      const items = [
        ...eventHits.map((event) => ({
          id: `event-${event.id}`,
          type: 'event' as const,
          title: event.title,
          subtitle: `${event.location_name} · ${event.category}`,
          latitude: event.latitude,
          longitude: event.longitude,
          event_ids: [event.id],
        })),
        ...locationHits.map((location) => ({
          id: `location-${location.id}`,
          type: 'location' as const,
          title: location.name,
          subtitle: `${location.short_name} · ${location.building_type}`,
          latitude: location.latitude,
          longitude: location.longitude,
          event_ids: [] as string[],
        })),
      ].slice(0, limit * 2);

      return jsonResponse({ items, source: 'meilisearch' });
    }

    const fallbackItems = await searchCampusFallback(adminClient, query);
    return jsonResponse({ items: fallbackItems.slice(0, limit * 2), source: 'fallback' });
  } catch (error) {
    return errorResponse(error);
  }
});
