import { create } from 'zustand';
import { profile as mockProfile } from '../../../experience/content';

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

const initialProfile: ProfileData = {
  id: 'user-001',
  email: 'alexj@terpmail.umd.edu',
  displayName: mockProfile.name,
  username: mockProfile.handle,
  avatar: mockProfile.avatar,
  major: mockProfile.major,
  classYear: mockProfile.classYear,
  bio: mockProfile.bio,
  stats: mockProfile.stats,
  clubs: mockProfile.clubs,
};

interface ProfileStore {
  user: ProfileData;
  loading: boolean;
  updateProfile: (
    updates: Partial<
      Pick<ProfileData, 'displayName' | 'username' | 'bio' | 'major' | 'classYear'>
    >,
  ) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  user: initialProfile,
  loading: false,
  updateProfile: async (updates) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 600));
    set((state) => ({
      user: { ...state.user, ...updates },
      loading: false,
    }));
  },
  uploadAvatar: async (uri) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    set((state) => ({
      user: { ...state.user, avatar: uri },
      loading: false,
    }));
  },
}));

export function useProfile() {
  return useProfileStore();
}
