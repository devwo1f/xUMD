import React from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  BottomTabBarButtonProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExploreHomeScreen from '../features/explore/screens/ExploreHomeScreen';
import MapHomeScreen from '../features/map/screens/MapHomeScreen';
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
    </ExploreStack.Navigator>
  );
}

function MapNavigator() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="MapHome" component={MapHomeScreen} />
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
      <ProfileStack.Screen name="PostDetail" component={PostDetailScreen} />
      <ProfileStack.Screen name="UserProfile" component={UserProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function SearchTabButton({
  onPress,
  accessibilityState,
  accessibilityLabel,
  floating,
}: BottomTabBarButtonProps & { floating: boolean }) {
  const focused = accessibilityState?.selected ?? false;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      style={[styles.searchButtonOuter, floating ? styles.searchButtonOuterFloating : null]}
    >
      <View
        style={[
          styles.searchButtonInner,
          floating ? styles.searchButtonInnerFloating : null,
          focused && styles.searchButtonInnerFocused,
        ]}
      >
        <Ionicons name="search" size={24} color={colors.brand.white} />
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
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const isNativeMobile = Platform.OS !== 'web';
  const tabBarMaxWidth = isDesktop ? 940 : isWide ? 860 : undefined;
  const floatingHorizontalInset = viewportWidth * 0.05;
  const floatingBottomOffset = insets.bottom + viewportHeight * 0.012;
  const floatingTabBarMaxWidth = isWide ? 620 : undefined;

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
              position: 'absolute',
              left: floatingHorizontalInset,
              right: floatingHorizontalInset,
              bottom: floatingBottomOffset,
              height: 58,
              paddingTop: 0,
              paddingBottom: 0,
              paddingHorizontal: viewportWidth * 0.018,
              backgroundColor: 'rgba(255,255,255,0.78)',
              borderTopWidth: 0,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.06)',
              borderRadius: 29,
              overflow: 'visible',
              width: undefined,
              maxWidth: floatingTabBarMaxWidth,
              alignSelf: 'center',
              ...styles.mobileTabShadow,
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
        tabBarBackground: isNativeMobile
          ? () => (
              <View style={styles.mobileTabBackground}>
                <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.mobileTabTint} />
              </View>
            )
          : undefined,
        tabBarLabelStyle: isNativeMobile
          ? undefined
          : {
              fontSize: 10,
              fontWeight: typography.fontWeight.semiBold,
            },
        tabBarItemStyle: isNativeMobile
          ? styles.mobileTabItem
          : {
              maxWidth: isWide ? 120 : undefined,
            },
        tabBarIcon: ({ color, size, focused }) =>
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
            <SearchTabButton {...props} accessibilityLabel="Search" floating={isNativeMobile} />
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
    minHeight: 44,
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
  searchButtonOuter: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  searchButtonOuterFloating: {
    zIndex: 24,
    elevation: 24,
  },
  searchButtonInner: {
    width: 66,
    height: 66,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.brand.white,
    ...shadows.lg,
  },
  searchButtonInnerFloating: {
    width: 56,
    height: 56,
    borderWidth: 4,
    transform: [{ translateY: -28 }],
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  searchButtonInnerFocused: {
    backgroundColor: colors.primary.dark,
    transform: [{ scale: 1.02 }],
  },
  mobileTabBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 29,
    overflow: 'hidden',
  },
  mobileTabTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.68)',
  },
  mobileTabShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  mobileTabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    overflow: 'visible',
  },
});
