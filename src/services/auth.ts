import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, supabaseConfigError } from './supabase';
import type { ServiceResult, User, UserUpdate } from '../shared/types';

export const ALLOWED_UMD_DOMAINS = ['umd.edu', 'terpmail.umd.edu'] as const;
export const RESERVED_USERNAMES = new Set(['admin', 'support', 'xumd', 'maryland', 'umd']);

export interface UsernameAvailabilityResult {
  available: boolean;
  username: string;
  message: string;
  suggestion?: string;
}

export interface CourseSearchResult {
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildFallbackUsername(authUser: SupabaseAuthUser) {
  const emailPrefix = normalizeEmail(authUser.email ?? 'terp@umd.edu').split('@')[0] ?? 'terp';
  const cleanedPrefix = sanitizeUsernameInput(emailPrefix) || 'terp';
  const suffix = authUser.id.replace(/-/g, '').slice(0, 6).toLowerCase();
  return sanitizeUsernameInput(`${cleanedPrefix}_${suffix}`) || `terp_${suffix}`;
}

function buildFallbackDisplayName(authUser: SupabaseAuthUser) {
  const metadataDisplayName =
    typeof authUser.user_metadata?.display_name === 'string'
      ? authUser.user_metadata.display_name.trim()
      : '';

  if (metadataDisplayName.length > 0) {
    return metadataDisplayName;
  }

  const emailPrefix = normalizeEmail(authUser.email ?? 'terp@umd.edu').split('@')[0] ?? 'terp';
  const derived = emailPrefix
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim();

  return derived || 'Terp';
}

function buildFallbackUserInsert(authUser: SupabaseAuthUser) {
  const metadata = authUser.user_metadata ?? {};
  const graduationYearValue =
    typeof metadata.graduation_year === 'number'
      ? metadata.graduation_year
      : typeof metadata.graduation_year === 'string' && metadata.graduation_year.trim().length > 0
        ? Number(metadata.graduation_year)
        : null;

  return {
    id: authUser.id,
    email: normalizeEmail(authUser.email ?? 'student@umd.edu'),
    username: buildFallbackUsername(authUser),
    display_name: buildFallbackDisplayName(authUser),
    avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
    major: typeof metadata.major === 'string' ? metadata.major : null,
    graduation_year: Number.isFinite(graduationYearValue) ? graduationYearValue : null,
    degree_type: typeof metadata.degree_type === 'string' ? metadata.degree_type : null,
    minor: typeof metadata.minor === 'string' ? metadata.minor : null,
    bio: typeof metadata.bio === 'string' ? metadata.bio : null,
    pronouns: typeof metadata.pronouns === 'string' ? metadata.pronouns : null,
    clubs: [] as string[],
    courses: [] as string[],
    interests: [] as string[],
    follower_count: 0,
    following_count: 0,
    profile_completed: false,
    onboarding_step: 0,
  };
}

export function sanitizeUsernameInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

export function validateUmdEmailInput(email: string): string | null {
  const normalized = normalizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!normalized) {
    return 'Email is required.';
  }

  if (!emailRegex.test(normalized)) {
    return 'Please enter a valid email address.';
  }

  const domain = normalized.split('@')[1] ?? '';
  if (!ALLOWED_UMD_DOMAINS.includes(domain as (typeof ALLOWED_UMD_DOMAINS)[number])) {
    return 'Only @umd.edu and @terpmail.umd.edu emails are allowed.';
  }

  return null;
}

function getServiceErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeContext = error as { context?: { error?: { message?: string } }; message?: string };
    if (maybeContext.context?.error?.message) {
      return maybeContext.context.error.message;
    }
    if (maybeContext.message) {
      return maybeContext.message;
    }
  }

  return error instanceof Error ? error.message : 'Something went wrong.';
}

function inferCurrentSemester() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month <= 4) {
    return `Spring ${year}`;
  }

  if (month <= 7) {
    return `Summer ${year}`;
  }

  return `Fall ${year}`;
}

async function invokeFunction<T>(name: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    throw error;
  }

  return data as T;
}

export async function requestOtp(email: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError);
  }

  const normalizedEmail = normalizeEmail(email);
  const validationError = validateUmdEmailInput(normalizedEmail);
  if (validationError) {
    throw new Error(validationError);
  }

  await invokeFunction<{ success: boolean }>('request-otp', { email: normalizedEmail });
}

export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: token.trim(),
    type: 'email',
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function checkUsernameAvailability(
  username: string,
  currentUserId?: string,
): Promise<UsernameAvailabilityResult> {
  const normalized = sanitizeUsernameInput(username);

  if (normalized.length < 3) {
    return {
      available: false,
      username: normalized,
      message: 'Username must be at least 3 characters.',
    };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      available: false,
      username: normalized,
      message: 'That username is reserved.',
      suggestion: `${normalized}_umd`,
    };
  }

  try {
    return await invokeFunction<UsernameAvailabilityResult>('check-username', { username: normalized });
  } catch {
    const query = supabase.from('users').select('id').eq('username', normalized);
    const { data, error } = currentUserId ? await query.neq('id', currentUserId).maybeSingle() : await query.maybeSingle();

    if (error) {
      return {
        available: true,
        username: normalized,
        message: 'Username available.',
      };
    }

    if (data) {
      return {
        available: false,
        username: normalized,
        message: 'That username is already taken.',
        suggestion: `${normalized}_umd`,
      };
    }

    return {
      available: true,
      username: normalized,
      message: 'Username available.',
    };
  }
}

export async function searchCourses(query: string, semester?: string): Promise<CourseSearchResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return [];
  }

  const activeSemester = semester?.trim() || inferCurrentSemester();

  try {
    const response = await invokeFunction<{ courses: CourseSearchResult[] }>('search-courses', {
      query: trimmedQuery,
      semester: activeSemester,
    });
    return response.courses;
  } catch {
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_code, section, title, credits, instructor, meeting_days, start_time, end_time, building_name, room_number, semester, is_online, is_async')
      .eq('semester', activeSemester)
      .or(`course_code.ilike.%${trimmedQuery}%,title.ilike.%${trimmedQuery}%`)
      .order('course_code', { ascending: true })
      .order('section', { ascending: true })
      .limit(20);

    if (error) {
      return [];
    }

    return (data ?? []) as CourseSearchResult[];
  }
}

export async function syncUserCoursesForUser({
  userId,
  courseCodes,
  semester,
}: {
  userId: string;
  courseCodes: string[];
  semester?: string;
}) {
  if (!isSupabaseConfigured) {
    return;
  }

  const activeSemester = semester?.trim() || inferCurrentSemester();
  const normalizedCodes = Array.from(
    new Set(
      courseCodes
        .map((courseCode) => courseCode.trim().toUpperCase())
        .filter(Boolean),
    ),
  );

  const { error: deleteError } = await supabase
    .from('user_courses')
    .delete()
    .eq('user_id', userId)
    .eq('semester', activeSemester);

  if (deleteError) {
    throw deleteError;
  }

  if (normalizedCodes.length === 0) {
    return;
  }

  const { data: courseRows, error: courseError } = await supabase
    .from('courses')
    .select('id, course_code, section, semester, meeting_days, start_time, end_time, building_name, room_number')
    .eq('semester', activeSemester)
    .in('course_code', normalizedCodes)
    .order('course_code', { ascending: true })
    .order('section', { ascending: true });

  if (courseError) {
    throw courseError;
  }

  const firstSectionByCode = new Map();
  for (const row of courseRows ?? []) {
    const code = String(row.course_code ?? '').trim().toUpperCase();
    if (code && !firstSectionByCode.has(code)) {
      firstSectionByCode.set(code, row);
    }
  }

  const payload = normalizedCodes
    .map((code) => firstSectionByCode.get(code))
    .filter(Boolean)
    .map((row) => ({
      user_id: userId,
      course_id: row.id,
      course_code: row.course_code,
      section: row.section,
      semester: row.semester,
      meeting_days: row.meeting_days ?? [],
      start_time: row.start_time ?? null,
      end_time: row.end_time ?? null,
      building_name: row.building_name ?? null,
      room_number: row.room_number ?? null,
    }));

  if (payload.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('user_courses').insert(payload);

  if (insertError) {
    throw insertError;
  }
}

export async function signOut(): Promise<ServiceResult<null>> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { data: null, error: getServiceErrorMessage(error) };
  }
  return { data: null, error: null };
}

export async function getCurrentUser(): Promise<ServiceResult<User | null>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { data: null, error: getServiceErrorMessage(sessionError) };
  }

  if (!session?.user) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
  if (error) {
    return { data: null, error: getServiceErrorMessage(error) };
  }

  return { data: (data as User | null) ?? null, error: null };
}

export async function ensureCurrentUserProfileRow(): Promise<ServiceResult<User>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      data: null,
      error: getServiceErrorMessage(sessionError ?? new Error('Not authenticated.')),
    };
  }

  const existing = await getCurrentUser();
  if (existing.error) {
    return { data: null, error: existing.error };
  }
  if (existing.data) {
    return { data: existing.data, error: null };
  }

  const { data, error } = await supabase
    .from('users')
    .insert(buildFallbackUserInsert(session.user))
    .select('*')
    .single();

  if (!error && data) {
    return { data: data as User, error: null };
  }

  const retry = await getCurrentUser();
  if (retry.data) {
    return { data: retry.data, error: null };
  }

  return {
    data: null,
    error: getServiceErrorMessage(error ?? retry.error ?? new Error('Unable to create your profile row.')),
  };
}

export async function updateProfile(updates: UserUpdate): Promise<ServiceResult<User>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: getServiceErrorMessage(sessionError ?? new Error('Not authenticated.')) };
  }

  const payload = {
    ...updates,
    username: updates.username ? sanitizeUsernameInput(updates.username) : undefined,
  };

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', session.user.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: getServiceErrorMessage(error) };
  }

  return { data: data as User, error: null };
}
