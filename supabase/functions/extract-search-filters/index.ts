import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { extractSearchFiltersWithCache } from '../_shared/search.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';

interface ExtractSearchFiltersRequest {
  query: string;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    await requireAuthenticatedUser(request);
    const body = request.method === 'POST' ? await parseJsonBody<ExtractSearchFiltersRequest>(request) : { query: '' };
    const query = body.query?.trim() ?? '';

    if (!query) {
      return jsonResponse({
        category: null,
        timeframe: null,
        cost: null,
        entity_type: null,
        clean_query: '',
      });
    }

    return jsonResponse(await extractSearchFiltersWithCache(query));
  } catch (error) {
    return errorResponse(error);
  }
});
