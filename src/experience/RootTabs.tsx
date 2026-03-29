import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Avatar from '../shared/components/Avatar';
import Badge from '../shared/components/Badge';
import BottomSheet from '../shared/components/BottomSheet';
import Button from '../shared/components/Button';
import ResponsiveContainer from '../shared/components/ResponsiveContainer';
import { buildings, type Building } from '../assets/data/buildings';
import CampusMap from '../features/map/components/CampusMap';
import { useMapData, type TimeFilter } from '../features/map/hooks/useMapData';
import { colors } from '../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../shared/theme/spacing';
import { typography } from '../shared/theme/typography';
import type { Event } from '../shared/types';
import {
  campusCards,
  clubCategories,
  clubs,
  exploreHighlights,
  feedPosts,
  profile,
  profileCollections,
  quickLinks,
  trendingTopics,
} from './content';

type RootTabParamList = {
  Explore: undefined;
  Feed: undefined;
  Clubs: undefined;
  Campus: undefined;
  Profile: undefined;
};

type MapSheetState =
  | { type: 'event'; event: Event }
  | { type: 'building'; building: Building }
  | null;

const Tab = createBottomTabNavigator<RootTabParamList>();

const showComingSoon = (label: string) => {
  Alert.alert(label, 'This interaction is ready to connect to live campus data next.');
};

function ScreenShell({
  title,
  subtitle,
  children,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ResponsiveContainer maxWidth={1280}>
        <View style={styles.screenHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.screenTitle}>{title}</Text>
            {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
          </View>
          {rightAction}
        </View>
        {children}
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

function SectionHeader({ title, actionLabel }: { title: string; actionLabel?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={() => showComingSoon(actionLabel)}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [showEvents, setShowEvents] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [sheetState, setSheetState] = useState<MapSheetState>(null);

  const { events } = useMapData({ timeFilter, searchQuery });

  const filteredBuildings = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) {
      return buildings;
    }

    return buildings.filter(
      (building) =>
        building.name.toLowerCase().includes(needle) ||
        building.code.toLowerCase().includes(needle) ||
        building.description.toLowerCase().includes(needle),
    );
  }, [searchQuery]);

  const activeEvent = sheetState?.type === 'event' ? sheetState.event : null;
  const activeBuilding = sheetState?.type === 'building' ? sheetState.building : null;

  return (
    <ScreenShell
      title="Explore"
      subtitle="Campus map, events, and building search."
      rightAction={
        <Pressable onPress={() => showComingSoon('Notifications')} style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
        </Pressable>
      }
    >
      <View style={styles.exploreScreen}>
        <View style={styles.exploreSearchWrap}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search buildings, events, or points of interest..."
            placeholderTextColor={colors.text.tertiary}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.exploreToolbar}
        >
          {(['happening_now', 'today', 'this_week'] as TimeFilter[]).map((option) => {
            const selected = option === timeFilter;
            const label =
              option === 'happening_now'
                ? 'Now'
                : option === 'today'
                  ? 'Today'
                  : 'This Week';

            return (
              <Pressable
                key={option}
                onPress={() => setTimeFilter(option)}
                style={[styles.mapChip, selected && styles.mapChipActive]}
              >
                <Text style={[styles.mapChipText, selected && styles.mapChipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => setShowEvents((value) => !value)}
            style={[styles.mapChip, showEvents && styles.mapChipActive]}
          >
            <Text style={[styles.mapChipText, showEvents && styles.mapChipTextActive]}>
              Events
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowBuildings((value) => !value)}
            style={[styles.mapChip, showBuildings && styles.mapChipActive]}
          >
            <Text style={[styles.mapChipText, showBuildings && styles.mapChipTextActive]}>
              Buildings
            </Text>
          </Pressable>
        </ScrollView>

        <View style={styles.mapCard}>
          <CampusMap
            style={styles.map}
            events={events}
            buildings={filteredBuildings}
            showEvents={showEvents}
            showBuildings={showBuildings}
            onSelectEvent={(event) => setSheetState({ type: 'event', event })}
            onSelectBuilding={(building) => setSheetState({ type: 'building', building })}
          />

          <View style={styles.mapOverlay}>
            <View style={styles.mapStatCard}>
              <Text style={styles.mapStatValue}>{events.length}</Text>
              <Text style={styles.mapStatLabel}>Event pins</Text>
            </View>
            <View style={styles.mapStatCard}>
              <Text style={styles.mapStatValue}>{filteredBuildings.length}</Text>
              <Text style={styles.mapStatLabel}>Buildings</Text>
            </View>
          </View>
        </View>

        <SectionHeader title="Map Insights" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.exploreInsightsRow}
        >
          {exploreHighlights.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => showComingSoon(item.title)}
              style={styles.exploreInsightCard}
            >
              <View style={[styles.highlightIconWrap, { backgroundColor: item.tint }]}>
                <MaterialCommunityIcons name={item.icon as never} size={22} color={item.color} />
              </View>
              <Text style={styles.highlightTitle}>{item.title}</Text>
              <Text style={styles.highlightMeta}>{item.value}</Text>
              <Text style={styles.highlightDescription}>{item.description}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.topicRow}>
          {trendingTopics.map((topic) => (
            <View key={topic} style={styles.topicChip}>
              <Text style={styles.topicText}>#{topic}</Text>
            </View>
          ))}
        </View>

        <BottomSheet visible={Boolean(sheetState)} onClose={() => setSheetState(null)}>
          {activeEvent ? (
            <View style={styles.sheetContent}>
              <Badge label={activeEvent.category} color={colors.primary.main} />
              <Text style={styles.sheetTitle}>{activeEvent.title}</Text>
              <Text style={styles.sheetMeta}>
                {format(new Date(activeEvent.starts_at), 'EEE, MMM d h:mm a')}
              </Text>
              <Text style={styles.sheetMeta}>{activeEvent.location_name}</Text>
              <Text style={styles.sheetDescription}>{activeEvent.description}</Text>
              <View style={styles.sheetActions}>
                <Button title="RSVP" onPress={() => showComingSoon('RSVP')} />
                <Button
                  title="Open Detail"
                  onPress={() => showComingSoon(activeEvent.title)}
                  variant="secondary"
                />
              </View>
            </View>
          ) : null}

          {activeBuilding ? (
            <View style={styles.sheetContent}>
              <Badge label={activeBuilding.code} color={colors.gray[700]} />
              <Text style={styles.sheetTitle}>{activeBuilding.name}</Text>
              <Text style={styles.sheetMeta}>{activeBuilding.building_type}</Text>
              <Text style={styles.sheetDescription}>{activeBuilding.description}</Text>
              <View style={styles.sheetActions}>
                <Button
                  title="Get Directions"
                  onPress={() => showComingSoon(activeBuilding.name)}
                />
              </View>
            </View>
          ) : null}
        </BottomSheet>
      </View>
    </ScreenShell>
  );
}

function FeedScreen() {
  const [selectedTab, setSelectedTab] = useState<'For You' | 'Following' | 'Trending'>('For You');

  return (
    <ScreenShell title="Feed">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.segmented}>
          {(['For You', 'Following', 'Trending'] as const).map((option) => {
            const selected = option === selectedTab;
            return (
              <Pressable
                key={option}
                onPress={() => setSelectedTab(option)}
                style={[styles.segmentButton, selected && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {feedPosts.map((post) => (
          <View key={post.id} style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <Avatar uri={post.avatar} name={post.author} size="md" />
              <View style={styles.feedHeaderCopy}>
                <Text style={styles.feedAuthor}>{post.author}</Text>
                <Text style={styles.feedHandle}>@{post.handle} | {post.timestamp}</Text>
              </View>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.text.tertiary} />
            </View>
            <Text style={styles.feedContent}>{post.content}</Text>
            {post.image ? <Image source={{ uri: post.image }} style={styles.feedImage} /> : null}
            <View style={styles.feedActions}>
              <Text style={styles.feedAction}>Like {post.likes}</Text>
              <Text style={styles.feedAction}>Comment {post.comments}</Text>
              <Text style={styles.feedAction}>Share</Text>
              <Text style={styles.feedAction}>Save</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => showComingSoon('Create Post')}>
        <Ionicons name="add" size={28} color={colors.brand.white} />
      </Pressable>
    </ScreenShell>
  );
}

function ClubsScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      const matchesCategory = category === 'All' || club.category === category;
      const needle = query.trim().toLowerCase();
      const matchesQuery =
        needle.length === 0 ||
        club.name.toLowerCase().includes(needle) ||
        club.description.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <ScreenShell title="Clubs & Orgs">
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.text.tertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search clubs..."
          placeholderTextColor={colors.text.tertiary}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredClubs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryStrip}
            >
              {clubCategories.map((item) => {
                const selected = item === category;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <SectionHeader title="Top Clubs" actionLabel="Most Members" />
          </>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.clubCard} onPress={() => showComingSoon(item.name)}>
            <Image source={{ uri: item.image }} style={styles.clubImage} />
            <View style={styles.clubBody}>
              <Text style={styles.clubName}>{item.name}</Text>
              <View style={styles.clubMetaRow}>
                <Badge label={item.category} color={item.color} />
                <Text style={styles.clubMembers}>{item.members} members</Text>
              </View>
              <Text style={styles.clubDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </Pressable>
        )}
      />
    </ScreenShell>
  );
}

function CampusScreen() {
  return (
    <ScreenShell title="Campus" subtitle="Everything you need, right here.">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.campusGrid}>
          {campusCards.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => showComingSoon(item.title)}
              style={[styles.campusCard, { borderLeftColor: item.color }]}
            >
              <View style={[styles.campusIconBubble, { backgroundColor: item.tint }]}>
                <MaterialCommunityIcons name={item.icon as never} size={22} color={item.color} />
              </View>
              <Text style={styles.campusCardTitle}>{item.title}</Text>
              <Text style={styles.campusCardSubtitle}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="UMD Quick Links" />
        <View style={styles.quickLinksRow}>
          {quickLinks.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => showComingSoon(item.title)}
              style={styles.quickLinkCard}
            >
              <View style={styles.quickLinkIcon}>
                <MaterialCommunityIcons
                  name={item.icon as never}
                  size={24}
                  color={colors.primary.main}
                />
              </View>
              <Text style={styles.quickLinkText}>{item.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

function ProfileScreen() {
  return (
    <ScreenShell
      title="Profile"
      rightAction={
        <Pressable onPress={() => showComingSoon('Settings')} style={styles.iconButton}>
          <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Avatar uri={profile.avatar} name={profile.name} size="xl" />
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileHandle}>@{profile.handle}</Text>
          <Text style={styles.profileMeta}>
            {profile.major} | Class of {profile.classYear}
          </Text>
          <Text style={styles.profileBio}>{profile.bio}</Text>

          <View style={styles.profileStats}>
            {profile.stats.map((stat, index) => (
              <View
                key={stat.label}
                style={[
                  styles.profileStatItem,
                  index === profile.stats.length - 1 && styles.profileStatLastItem,
                ]}
              >
                <Text style={styles.profileStatValue}>{stat.value}</Text>
                <Text style={styles.profileStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Button
            title="Edit Profile"
            onPress={() => showComingSoon('Edit Profile')}
            variant="secondary"
            fullWidth
          />
        </View>

        <SectionHeader title="My Clubs" actionLabel="See all" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.profileClubRow}>
            {profile.clubs.map((club) => (
              <Image key={club} source={{ uri: club }} style={styles.profileClubImage} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.collectionList}>
          {profileCollections.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => showComingSoon(item.title)}
              style={styles.collectionCard}
            >
              <View style={[styles.collectionIcon, { backgroundColor: item.tint }]}>
                <MaterialCommunityIcons name={item.icon as never} size={22} color={item.color} />
              </View>
              <View style={styles.collectionCopy}>
                <Text style={styles.collectionTitle}>{item.title}</Text>
                <Text style={styles.collectionMeta}>{item.meta}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

export default function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === 'Explore'
              ? focused
                ? 'compass'
                : 'compass-outline'
              : route.name === 'Feed'
                ? focused
                  ? 'grid'
                  : 'grid-outline'
                : route.name === 'Clubs'
                  ? focused
                    ? 'people'
                    : 'people-outline'
                  : route.name === 'Campus'
                    ? focused
                      ? 'business'
                      : 'business-outline'
                    : focused
                      ? 'person'
                      : 'person-outline';

          return <Ionicons name={iconName} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Clubs" component={ClubsScreen} />
      <Tab.Screen name="Campus" component={CampusScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.brand.white,
  },
  headerCopy: {
    flex: 1,
  },
  screenTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginTop: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + spacing.lg,
    gap: spacing.md,
  },
  exploreScreen: {
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  exploreSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  exploreToolbar: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  mapChip: {
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  mapChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  mapChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  mapChipTextActive: {
    color: colors.brand.white,
  },
  mapCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.brand.white,
    ...shadows.lg,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mapStatCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapStatValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  mapStatLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  exploreInsightsRow: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  exploreInsightCard: {
    width: 210,
    marginRight: spacing.md,
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionAction: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  highlightIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  highlightTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  highlightMeta: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginTop: spacing.xs,
  },
  highlightDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  topicChip: {
    backgroundColor: colors.primary.lightest,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topicText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.dark,
  },
  sheetContent: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sheetMeta: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  sheetDescription: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  sheetActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.brand.white,
  },
  segmentLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  segmentLabelActive: {
    color: colors.text.primary,
  },
  feedCard: {
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  feedHeaderCopy: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  feedAuthor: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  feedHandle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  feedContent: {
    fontSize: typography.fontSize.xl,
    lineHeight: 32,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  feedImage: {
    width: '100%',
    height: 240,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedAction: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xxl + spacing.md,
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl + spacing.md,
  },
  categoryStrip: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  categoryChip: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.main,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.brand.white,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  clubImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
  },
  clubBody: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  clubName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  clubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  clubMembers: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  clubDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  campusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  campusCard: {
    width: '47%',
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    ...shadows.md,
  },
  campusIconBubble: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  campusCardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  campusCardSubtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  quickLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickLinkCard: {
    width: '22%',
    alignItems: 'center',
  },
  quickLinkIcon: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.white,
    ...shadows.md,
  },
  quickLinkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  profileCard: {
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  profileName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  profileHandle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  profileMeta: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
    marginTop: spacing.sm,
  },
  profileBio: {
    fontSize: typography.fontSize.lg,
    lineHeight: 30,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  profileStats: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
  },
  profileStatLastItem: {
    borderRightWidth: 0,
  },
  profileStatValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  profileStatLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  profileClubRow: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
  },
  profileClubImage: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  collectionList: {
    gap: spacing.md,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  collectionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  collectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  collectionMeta: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  tabBar: {
    height: 72,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.brand.white,
    borderTopColor: colors.border.light,
  },
  tabBarLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
});
