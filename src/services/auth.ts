import { supabase } from './supabase';
import type { ServiceResult, User, UserUpdate } from '../shared/types';

const UMD_EMAIL_DOMAIN = '@terpmail.umd.edu';

/**
 * Validate that an email belongs to UMD's terpmail domain.
 */
function validateUmdEmail(email: string): string | null {
  if (!email.endsWith(UMD_EMAIL_DOMAIN)) {
    return `Only ${UMD_EMAIL_DOMAIN} email addresses are allowed.`;
  }
  return null;
}

/**
 * Sign up a new user with a UMD email address.
 * Creates an auth account and inserts an initial profile row.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<ServiceResult<User>> {
  const domainError = validateUmdEmail(email);
  if (domainError) {
    return { data: null, error: domainError };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (authError) {
    return { data: null, error: authError.message };
  }

  if (!authData.user) {
    return { data: null, error: 'Sign-up succeeded but no user was returned.' };
  }

  // Create the public profile row
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      display_name: displayName,
    })
    .select()
    .single();

  if (profileError) {
    return { data: null, error: profileError.message };
  }

  return { data: profile as User, error: null };
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<ServiceResult<User>> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { data: null, error: authError.message };
  }

  if (!authData.user) {
    return { data: null, error: 'Sign-in succeeded but no user was returned.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    return { data: null, error: profileError.message };
  }

  return { data: profile as User, error: null };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<ServiceResult<null>> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: null, error: null };
}

/**
 * Send a password-reset email.
 */
export async function resetPassword(email: string): Promise<ServiceResult<null>> {
  const domainError = validateUmdEmail(email);
  if (domainError) {
    return { data: null, error: domainError };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: null, error: null };
}

/**
 * Get the currently authenticated user's profile.
 * Returns null data (without error) when no session exists.
 */
export async function getCurrentUser(): Promise<ServiceResult<User | null>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { data: null, error: sessionError.message };
  }

  if (!session?.user) {
    return { data: null, error: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    return { data: null, error: profileError.message };
  }

  return { data: profile as User, error: null };
}

/**
 * Partially update the current user's profile.
 */
export async function updateProfile(
  updates: UserUpdate,
): Promise<ServiceResult<User>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', session.user.id)
    .select()
    .single();

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  return { data: profile as User, error: null };
}

/**
 * Subscribe to authentication state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
): { unsubscribe: () => void } {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return { unsubscribe: () => subscription.unsubscribe() };
}
