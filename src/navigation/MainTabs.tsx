import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  BottomTabBarButtonProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExploreHomeScreen from '../features/explore/screens/ExploreHomeScreen';
import ArticleDetailScreen from '../features/explore/screens/ArticleDetailScreen';
import NewsArchiveScreen from '../features/explore/screens/NewsArchiveScreen';
import MapHomeScreen from '../features/map/screens/MapHomeScreen';
import CreateEventScreen from '../features/map/screens/CreateEventScreen';
import SelectEventLocationScreen from '../features/map/screens/SelectEventLocationScreen';
import EventDetailScreen from '../features/explore/screens/EventDetailScreen';
import FeedHomeScreen from '../features/feed/screens/FeedHomeScreen';
import PostDetailScreen from '../features/feed/screens/PostDetailScreen';
import ClubsHomeScreen from '../features/clubs/screens/ClubsHomeScreen';
import ClubDetailScreen from '../features/clubs/screens/ClubDetailScreen';
import SearchHomeScreen from '../features/search/screens/SearchHomeScreen';
import CalendarHomeScreen from '../features/calendar/screens/CalendarHomeScreen';
import AddPersonalBlockScreen from '../features/calendar/screens/AddPersonalBlockScreen';
import CalendarSyncSettingsScreen from '../features/calendar/screens/CalendarSyncSettingsScreen';
import CampusHomeScreen from '../features/campus/screens/CampusHomeScreen';
import { CampusFeatureScreen, CampusQuickLinkScreen } from '../features/campus/screens/CampusFeatureScreen';
import LibrariesDirectoryScreen, { LibraryProfileScreen } from '../features/campus/screens/LibrariesScreen';
import SportsEventDetailScreen from '../features/campus/screens/SportsEventDetailScreen';
import ProfileHomeScreen from '../features/profile/screens/ProfileHomeScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';
import SettingsScreen from '../features/profile/screens/SettingsScreen';
import SavedEventsScreen from '../features/profile/screens/SavedEventsScreen';
import MyPostsScreen from '../features/profile/screens/MyPostsScreen';
import ConnectionsScreen from '../features/profile/screens/ConnectionsScreen';
import UserProfileScreen from '../features/social/screens/UserProfileScreen';
import { useResponsive } from '../shared/hooks/useResponsive';
import { colors } from '../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../shared/theme/spacing';
import { typography } from '../shared/theme/typography';
import type {
  CalendarStackParamList,
  CampusStackParamList,
  ExploreStackParamList,
  FeedStackParamList,
  MapStackParamList,
  ProfileStackParamList,
  RootTabParamList,
  SearchStackParamList,
} from './types';

// Height of the icon row (excluding safe area). Used to size the docked bar.
const TAB_BAR_HEIGHT = 50;

const Tab = createBottomTabNavigator<RootTabParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const MapStack = createNativeStackNavigator<MapStackParamList>();
const FeedStack = createNativeStackNavigator<FeedStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const CampusStack = createNativeStackNavigator<CampusStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function TabIcon({
  routeName,
  color,
  focused,
  mobileOnly,
}: {
  routeName: keyof RootTabParamList;
  color: string;
  focused: boolean;
  mobileOnly: boolean;
}) {
  const iconSize = mobileOnly ? (focused ? 26 : 22) : 22;

  return (
    <View style={styles.iconWrap}>
      <Ionicons name={getTabIcon(routeName, focused)} size={iconSize} color={color} />
      {mobileOnly ? <View style={[styles.activeDot, focused ? styles.activeDotVisible : null]} /> : null}
    </View>
  );
}

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreHome" component={ExploreHomeScreen} />
      <ExploreStack.Screen name="EventDetail" component={EventDetailScreen} />
      <ExploreStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <ExploreStack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <ExploreStack.Screen name="NewsArchive" component={NewsArchiveScreen} />
    </ExploreStack.Navigator>
  );
}

function MapNavigator() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="MapHome" component={MapHomeScreen} />
      <MapStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <MapStack.Screen name="SelectEventLocation" component={SelectEventLocationScreen} />
      <MapStack.Screen name="EventDetail" component={EventDetailScreen} />
      <MapStack.Screen name="ClubDetail" component={ClubDetailScreen} />
    </MapStack.Navigator>
  );
}

function FeedNavigator() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedHome" component={FeedHomeScreen} />
      <FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
      <FeedStack.Screen name="EventDetail" component={EventDetailScreen} />
      <FeedStack.Screen name="UserProfile" component={UserProfileScreen} />
    </FeedStack.Navigator>
  );
}

function SearchNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchHome" component={SearchHomeScreen} />
      <SearchStack.Screen name="EventDetail" component={EventDetailScreen} />
      <SearchStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <SearchStack.Screen name="UserProfile" component={UserProfileScreen} />
    </SearchStack.Navigator>
  );
}

function CalendarNavigator() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen name="CalendarHome" component={CalendarHomeScreen} />
      <CalendarStack.Screen name="AddPersonalBlock" component={AddPersonalBlockScreen} />
      <CalendarStack.Screen name="CalendarSyncSettings" component={CalendarSyncSettingsScreen} />
      <CalendarStack.Screen name="EventDetail" component={EventDetailScreen} />
      <CalendarStack.Screen name="SportsEventDetail" component={SportsEventDetailScreen} />
      <CalendarStack.Screen name="ClubDetail" component={ClubDetailScreen} />
    </CalendarStack.Navigator>
  );
}

function CampusNavigator() {
  return (
    <CampusStack.Navigator screenOptions={{ headerShown: false }}>
      <CampusStack.Screen name="CampusHome" component={CampusHomeScreen} />
      <CampusStack.Screen name="ClubsHome" component={ClubsHomeScreen} />
      <CampusStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <CampusStack.Screen name="EventDetail" component={EventDetailScreen} />
      <CampusStack.Screen name="SportsEventDetail" component={SportsEventDetailScreen} />
      <CampusStack.Screen name="PostDetail" component={PostDetailScreen} />
      <CampusStack.Screen name="UserProfile" component={UserProfileScreen} />
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
      <ProfileStack.Screen name="Connections" component={ConnectionsScreen} />
      <ProfileStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <ProfileStack.Screen name="EventDetail" component={EventDetailScreen} />
      <ProfileStack.Screen name="SportsEventDetail" component={SportsEventDetailScreen} />
      <ProfileStack.Screen name="PostDetail" component={PostDetailScreen} />
      <ProfileStack.Screen name="UserProfile" component={UserProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function SearchTabButton({
  onPress,
  accessibilityState,
  accessibilityLabel,
}: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected ?? false;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      style={styles.searchButtonOuter}
    >
      <View style={[styles.searchButtonInner, focused && styles.searchButtonInnerFocused]}>
        <Ionicons name="search" size={22} color={colors.brand.white} />
      </View>
    </Pressable>
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
    case 'Search':
      return 'search';
    case 'Calendar':
      return focused ? 'calendar' : 'calendar-outline';
    case 'Campus':
      return focused ? 'business' : 'business-outline';
    case 'Profile':
      return focused ? 'person' : 'person-outline';
    default:
      return 'ellipse';
  }
}

export default function MainTabs() {
  const { isWide, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const isNativeMobile = Platform.OS !== 'web';
  const tabBarMaxWidth = isDesktop ? 940 : isWide ? 860 : undefined;

  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarShowLabel: !isNativeMobile,
        tabBarStyle: isNativeMobile
          ? {
              backgroundColor: colors.brand.white,
              borderTopWidth: 1,
              borderTopColor: colors.border.light,
              // Icon row + safe area fill so the white background extends to the
              // very bottom edge on devices with a home indicator.
              height: TAB_BAR_HEIGHT + insets.bottom,
              paddingBottom: insets.bottom,
              paddingTop: 0,
              // Required so the Search FAB can protrude above the bar's top edge.
              overflow: 'visible',
            }
          : {
              height: 82,
              paddingTop: spacing.xs,
              paddingBottom: spacing.sm,
              paddingHorizontal: isWide ? spacing.md : spacing.xs,
              backgroundColor: colors.brand.white,
              borderTopColor: colors.border.light,
              width: '100%',
              maxWidth: tabBarMaxWidth,
              alignSelf: 'center',
              ...(isWide
                ? {
                    borderTopLeftRadius: borderRadius.xl,
                    borderTopRightRadius: borderRadius.xl,
                    borderTopWidth: 1,
                  }
                : null),
            },
        tabBarLabelStyle: isNativeMobile
          ? undefined
          : {
              fontSize: 10,
              fontWeight: typography.fontWeight.semiBold,
            },
        tabBarItemStyle: isNativeMobile
          ? {
              height: TAB_BAR_HEIGHT,
              overflow: 'visible',
            }
          : {
              maxWidth: isWide ? 120 : undefined,
            },
        tabBarIcon: ({ color, focused }) =>
          route.name === 'Search' ? null : (
            <TabIcon
              routeName={route.name as keyof RootTabParamList}
              color={color}
              focused={focused}
              mobileOnly={isNativeMobile}
            />
          ),
      })}
    >
      <Tab.Screen name="Explore" component={ExploreNavigator} />
      <Tab.Screen name="Map" component={MapNavigator} />
      <Tab.Screen name="Feed" component={FeedNavigator} />
      <Tab.Screen
        name="Search"
        component={SearchNavigator}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => (
            <SearchTabButton {...props} accessibilityLabel="Search" />
          ),
        }}
      />
      <Tab.Screen name="Calendar" component={CalendarNavigator} />
      <Tab.Screen name="Campus" component={CampusNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    position: 'relative',
    minWidth: 44,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: 1,
    width: 4,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
  },
  activeDotVisible: {
    backgroundColor: colors.primary.main,
  },
  // The Pressable container for the Search FAB sits in the tab bar like any
  // other tab item. `top: -14` lifts it so the circle protrudes above the
  // bar's top edge. `overflow: 'visible'` lets the shadow render outside the
  // container bounds on iOS.
  searchButtonOuter: {
    flex: 1,
    top: -14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  searchButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    // White ring visually separates the FAB from the bar behind it.
    borderWidth: 4,
    borderColor: colors.brand.white,
    ...shadows.md,
  },
  searchButtonInnerFocused: {
    backgroundColor: colors.primary.dark,
  },
});
