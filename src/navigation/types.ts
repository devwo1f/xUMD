export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  ProfileCompletion: undefined;
};

export type RootTabParamList = {
  Explore: undefined;
  Map: undefined;
  Feed: undefined;
  Search: undefined;
  Clubs: undefined;
  Campus: undefined;
  Profile: undefined;
};

export type ExploreStackParamList = {
  ExploreHome: undefined;
  EventDetail: { eventId: string };
};

export type MapStackParamList = {
  MapHome: undefined;
  EventDetail: { eventId: string };
};

export type FeedStackParamList = {
  FeedHome: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};

export type SearchStackParamList = {
  SearchHome: undefined;
  EventDetail: { eventId: string };
  ClubDetail: { clubId: string };
  UserProfile: { userId: string };
};

export type ClubsStackParamList = {
  ClubsHome: undefined;
  ClubDetail: { clubId: string };
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};

export type CampusFeatureKey =
  | 'dining'
  | 'sports'
  | 'safety'
  | 'study-spots'
  | 'campus-info'
  | 'course-reviews';

export type QuickLinkKey = 'terpmail' | 'elms' | 'testudo' | 'shuttle-um';

export type CampusStackParamList = {
  CampusHome: undefined;
  CampusFeature: { featureKey: CampusFeatureKey };
  CampusQuickLink: { quickLinkKey: QuickLinkKey };
  LibrariesDirectory: undefined;
  LibraryProfile: { libraryId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Settings: undefined;
  SavedEvents: undefined;
  MyPosts: undefined;
  Connections: { mode: 'followers' | 'following' | 'mutuals' | 'discover' };
  ClubDetail: { clubId: string };
  EventDetail: { eventId: string };
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};
