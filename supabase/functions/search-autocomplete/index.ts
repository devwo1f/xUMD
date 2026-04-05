import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { runAutocomplete } from '../_shared/search.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';

interface SearchAutocompleteRequest {
  query: string;
  limit?: number;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { adminClient } = await requireAuthenticatedUser(request);
    const body = request.method === 'POST' ? await parseJsonBody<SearchAutocompleteRequest>(request) : { query: '' };
    const query = body.query?.trim() ?? '';
    const limit = Math.min(Math.max(body.limit ?? 8, 1), 8);

    if (query.length < 2) {
      return jsonResponse({ suggestions: [] });
    }

    const response = await runAutocomplete(adminClient, query, limit);
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
});
