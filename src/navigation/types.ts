export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type RootTabParamList = {
  Explore: undefined;
  Map: undefined;
  Feed: undefined;
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
};

export type ClubsStackParamList = {
  ClubsHome: undefined;
  ClubDetail: { clubId: string };
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
  ClubDetail: { clubId: string };
  EventDetail: { eventId: string };
  PostDetail: { postId: string };
};
