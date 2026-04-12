import { create } from 'zustand';

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

const initialState = {
  savedEventIds: ['evt-002', 'evt-003', 'evt-006'],
  goingEventIds: ['evt-001', 'evt-004', 'evt-009'],
  joinedClubIds: ['club-001', 'club-003', 'club-005', 'club-006'],
  settings: {
    pushNotifications: true,
    emailDigest: false,
    locationSharing: true,
    campusAlerts: true,
  },
};

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
  reset: () => set(initialState),
}));
