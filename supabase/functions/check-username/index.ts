import { RESERVED_USERNAMES, buildUsernameSuggestions, sanitizeUsername } from '../_shared/auth.ts';
import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';

interface CheckUsernameBody {
  username: string;
}

interface CheckUsernameResponse {
  available: boolean;
  username: string;
  message: string;
  suggestion?: string;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    if (request.method !== 'POST') {
      return jsonResponse<CheckUsernameResponse>({
        available: false,
        username: '',
        message: 'Method not allowed.',
      }, { status: 405 });
    }

    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const { username } = await parseJsonBody<CheckUsernameBody>(request);
    const normalized = sanitizeUsername(username);
    const candidateSuggestions = buildUsernameSuggestions(normalized);

    if (normalized.length < 3) {
      return jsonResponse<CheckUsernameResponse>({
        available: false,
        username: normalized,
        message: 'Username must be at least 3 characters.',
      });
    }

    if (!/^[a-z0-9_]+$/.test(normalized)) {
      return jsonResponse<CheckUsernameResponse>({
        available: false,
        username: normalized,
        message: 'Use lowercase letters, numbers, and underscores only.',
      });
    }

    if (RESERVED_USERNAMES.has(normalized)) {
      return jsonResponse<CheckUsernameResponse>({
        available: false,
        username: normalized,
        message: 'That username is reserved.',
        suggestion: candidateSuggestions[0],
      });
    }

    const { data: conflicts, error } = await adminClient
      .from('users')
      .select('username')
      .in('username', [normalized, ...candidateSuggestions])
      .neq('id', userId);

    if (error) {
      throw error;
    }

    const taken = new Set((conflicts ?? []).map((row) => row.username));

    if (!taken.has(normalized)) {
      return jsonResponse<CheckUsernameResponse>({
        available: true,
        username: normalized,
        message: 'Username available.',
      });
    }

    const suggestion = candidateSuggestions.find((candidate) => !taken.has(candidate));

    return jsonResponse<CheckUsernameResponse>({
      available: false,
      username: normalized,
      message: 'That username is already taken.',
      suggestion,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
