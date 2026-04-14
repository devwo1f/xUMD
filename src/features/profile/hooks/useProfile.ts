import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { mockUsers } from '../../../assets/data/mockClubs';
import { CURRENT_SOCIAL_USER_ID } from '../../social/data/mockSocialGraph';
import { isSupabaseConfigured } from '../../../services/supabase';
import { clearAvatarForUser, type AvatarUploadAsset, uploadAvatarAsset } from '../../../services/profileMedia';
import { useAuth } from '../../auth/hooks/useAuth';

export interface ProfileData {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatar: string;
  major: string;
  classYear: number;
  bio: string;
  stats: { label: string; value: string }[];
  clubs: string[];
}

function buildInitialProfile(): ProfileData {
  const seededUser =
    mockUsers.find((user) => user.id === CURRENT_SOCIAL_USER_ID) ??
    mockUsers[0];

  if (!seededUser) {
    return {
      id: 'user-001',
      email: 'alexj@terpmail.umd.edu',
      displayName: 'Alex Johnson',
      username: 'alexj_terp',
      avatar: '',
      major: 'UMD Student',
      classYear: new Date().getFullYear() + 1,
      bio: 'Building your Maryland story.',
      stats: [
        { label: 'Posts', value: '0' },
        { label: 'Followers', value: '0' },
        { label: 'Following', value: '0' },
      ],
      clubs: [],
    };
  }

  return {
    id: seededUser.id,
    email: seededUser.email,
    displayName: seededUser.display_name,
    username: seededUser.username ?? seededUser.email.split('@')[0],
    avatar: seededUser.avatar_url ?? '',
    major: seededUser.major ?? 'UMD Student',
    classYear: seededUser.graduation_year ?? new Date().getFullYear() + 4,
    bio: seededUser.bio ?? 'Building your Maryland story.',
    stats: [
      { label: 'Posts', value: '0' },
      { label: 'Followers', value: String(seededUser.follower_count ?? 0) },
      { label: 'Following', value: String(seededUser.following_count ?? 0) },
    ],
    clubs: seededUser.clubs ?? [],
  };
}

const initialProfile: ProfileData = buildInitialProfile();

interface ProfileStore {
  user: ProfileData;
  loading: boolean;
  updateProfile: (
    updates: Partial<
      Pick<ProfileData, 'displayName' | 'username' | 'bio' | 'major' | 'classYear'>
    >,
  ) => Promise<void>;
  uploadAvatar: (asset: AvatarUploadAsset | null) => Promise<void>;
  reset: () => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  user: initialProfile,
  loading: false,
  updateProfile: async (updates) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      user: { ...state.user, ...updates },
      loading: false,
    }));
  },
  uploadAvatar: async (asset) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      user: { ...state.user, avatar: asset?.uri ?? '' },
      loading: false,
    }));
  },
  reset: () => set({ user: initialProfile, loading: false }),
}));

function buildProfileFromAuth(user: ReturnType<typeof useAuth>['user']): ProfileData | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    username: user.username ?? user.email.split('@')[0],
    avatar: user.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}`,
    major: user.major ?? 'UMD Student',
    classYear: user.graduation_year ?? new Date().getFullYear() + 4,
    bio: user.bio ?? 'Building your Maryland story.',
    stats: [
      { label: 'Posts', value: '0' },
      { label: 'Followers', value: String(user.follower_count ?? 0) },
      { label: 'Following', value: String(user.following_count ?? 0) },
    ],
    clubs: user.clubs ?? [],
  };
}

export function useProfile() {
  const auth = useAuth();
  const demo = useProfileStore();

  const authProfile = useMemo(() => buildProfileFromAuth(auth.user), [auth.user]);

  const updateProfile = useCallback<ProfileStore['updateProfile']>(
    async (updates) => {
      if (isSupabaseConfigured && auth.user) {
        await auth.updateProfile({
          display_name: updates.displayName,
          username: updates.username?.replace(/^@/, ''),
          bio: updates.bio,
          major: updates.major,
          graduation_year: updates.classYear,
        });
        return;
      }

      await demo.updateProfile(updates);
    },
    [auth, demo],
  );

  const uploadAvatar = useCallback<ProfileStore['uploadAvatar']>(
    async (asset) => {
      if (isSupabaseConfigured && auth.user) {
        if (!asset) {
          await clearAvatarForUser(auth.user.id);
          await auth.updateProfile({ avatar_url: null });
          return;
        }

        const avatarUrl = await uploadAvatarAsset(auth.user.id, asset);
        await auth.updateProfile({ avatar_url: avatarUrl });
        return;
      }

      await demo.uploadAvatar(asset);
    },
    [auth, demo],
  );

  return {
    user: authProfile ?? demo.user,
    loading: isSupabaseConfigured && auth.user ? auth.loading : demo.loading,
    updateProfile,
    uploadAvatar,
  };
}
