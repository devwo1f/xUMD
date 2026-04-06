import * as ExpoLinking from 'expo-linking';

function normalizePath(path: string) {
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

export const appPaths = {
  home: '',
  map: 'map',
  feed: 'feed',
  search: 'search',
  calendar: 'calendar',
  campus: 'campus',
  clubs: 'clubs',
  libraries: 'libraries',
  profile: 'profile',
  login: 'login',
  onboarding: 'onboarding',
  event: (eventId: string) => `events/${eventId}`,
  club: (clubId: string) => `clubs/${clubId}`,
  person: (userId: string) => `people/${userId}`,
  post: (postId: string) => `posts/${postId}`,
  library: (libraryId: string) => `libraries/${libraryId}`,
};

export function createAppUrl(path: string) {
  return ExpoLinking.createURL(normalizePath(path));
}

export function createEventUrl(eventId: string) {
  return createAppUrl(appPaths.event(eventId));
}

export function createClubUrl(clubId: string) {
  return createAppUrl(appPaths.club(clubId));
}

export function createPersonUrl(userId: string) {
  return createAppUrl(appPaths.person(userId));
}

export function createPostUrl(postId: string) {
  return createAppUrl(appPaths.post(postId));
}

export function createLibraryUrl(libraryId: string) {
  return createAppUrl(appPaths.library(libraryId));
}
