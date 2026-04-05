import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { runUnifiedSearch } from '../_shared/search.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';

interface UnifiedSearchRequest {
  query: string;
  page?: number;
  per_page?: number;
  entity_types?: Array<'person' | 'event' | 'club' | 'location'>;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const body = request.method === 'POST' ? await parseJsonBody<UnifiedSearchRequest>(request) : { query: '' };
    const query = body.query?.trim() ?? '';

    if (query.length < 2) {
      return jsonResponse({
        query,
        intent: 'keyword',
        extracted_filters: null,
        results: { people: [], events: [], clubs: [], locations: [] },
        total_counts: { people: 0, events: 0, clubs: 0, locations: 0 },
      });
    }

    const response = await runUnifiedSearch(adminClient, userId, query, body.entity_types);
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
});
