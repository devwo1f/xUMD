import { inferCurrentSemester } from '../_shared/auth.ts';
import { errorResponse, handleOptions, jsonResponse, parseJsonBody } from '../_shared/http.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';

interface SearchCoursesBody {
  query: string;
  semester?: string;
}

interface CourseSearchRow {
  id: string;
  course_code: string;
  section: string;
  title: string;
  credits: number | null;
  instructor: string | null;
  meeting_days: string[];
  start_time: string | null;
  end_time: string | null;
  building_name: string | null;
  room_number: string | null;
  semester: string;
  is_online: boolean;
  is_async: boolean;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    if (request.method !== 'POST') {
      return jsonResponse({ courses: [] }, { status: 405 });
    }

    const { adminClient } = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<SearchCoursesBody>(request);
    const query = body.query?.trim() ?? '';
    const semester = body.semester?.trim() || inferCurrentSemester();

    if (query.length < 2) {
      return jsonResponse({ courses: [] });
    }

    const escapedQuery = query.replace(/,/g, ' ');
    const { data, error } = await adminClient
      .from('courses')
      .select(
        'id, course_code, section, title, credits, instructor, meeting_days, start_time, end_time, building_name, room_number, semester, is_online, is_async',
      )
      .eq('semester', semester)
      .or(`course_code.ilike.%${escapedQuery}%,title.ilike.%${escapedQuery}%`)
      .order('course_code', { ascending: true })
      .order('section', { ascending: true })
      .limit(20);

    if (error) {
      throw error;
    }

    return jsonResponse({ courses: (data ?? []) as CourseSearchRow[] });
  } catch (error) {
    return errorResponse(error);
  }
});
