import type { LinkingOptions, NavigationState, PartialState } from '@react-navigation/native';
import { getPathFromState as getPathFromStateDefault, getStateFromPath as getStateFromPathDefault } from '@react-navigation/native';
import * as ExpoLinking from 'expo-linking';
import { appPaths } from './deepLinks';

const linkingConfig = {
  screens: {
    Login: 'login',
    ProfileCompletion: 'onboarding',
    Explore: {
      screens: {
        ExploreHome: '',
        EventDetail: 'explore/events/:eventId',
        ClubDetail: 'explore/clubs/:clubId',
      },
    },
    Map: {
      screens: {
        MapHome: 'map',
        EventDetail: 'map/events/:eventId',
      },
    },
    Feed: {
      screens: {
        FeedHome: 'feed',
        PostDetail: 'feed/posts/:postId',
        UserProfile: 'feed/people/:userId',
      },
    },
    Search: {
      screens: {
        SearchHome: 'search',
        EventDetail: 'search/events/:eventId',
        ClubDetail: 'search/clubs/:clubId',
        UserProfile: 'search/people/:userId',
      },
    },
    Calendar: {
      screens: {
        CalendarHome: 'calendar',
        AddPersonalBlock: 'calendar/add-block',
        CalendarSyncSettings: 'calendar/sync',
        EventDetail: 'calendar/events/:eventId',
        ClubDetail: 'calendar/clubs/:clubId',
      },
    },
    Campus: {
      screens: {
        CampusHome: 'campus',
        ClubsHome: 'campus/clubs',
        ClubDetail: 'campus/clubs/:clubId',
        LibrariesDirectory: 'campus/libraries',
        LibraryProfile: 'campus/libraries/:libraryId',
        CampusFeature: 'campus/features/:featureKey',
        CampusQuickLink: 'campus/links/:quickLinkKey',
        PostDetail: 'campus/posts/:postId',
        UserProfile: 'campus/people/:userId',
      },
    },
    Profile: {
      screens: {
        ProfileHome: 'profile',
        EditProfile: 'profile/edit',
        Settings: 'profile/settings',
        SavedEvents: 'profile/saved-events',
        MyPosts: 'profile/my-posts',
        Connections: 'profile/connections/:mode',
        ClubDetail: 'profile/clubs/:clubId',
        EventDetail: 'profile/events/:eventId',
        PostDetail: 'profile/posts/:postId',
        UserProfile: 'profile/people/:userId',
      },
    },
  },
};

type StateLike = NavigationState | PartialState<NavigationState>;

type ActiveRoute = {
  name: string;
  params?: Record<string, unknown>;
};

function normalizePath(path: string) {
  return path.split('?')[0]?.replace(/^\/+/, '').replace(/\/+$/, '') ?? '';
}

function buildStackState(tabName: string, homeScreenName: string, screenName?: string, params?: Record<string, string>) {
  const stackRoutes = [{ name: homeScreenName } as { name: string; params?: Record<string, string> }];

  if (screenName && screenName !== homeScreenName) {
    stackRoutes.push({ name: screenName, params });
  }

  return {
    routes: [
      {
        name: tabName,
        state: {
          index: stackRoutes.length - 1,
          routes: stackRoutes,
        },
      },
    ],
  };
}

function getActiveRoute(state: StateLike | undefined): ActiveRoute | null {
  if (!state?.routes?.length) {
    return null;
  }

  const index = typeof state.index === 'number' ? state.index : state.routes.length - 1;
  const route = state.routes[index] as { name: string; params?: Record<string, unknown>; state?: StateLike } | undefined;

  if (!route) {
    return null;
  }

  if (route.state) {
    return getActiveRoute(route.state) ?? { name: route.name, params: route.params };
  }

  return { name: route.name, params: route.params };
}

function decodeSegment(value: string) {
  return decodeURIComponent(value);
}

export const linking: LinkingOptions<Record<string, object | undefined>> = {
  prefixes: [
    ExpoLinking.createURL('/'),
    'xumd://',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:3000',
  ],
  config: linkingConfig as any,
  getStateFromPath(path, options) {
    const normalized = normalizePath(path);

    if (!normalized) {
      return getStateFromPathDefault(normalized, linkingConfig as any);
    }

    if (normalized === appPaths.clubs) {
      return buildStackState('Campus', 'CampusHome', 'ClubsHome');
    }

    if (normalized === appPaths.libraries) {
      return buildStackState('Campus', 'CampusHome', 'LibrariesDirectory');
    }

    const eventMatch = normalized.match(/^events\/([^/]+)$/i);
    if (eventMatch) {
      return buildStackState('Map', 'MapHome', 'EventDetail', { eventId: decodeSegment(eventMatch[1]) });
    }

    const clubMatch = normalized.match(/^clubs\/([^/]+)$/i);
    if (clubMatch) {
      return buildStackState('Campus', 'CampusHome', 'ClubDetail', { clubId: decodeSegment(clubMatch[1]) });
    }

    const personMatch = normalized.match(/^people\/([^/]+)$/i);
    if (personMatch) {
      return buildStackState('Profile', 'ProfileHome', 'UserProfile', { userId: decodeSegment(personMatch[1]) });
    }

    const postMatch = normalized.match(/^posts\/([^/]+)$/i);
    if (postMatch) {
      return buildStackState('Feed', 'FeedHome', 'PostDetail', { postId: decodeSegment(postMatch[1]) });
    }

    const libraryMatch = normalized.match(/^libraries\/([^/]+)$/i);
    if (libraryMatch) {
      return buildStackState('Campus', 'CampusHome', 'LibraryProfile', { libraryId: decodeSegment(libraryMatch[1]) });
    }

    return getStateFromPathDefault(normalized, options ?? (linkingConfig as any));
  },
  getPathFromState(state, options) {
    const activeRoute = getActiveRoute(state);

    if (activeRoute?.name === 'ClubsHome') {
      return appPaths.clubs;
    }

    if (activeRoute?.name === 'LibrariesDirectory') {
      return appPaths.libraries;
    }

    if (activeRoute?.name === 'EventDetail' && typeof activeRoute.params?.eventId === 'string') {
      return appPaths.event(activeRoute.params.eventId);
    }

    if (activeRoute?.name === 'ClubDetail' && typeof activeRoute.params?.clubId === 'string') {
      return appPaths.club(activeRoute.params.clubId);
    }

    if (activeRoute?.name === 'UserProfile' && typeof activeRoute.params?.userId === 'string') {
      return appPaths.person(activeRoute.params.userId);
    }

    if (activeRoute?.name === 'PostDetail' && typeof activeRoute.params?.postId === 'string') {
      return appPaths.post(activeRoute.params.postId);
    }

    if (activeRoute?.name === 'LibraryProfile' && typeof activeRoute.params?.libraryId === 'string') {
      return appPaths.library(activeRoute.params.libraryId);
    }

    return getPathFromStateDefault(state, options ?? (linkingConfig as any));
  },
};
