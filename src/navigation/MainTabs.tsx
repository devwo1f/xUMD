import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ExploreHomeScreen from '../features/explore/screens/ExploreHomeScreen';
import MapHomeScreen from '../features/map/screens/MapHomeScreen';
import EventDetailScreen from '../features/explore/screens/EventDetailScreen';
import FeedHomeScreen from '../features/feed/screens/FeedHomeScreen';
import PostDetailScreen from '../features/feed/screens/PostDetailScreen';
import ClubsHomeScreen from '../features/clubs/screens/ClubsHomeScreen';
import ClubDetailScreen from '../features/clubs/screens/ClubDetailScreen';
import CampusHomeScreen from '../features/campus/screens/CampusHomeScreen';
import { CampusFeatureScreen, CampusQuickLinkScreen } from '../features/campus/screens/CampusFeatureScreen';
import LibrariesDirectoryScreen, { LibraryProfileScreen } from '../features/campus/screens/LibrariesScreen';
import ProfileHomeScreen from '../features/profile/screens/ProfileHomeScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';
import SettingsScreen from '../features/profile/screens/SettingsScreen';
import SavedEventsScreen from '../features/profile/screens/SavedEventsScreen';
import MyPostsScreen from '../features/profile/screens/MyPostsScreen';
import { colors } from '../shared/theme/colors';
import { spacing } from '../shared/theme/spacing';
import { typography } from '../shared/theme/typography';
import type {
  CampusStackParamList,
  ClubsStackParamList,
  ExploreStackParamList,
  FeedStackParamList,
  MapStackParamList,
  ProfileStackParamList,
  RootTabParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const MapStack = createNativeStackNavigator<MapStackParamList>();
const FeedStack = createNativeStackNavigator<FeedStackParamList>();
const ClubsStack = createNativeStackNavigator<ClubsStackParamList>();
const CampusStack = createNativeStackNavigator<CampusStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreHome" component={ExploreHomeScreen} />
      <ExploreStack.Screen name="EventDetail" component={EventDetailScreen} />
    </ExploreStack.Navigator>
  );
}

function MapNavigator() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="MapHome" component={MapHomeScreen} />
      <MapStack.Screen name="EventDetail" component={EventDetailScreen} />
    </MapStack.Navigator>
  );
}

function FeedNavigator() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedHome" component={FeedHomeScreen} />
      <FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
    </FeedStack.Navigator>
  );
}

function ClubsNavigator() {
  return (
    <ClubsStack.Navigator screenOptions={{ headerShown: false }}>
      <ClubsStack.Screen name="ClubsHome" component={ClubsHomeScreen} />
      <ClubsStack.Screen name="ClubDetail" component={ClubDetailScreen} />
    </ClubsStack.Navigator>
  );
}

function CampusNavigator() {
  return (
    <CampusStack.Navigator screenOptions={{ headerShown: false }}>
      <CampusStack.Screen name="CampusHome" component={CampusHomeScreen} />
      <CampusStack.Screen name="LibrariesDirectory" component={LibrariesDirectoryScreen} />
      <CampusStack.Screen name="LibraryProfile" component={LibraryProfileScreen} />
      <CampusStack.Screen name="CampusFeature" component={CampusFeatureScreen} />
      <CampusStack.Screen name="CampusQuickLink" component={CampusQuickLinkScreen} />
    </CampusStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="SavedEvents" component={SavedEventsScreen} />
      <ProfileStack.Screen name="MyPosts" component={MyPostsScreen} />
      <ProfileStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <ProfileStack.Screen name="EventDetail" component={EventDetailScreen} />
      <ProfileStack.Screen name="PostDetail" component={PostDetailScreen} />
    </ProfileStack.Navigator>
  );
}

function getTabIcon(routeName: keyof RootTabParamList, focused: boolean) {
  switch (routeName) {
    case 'Explore':
      return focused ? 'compass' : 'compass-outline';
    case 'Map':
      return focused ? 'map' : 'map-outline';
    case 'Feed':
      return focused ? 'grid' : 'grid-outline';
    case 'Clubs':
      return focused ? 'people' : 'people-outline';
    case 'Campus':
      return focused ? 'business' : 'business-outline';
    case 'Profile':
      return focused ? 'person' : 'person-outline';
    default:
      return 'ellipse';
  }
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          height: 74,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
          backgroundColor: colors.brand.white,
          borderTopColor: colors.border.light,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: typography.fontWeight.semiBold,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={getTabIcon(route.name as keyof RootTabParamList, focused)}
            size={size ?? 20}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Explore" component={ExploreNavigator} />
      <Tab.Screen name="Map" component={MapNavigator} />
      <Tab.Screen name="Feed" component={FeedNavigator} />
      <Tab.Screen name="Clubs" component={ClubsNavigator} />
      <Tab.Screen name="Campus" component={CampusNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
