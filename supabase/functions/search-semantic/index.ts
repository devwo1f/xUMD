import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { runSemanticSearch } from '../_shared/search.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';

interface SearchSemanticRequest {
  query: string;
  entity_types?: Array<'person' | 'event' | 'club' | 'location'>;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const body = request.method === 'POST' ? await parseJsonBody<SearchSemanticRequest>(request) : { query: '' };
    const query = body.query?.trim() ?? '';

    if (query.length < 2) {
      return jsonResponse({
        query,
        intent: 'semantic',
        extracted_filters: null,
        items: [],
      });
    }

    return jsonResponse(await runSemanticSearch(adminClient, userId, query, body.entity_types));
  } catch (error) {
    return errorResponse(error);
  }
});
