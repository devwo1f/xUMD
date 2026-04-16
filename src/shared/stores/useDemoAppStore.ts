import { create } from 'zustand';
import { mockEventPresenceByUser, mockJoinedClubIdsByUser } from '../../assets/data/mockAppState';
import { CURRENT_SOCIAL_USER_ID } from '../../features/social/data/mockSocialGraph';

interface DemoSettings {
  pushNotifications: boolean;
  emailDigest: boolean;
  locationSharing: boolean;
  campusAlerts: boolean;
}

type RsvpStatus = 'going' | 'interested' | null;

interface DemoAppState {
  savedEventIds: string[];
  goingEventIds: string[];
  rsvpOverrides: Record<string, RsvpStatus>;
  joinedClubIds: string[];
  settings: DemoSettings;
  hydrateEventPresence: (payload: { goingEventIds: string[]; savedEventIds: string[] }) => void;
  toggleSavedEvent: (eventId: string) => void;
  toggleGoingEvent: (eventId: string) => void;
  setEventRsvpStatus: (eventId: string, status: RsvpStatus) => void;
  confirmEventRsvpStatus: (eventId: string, status: RsvpStatus) => void;
  toggleJoinedClub: (clubId: string) => void;
  updateSetting: (key: keyof DemoSettings, value: boolean) => void;
  reset: () => void;
}

function applyRsvpStatus(
  state: Pick<DemoAppState, 'goingEventIds' | 'savedEventIds'>,
  eventId: string,
  status: RsvpStatus,
) {
  return {
    goingEventIds:
      status === 'going'
        ? Array.from(new Set([...state.goingEventIds.filter((id) => id !== eventId), eventId]))
        : state.goingEventIds.filter((id) => id !== eventId),
    savedEventIds:
      status === 'interested'
        ? Array.from(new Set([...state.savedEventIds.filter((id) => id !== eventId), eventId]))
        : state.savedEventIds.filter((id) => id !== eventId),
  };
}

function getRsvpStatus(
  eventId: string,
  state: Pick<DemoAppState, 'goingEventIds' | 'savedEventIds'>,
): RsvpStatus {
  if (state.goingEventIds.includes(eventId)) {
    return 'going';
  }

  if (state.savedEventIds.includes(eventId)) {
    return 'interested';
  }

  return null;
}

function buildInitialState(userId = CURRENT_SOCIAL_USER_ID) {
  const eventPresence = mockEventPresenceByUser[userId] ?? {
    goingEventIds: [],
    savedEventIds: [],
  };

  return {
    savedEventIds: eventPresence.savedEventIds,
    goingEventIds: eventPresence.goingEventIds,
    rsvpOverrides: {},
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
    set((state) => {
      const nextGoingIds = Array.from(new Set(goingEventIds));
      const nextSavedIds = Array.from(new Set(savedEventIds.filter((id) => !nextGoingIds.includes(id))));
      const nextState = {
        goingEventIds: nextGoingIds,
        savedEventIds: nextSavedIds,
      };
      const nextOverrides = { ...state.rsvpOverrides };

      Object.entries(state.rsvpOverrides).forEach(([eventId, status]) => {
        const remoteStatus = getRsvpStatus(eventId, nextState);
        const merged = applyRsvpStatus(nextState, eventId, status);
        nextState.goingEventIds = merged.goingEventIds;
        nextState.savedEventIds = merged.savedEventIds;

        if (remoteStatus === status) {
          delete nextOverrides[eventId];
        }
      });

      return {
        ...nextState,
        rsvpOverrides: nextOverrides,
      };
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
    set((state) => {
      const nextPresence = applyRsvpStatus(state, eventId, status);
      return {
        ...nextPresence,
        rsvpOverrides: {
          ...state.rsvpOverrides,
          [eventId]: status,
        },
      };
    }),
  confirmEventRsvpStatus: (eventId, status) =>
    set((state) => {
      const nextPresence = applyRsvpStatus(state, eventId, status);
      const nextOverrides = { ...state.rsvpOverrides };
      delete nextOverrides[eventId];
      return {
        ...nextPresence,
        rsvpOverrides: nextOverrides,
      };
    }),
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
