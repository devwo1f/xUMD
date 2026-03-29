/**
 * useAuth Hook
 *
 * Zustand-based authentication store that wraps the Supabase auth service.
 * Manages user session state and exposes auth actions to the UI.
 */

import { useEffect } from 'react';
import { create } from 'zustand';
import { supabase, isSupabaseConfigured, supabaseConfigError } from '../../../services/supabase';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile, UserProfileUpdate } from '../../../shared/types';

// ── Constants ───────────────────────────────────────────────────

const UMD_EMAIL_DOMAIN = '@terpmail.umd.edu';
let authListenerInitialized = false;

// ── Store Types ─────────────────────────────────────────────────

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: UserProfileUpdate) => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setSession: (session: Session | null) => void;
  setUser: (user: UserProfile | null) => void;
}

// ── Email Validation ────────────────────────────────────────────

export function validateUmdEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return 'Email is required.';
  }
  if (!trimmed.endsWith(UMD_EMAIL_DOMAIN)) {
    return `Only ${UMD_EMAIL_DOMAIN} email addresses are allowed.`;
  }
  return null;
}

// ── Password Validation Helpers ─────────────────────────────────

export function validatePassword(password: string): {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
} {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return {
    isValid: hasMinLength && hasUppercase && hasNumber,
    hasMinLength,
    hasUppercase,
    hasNumber,
  };
}

// ── Fetch Profile Helper ────────────────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

// ── Zustand Store ───────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  clearError: () => set({ error: null }),
  setLoading: (loading) => set({ loading }),
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),

  // ── Sign In ─────────────────────────────────────────────────

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      set({ loading: false, error: supabaseConfigError });
      return;
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    if (!data.user || !data.session) {
      set({ loading: false, error: 'Sign-in failed. Please try again.' });
      return;
    }

    const profile = await fetchProfile(data.user.id);
    set({
      session: data.session,
      user: profile,
      loading: false,
      error: null,
    });
  },

  // ── Sign Up ─────────────────────────────────────────────────

  signUp: async (email: string, password: string, displayName: string) => {
    if (!isSupabaseConfigured) {
      set({ loading: false, error: supabaseConfigError });
      return;
    }

    set({ loading: true, error: null });

    const emailError = validateUmdEmail(email);
    if (emailError) {
      set({ loading: false, error: emailError });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    if (!data.user) {
      set({ loading: false, error: 'Sign-up failed. Please try again.' });
      return;
    }

    // Create the public profile row
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: email.trim().toLowerCase(),
      display_name: displayName,
    });

    if (profileError) {
      set({ loading: false, error: profileError.message });
      return;
    }

    const profile = await fetchProfile(data.user.id);
    set({
      session: data.session,
      user: profile,
      loading: false,
      error: null,
    });
  },

  // ── Sign Out ────────────────────────────────────────────────

  signOut: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, session: null, loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ user: null, session: null, loading: false, error: null });
  },

  // ── Reset Password ──────────────────────────────────────────

  resetPassword: async (email: string) => {
    if (!isSupabaseConfigured) {
      set({ loading: false, error: supabaseConfigError });
      return;
    }

    set({ loading: true, error: null });

    const emailError = validateUmdEmail(email);
    if (emailError) {
      set({ loading: false, error: emailError });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
    );

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ loading: false, error: null });
  },

  // ── Update Profile ──────────────────────────────────────────

  updateProfile: async (updates: UserProfileUpdate) => {
    if (!isSupabaseConfigured) {
      set({ loading: false, error: supabaseConfigError });
      return;
    }

    const { session } = get();
    if (!session?.user) {
      set({ error: 'Not authenticated.' });
      return;
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ user: data as UserProfile, loading: false, error: null });
  },

  // ── Check Session ───────────────────────────────────────────

  checkSession: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, session: null, loading: false, error: null });
      return;
    }

    set({ loading: true });

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
      set({ user: null, session: null, loading: false });
      return;
    }

    const profile = await fetchProfile(session.user.id);
    set({ session, user: profile, loading: false });
  },
}));

// ── Hook with Auth Listener ─────────────────────────────────────

export function useInitializeAuth() {
  useEffect(() => {
    if (authListenerInitialized) {
      return;
    }

    authListenerInitialized = true;

    // Check for existing session on mount
    void useAuthStore.getState().checkSession();

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      useAuthStore.getState().setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        useAuthStore.setState({ user: profile, loading: false });
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, session: null, loading: false });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        useAuthStore.setState({ session, loading: false });
      }
    });

    return () => {
      authListenerInitialized = false;
      subscription.unsubscribe();
    };
  }, []);
}

/**
 * Primary auth hook for consuming auth state and actions.
 * Initialize the auth listener once at the app root with useInitializeAuth().
 */
export function useAuth() {
  return useAuthStore();
}

export default useAuth;
