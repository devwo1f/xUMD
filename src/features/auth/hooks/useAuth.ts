import { AppState } from 'react-native';
import { useEffect } from 'react';
import { create } from 'zustand';
import type { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { queryClient } from '../../../providers/AppProviders';
import { useMapFilterStore } from '../../map/stores/useMapFilterStore';
import { useAuthFlowStore } from '../stores/authStore';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { requestOtp as requestOtpThroughServer, verifyOtp as verifyOtpThroughServer } from '../../../services/auth';
import { supabase, isSupabaseConfigured, supabaseConfigError } from '../../../services/supabase';
import type { DegreeType, UserProfile, UserProfileUpdate } from '../../../shared/types';

export const ALLOWED_EMAIL_DOMAINS = ['umd.edu', 'terpmail.umd.edu'] as const;
export const OTP_COOLDOWN_SECONDS = 60;

let authListenerInitialized = false;

export interface CompleteProfilePayload {
  display_name: string;
  username: string;
  major: string | null;
  graduation_year: number | null;
  degree_type: DegreeType | null;
  minor?: string | null;
  courses: string[];
  interests: string[];
  bio?: string | null;
  avatar_url?: string | null;
}

interface AuthSessionState {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  checkProfileComplete: (userId: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: UserProfileUpdate) => Promise<void>;
  saveOnboardingProgress: (updates: Partial<UserProfile> & { onboarding_step: number }) => Promise<void>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password?: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setSession: (session: Session | null) => void;
  setUser: (user: UserProfile | null) => void;
}

export function sanitizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
}

export function validateUmdEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmed) {
    return { valid: false, error: 'Email is required.' };
  }

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  const domain = trimmed.split('@')[1] ?? '';
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain as (typeof ALLOWED_EMAIL_DOMAINS)[number])) {
    return { valid: false, error: 'Only @umd.edu and @terpmail.umd.edu emails are allowed.' };
  }

  return { valid: true };
}

export function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();

  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (message.includes('invalid') && (message.includes('otp') || message.includes('token') || message.includes('code'))) {
    return 'Invalid code. Please check and try again.';
  }
  if (message.includes('expired')) {
    return 'Code expired. Tap resend to get a new one.';
  }
  if (message.includes('email')) {
    return 'Unable to send verification email. Please try again.';
  }
  if (message.includes('umd')) {
    return 'Only @umd.edu and @terpmail.umd.edu emails are allowed.';
  }
  if (message.includes('network')) {
    return 'Network issue. Please try again in a moment.';
  }

  return 'Something went wrong. Please try again.';
}

function buildFallbackProfile(authUser: SupabaseAuthUser): UserProfile {
  const email = authUser.email ?? 'student@umd.edu';
  const emailPrefix = email.split('@')[0] ?? 'terp';
  const displayName =
    typeof authUser.user_metadata?.display_name === 'string' && authUser.user_metadata.display_name.trim().length > 0
      ? authUser.user_metadata.display_name
      : emailPrefix
          .split(/[._-]/)
          .filter(Boolean)
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ') || 'Terp';

  return {
    id: authUser.id,
    email,
    username: sanitizeUsername(emailPrefix),
    display_name: displayName,
    avatar_url: null,
    major: null,
    graduation_year: null,
    degree_type: null,
    minor: null,
    bio: null,
    pronouns: null,
    clubs: [],
    courses: [],
    interests: [],
    follower_count: 0,
    following_count: 0,
    profile_completed: false,
    onboarding_step: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error || !data) {
    return null;
  }
  return data as UserProfile;
}

async function syncUserFromSession(session: Session | null) {
  if (!session?.user) {
    return null;
  }

  const profile = await fetchProfile(session.user.id);
  return profile ?? buildFallbackProfile(session.user);
}

async function updateUserRow(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, ...updates }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfile;
}

export const useAuthSessionStore = create<AuthSessionState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  error: null,

  clearError: () => set({ error: null }),
  setLoading: (loading) => set({ loading }),
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),

  requestOtp: async (email) => {
    if (!isSupabaseConfigured) {
      set({ loading: false, error: supabaseConfigError });
      throw new Error(supabaseConfigError);
    }

    const validation = validateUmdEmail(email);
    if (!validation.valid) {
      const message = validation.error ?? 'Invalid email.';
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });

    try {
      await requestOtpThroughServer(email.trim().toLowerCase());

      set({ loading: false, error: null, initialized: true });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  verifyOtp: async (email, token) => {
    if (!isSupabaseConfigured) {
      set({ loading: false, error: supabaseConfigError });
      throw new Error(supabaseConfigError);
    }

    set({ loading: true, error: null });

    try {
      const data = await verifyOtpThroughServer(email.trim().toLowerCase(), token.trim());
      const nextSession = data.session ?? null;
      const nextUser = await syncUserFromSession(nextSession);

      set({
        session: nextSession,
        user: nextUser,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  checkProfileComplete: async (userId) => {
    const profile = await fetchProfile(userId);
    return profile?.profile_completed ?? false;
  },

  refreshProfile: async () => {
    const { session } = get();
    if (!session?.user) {
      return;
    }

    const nextUser = await syncUserFromSession(session);
    set({ user: nextUser });
  },

  updateProfile: async (updates) => {
    if (!isSupabaseConfigured) {
      set({ loading: false, error: supabaseConfigError });
      throw new Error(supabaseConfigError);
    }

    const { session } = get();
    if (!session?.user) {
      throw new Error('Not authenticated.');
    }

    set({ loading: true, error: null });
    try {
      const payload = {
        ...updates,
        username: updates.username ? sanitizeUsername(updates.username) : undefined,
        updated_at: new Date().toISOString(),
      };
      const nextUser = await updateUserRow(session.user.id, payload);
      set({ user: nextUser, loading: false, error: null });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  saveOnboardingProgress: async (updates) => {
    const { session } = get();
    if (!session?.user) {
      throw new Error('Not authenticated.');
    }

    set({ loading: true, error: null });
    try {
      const nextUser = await updateUserRow(session.user.id, {
        ...updates,
        username: updates.username ? sanitizeUsername(updates.username) : undefined,
        updated_at: new Date().toISOString(),
      });
      set({ user: nextUser, loading: false, error: null });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  completeProfile: async (payload) => {
    const { session } = get();
    if (!session?.user) {
      throw new Error('Not authenticated.');
    }

    set({ loading: true, error: null });
    try {
      const nextUser = await updateUserRow(session.user.id, {
        display_name: payload.display_name,
        username: sanitizeUsername(payload.username),
        major: payload.major,
        graduation_year: payload.graduation_year,
        degree_type: payload.degree_type,
        minor: payload.minor ?? null,
        bio: payload.bio ?? null,
        avatar_url: payload.avatar_url ?? null,
        courses: payload.courses,
        interests: payload.interests,
        profile_completed: true,
        onboarding_step: 4,
        updated_at: new Date().toISOString(),
      });
      set({ user: nextUser, loading: false, error: null });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, session: null, loading: false, initialized: true, error: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      await supabase.auth.signOut();
      useAuthFlowStore.getState().reset();
      useDemoAppStore.getState().reset();
      useMapFilterStore.getState().reset();
      queryClient.clear();
      set({ user: null, session: null, loading: false, initialized: true, error: null });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  signIn: async (email) => {
    await get().requestOtp(email);
  },

  signUp: async (email) => {
    await get().requestOtp(email);
  },

  resetPassword: async (email) => {
    await get().requestOtp(email);
  },
}));

export function useInitializeAuth() {
  useEffect(() => {
    if (authListenerInitialized) {
      return;
    }

    authListenerInitialized = true;

    if (!isSupabaseConfigured) {
      useAuthSessionStore.setState({ loading: false, initialized: true, error: null, session: null, user: null });
      return;
    }

    void useAuthSessionStore.getState().refreshProfile();

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        useAuthSessionStore.setState({ loading: false, initialized: true, error: getAuthErrorMessage(error), session: null, user: null });
        return;
      }

      const session = data.session ?? null;
      const user = await syncUserFromSession(session);
      useAuthSessionStore.setState({ session, user, loading: false, initialized: true, error: null });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = await syncUserFromSession(session ?? null);
      useAuthSessionStore.setState({ session: session ?? null, user, loading: false, initialized: true, error: null });
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void supabase.auth.startAutoRefresh();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      authListenerInitialized = false;
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);
}

export function useAuth() {
  const store = useAuthSessionStore();

  return {
    ...store,
    needsProfileCompletion: Boolean(store.session && store.user && !store.user.profile_completed),
  };
}

export default useAuth;




