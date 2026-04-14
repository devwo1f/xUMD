import { create } from 'zustand';
import { mockEventPresenceByUser, mockJoinedClubIdsByUser } from '../../assets/data/mockAppState';
import { CURRENT_SOCIAL_USER_ID } from '../../features/social/data/mockSocialGraph';

interface DemoSettings {
  pushNotifications: boolean;
  emailDigest: boolean;
  locationSharing: boolean;
  campusAlerts: boolean;
}

interface DemoAppState {
  savedEventIds: string[];
  goingEventIds: string[];
  joinedClubIds: string[];
  settings: DemoSettings;
  hydrateEventPresence: (payload: { goingEventIds: string[]; savedEventIds: string[] }) => void;
  toggleSavedEvent: (eventId: string) => void;
  toggleGoingEvent: (eventId: string) => void;
  setEventRsvpStatus: (eventId: string, status: 'going' | 'interested' | null) => void;
  toggleJoinedClub: (clubId: string) => void;
  updateSetting: (key: keyof DemoSettings, value: boolean) => void;
  reset: () => void;
}

function buildInitialState(userId = CURRENT_SOCIAL_USER_ID) {
  const eventPresence = mockEventPresenceByUser[userId] ?? {
    goingEventIds: [],
    savedEventIds: [],
  };

  return {
    savedEventIds: eventPresence.savedEventIds,
    goingEventIds: eventPresence.goingEventIds,
    joinedClubIds: mockJoinedClubIdsByUser[userId] ?? [],
    settings: {
      pushNotifications: true,
      emailDigest: false,
      locationSharing: true,
      campusAlerts: true,
    },
  };
}

const initialState = buildInitialState();

export const useDemoAppStore = create<DemoAppState>((set) => ({
  ...initialState,
  hydrateEventPresence: ({ goingEventIds, savedEventIds }) =>
    set({
      goingEventIds: Array.from(new Set(goingEventIds)),
      savedEventIds: Array.from(new Set(savedEventIds.filter((id) => !goingEventIds.includes(id)))),
    }),
  toggleSavedEvent: (eventId) =>
    set((state) => ({
      savedEventIds: state.savedEventIds.includes(eventId)
        ? state.savedEventIds.filter((id) => id !== eventId)
        : [...state.savedEventIds, eventId],
    })),
  toggleGoingEvent: (eventId) =>
    set((state) => ({
      goingEventIds: state.goingEventIds.includes(eventId)
        ? state.goingEventIds.filter((id) => id !== eventId)
        : [...state.goingEventIds, eventId],
    })),
  setEventRsvpStatus: (eventId, status) =>
    set((state) => ({
      goingEventIds:
        status === 'going'
          ? Array.from(new Set([...state.goingEventIds.filter((id) => id !== eventId), eventId]))
          : state.goingEventIds.filter((id) => id !== eventId),
      savedEventIds:
        status === 'interested'
          ? Array.from(new Set([...state.savedEventIds.filter((id) => id !== eventId), eventId]))
          : state.savedEventIds.filter((id) => id !== eventId),
    })),
  toggleJoinedClub: (clubId) =>
    set((state) => ({
      joinedClubIds: state.joinedClubIds.includes(clubId)
        ? state.joinedClubIds.filter((id) => id !== clubId)
        : [...state.joinedClubIds, clubId],
    })),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value,
      },
    })),
  reset: () => set(buildInitialState()),
}));
