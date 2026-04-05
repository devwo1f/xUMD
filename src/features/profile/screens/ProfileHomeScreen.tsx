import React, { useEffect, useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Avatar from '../../../shared/components/Avatar';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { mockClubs } from '../../../assets/data/mockClubs';
import { useProfile } from '../hooks/useProfile';
import StatItem from '../components/StatItem';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { useFeedStore } from '../../feed/hooks/useFeed';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { ProfileStackParamList } from '../../../navigation/types';
import { isSupabaseConfigured } from '../../../services/supabase';
import { fetchRemotePostsByUser } from '../../../services/social';
import FollowButton from '../../social/components/FollowButton';
import { useCampusSocialGraph } from '../../social/hooks/useCampusSocialGraph';
import { useAuth } from '../../auth/hooks/useAuth';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export default function ProfileHomeScreen({ navigation }: Props) {
  const { user } = useProfile();
  const { signOut, loading: authLoading } = useAuth();
  const { joinedClubIds, savedEventIds } = useDemoAppStore();
  const posts = useFeedStore((state) => state.posts);
  const { isWide } = useResponsive();
  const {
    viewerUserId,
    followers,
    following,
    recommendations,
    isFollowingUser,
    toggleFollow,
    loading: loadingSocialGraph,
  } = useCampusSocialGraph();

  const myPosts = useMemo(
    () => posts.filter((post) => post.author_id === viewerUserId),
    [posts, viewerUserId],
  );

  useEffect(() => {
    let isActive = true;

    if (!isSupabaseConfigured || !viewerUserId || viewerUserId === 'usr-current') {
      return () => {
        isActive = false;
      };
    }

    const loadRemotePosts = async () => {
      try {
        const remotePosts = await fetchRemotePostsByUser(viewerUserId, 12);
        if (isActive && remotePosts.length > 0) {
          useFeedStore.getState().hydratePosts(remotePosts);
        }
      } catch (error) {
        console.warn('Unable to sync profile posts.', error);
      }
    };

    void loadRemotePosts();

    return () => {
      isActive = false;
    };
  }, [viewerUserId]);

  const joinedClubs = useMemo(
    () => mockClubs.filter((club) => joinedClubIds.includes(club.id)).slice(0, 4),
    [joinedClubIds],
  );

  const collections = [
    {
      title: 'Saved Events',
      subtitle: `${savedEventIds.length} saved`,
      icon: 'bookmark-outline' as const,
      route: 'SavedEvents' as const,
      tint: colors.primary.lightest,
      color: colors.primary.main,
    },
    {
      title: 'My Posts',
      subtitle: `${myPosts.length} published`,
      icon: 'document-text-outline' as const,
      route: 'MyPosts' as const,
      tint: colors.status.infoLight,
      color: colors.status.info,
    },
  ];

  const stats = [
    {
      label: 'Posts',
      value: myPosts.length,
      onPress: () => navigation.navigate('MyPosts'),
    },
    {
      label: 'Followers',
      value: followers.length,
      onPress: () => navigation.navigate('Connections', { mode: 'followers' }),
    },
    {
      label: 'Following',
      value: following.length,
      onPress: () => navigation.navigate('Connections', { mode: 'following' }),
    },
  ];

  const suggestedPeople = recommendations.slice(0, 3);
  const openUserProfile = (userId: string) => navigation.navigate('UserProfile', { userId });

  const openClubsTab = () => {
    navigation.getParent()?.navigate('Clubs' as never);
  };

  const clubCards = joinedClubs.map((club) => (
    <Pressable
      key={club.id}
      onPress={() => navigation.navigate('ClubDetail', { clubId: club.id })}
      style={[styles.clubPreview, isWide && styles.clubPreviewWide]}
    >
      {club.logo_url ? (
        <Image source={{ uri: club.logo_url }} style={styles.clubPreviewImage} />
      ) : (
        <View style={[styles.clubPreviewImage, styles.clubPreviewFallback]}>
          <Text style={styles.clubPreviewFallbackText}>{club.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.clubPreviewLabel} numberOfLines={1}>{club.name}</Text>
      <View style={styles.clubPreviewMetaPill}>
        <Text style={styles.clubPreviewMeta} numberOfLines={1}>{club.category}</Text>
      </View>
    </Pressable>
  ));

  return (
    <ScreenLayout
      title="Profile"
      subtitle={loadingSocialGraph ? 'Syncing your campus network...' : 'Your xUMD identity and shortcuts.'}
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="person-circle-outline"
          label="Personal Hub"
          color={colors.text.primary}
          tintColor={colors.background.secondary}
        />
      }
      headerStyle={styles.headerShell}
      contentContainerStyle={styles.screenContent}
      rightAction={
        <Pressable onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
          <Ionicons name="settings-outline" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      <Card style={[styles.profileCard, isWide && styles.profileCardWide]}>
        <View style={[styles.profileTop, isWide && styles.profileTopWide]}>
          <View style={[styles.profileIdentity, isWide && styles.profileIdentityWide]}>
            <View style={styles.profileAvatarWrap}>
              <Avatar uri={user.avatar} name={user.displayName} size="xl" />
            </View>
            <View style={[styles.profileCopy, isWide && styles.profileCopyWide]}>
              <View style={styles.identityBadge}>
                <Text style={styles.identityBadgeText}>
                  {user.major || 'UMD Student'} | Class of {user.classYear}
                </Text>
              </View>
              <Text style={styles.profileName}>{user.displayName}</Text>
              <Text style={styles.profileHandle}>@{user.username.replace(/^@/, '')}</Text>
              <Text style={[styles.profileBio, isWide && styles.profileBioWide]}>{user.bio}</Text>
            </View>
          </View>
          <Button
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            variant="secondary"
            fullWidth={!isWide}
            style={isWide ? styles.editButtonDesktop : styles.editButtonMobile}
          />
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <React.Fragment key={stat.label}>
              <StatItem count={stat.value} label={stat.label} onPress={stat.onPress} />
              {index < stats.length - 1 ? <View style={styles.statDivider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </Card>

      <Card style={styles.sectionSurface}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Clubs</Text>
          <Pressable onPress={openClubsTab}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>
        {joinedClubs.length > 0 ? (
          isWide ? (
            <View style={styles.clubGrid}>{clubCards}</View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clubRow}>
              {clubCards}
            </ScrollView>
          )
        ) : (
          <Pressable onPress={openClubsTab} style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Join a club to pin it here</Text>
            <Text style={styles.emptyBody}>
              Browse organizations and your favorites will show up as quick shortcuts.
            </Text>
          </Pressable>
        )}
      </Card>

      {suggestedPeople.length > 0 ? (
        <Card style={styles.sectionSurface}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>People You May Know</Text>
            <Pressable onPress={() => navigation.navigate('Connections', { mode: 'discover' })}>
              <Text style={styles.sectionAction}>See all</Text>
            </Pressable>
          </View>
          <View style={[styles.recommendationList, isWide && styles.recommendationListWide]}>
            {suggestedPeople.map((entry) => (
              <View key={entry.profile.id} style={[styles.recommendationCard, isWide && styles.recommendationCardWide]}>
                <Pressable onPress={() => openUserProfile(entry.profile.id)} style={styles.recommendationLink}>
                  <View style={styles.recommendationTop}>
                    <Avatar uri={entry.profile.avatarUrl} name={entry.profile.displayName} size="md" />
                    <View style={styles.recommendationCopy}>
                      <Text style={styles.recommendationName}>{entry.profile.displayName}</Text>
                      <Text style={styles.recommendationHandle}>@{entry.profile.username}</Text>
                    </View>
                  </View>
                  <Text style={styles.recommendationReason}>{entry.reason.headline}</Text>
                  <Text style={styles.recommendationBio} numberOfLines={2}>
                    {entry.profile.bio}
                  </Text>
                </Pressable>
                {entry.profile.id !== viewerUserId ? (
                  <FollowButton
                    isFollowing={isFollowingUser(entry.profile.id)}
                    onPress={() => void toggleFollow(entry.profile.id)}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card style={styles.sectionSurface}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </View>
        <View style={[styles.collectionList, isWide && styles.collectionListWide]}>
          {collections.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => navigation.navigate(item.route)}
              style={[styles.collectionCard, isWide && styles.collectionCardWide]}
            >
              <View style={[styles.collectionIcon, { backgroundColor: item.tint }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.collectionCopy}>
                <Text style={styles.collectionTitle}>{item.title}</Text>
                <Text style={styles.collectionMeta}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.logoutCard}>
        <View style={styles.logoutCopy}>
          <Text style={styles.logoutTitle}>Log out of xUMD</Text>
          <Text style={styles.logoutBody}>
            Sign out of this device and return to the UMD verification flow whenever you are ready.
          </Text>
        </View>
        <Button
          title="Log Out"
          onPress={() => void signOut()}
          loading={authLoading}
          variant="danger"
          fullWidth
        />
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerShell: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
  },
  screenContent: {
    gap: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  profileCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary.lightest,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  profileCardWide: {
    padding: spacing.xl,
  },
  profileTop: {
    width: '100%',
    gap: spacing.lg,
  },
  profileTopWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileIdentity: {
    alignItems: 'center',
    gap: spacing.md,
  },
  profileIdentityWide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarWrap: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
    ...shadows.md,
  },
  profileCopy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileCopyWide: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: spacing.lg,
  },
  identityBadge: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  identityBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  profileName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  profileHandle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  profileBio: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
    textAlign: 'center',
    maxWidth: 560,
  },
  profileBioWide: {
    textAlign: 'left',
  },
  editButtonMobile: {
    marginTop: spacing.xs,
  },
  editButtonDesktop: {
    width: 168,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: spacing.md,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionSurface: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionAction: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  clubRow: {
    width: '100%',
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  clubGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  clubPreview: {
    width: 148,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.xs,
    gap: spacing.sm,
    overflow: 'hidden',
    ...shadows.md,
  },
  clubPreviewWide: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 156,
    maxWidth: 196,
  },
  clubPreviewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
  },
  clubPreviewFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
  },
  clubPreviewFallbackText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  clubPreviewLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    paddingHorizontal: spacing.xs,
  },
  clubPreviewMetaPill: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clubPreviewMeta: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  emptyState: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  recommendationList: {
    width: '100%',
    gap: spacing.md,
  },
  recommendationListWide: {
    flexDirection: 'row',
  },
  recommendationCard: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    gap: spacing.sm,
  },
  recommendationCardWide: {
    flex: 1,
  },
  recommendationLink: {
    gap: spacing.sm,
  },
  recommendationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recommendationCopy: {
    flex: 1,
    gap: 2,
  },
  recommendationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  recommendationHandle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  recommendationReason: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  recommendationBio: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  collectionList: {
    width: '100%',
    gap: spacing.md,
  },
  collectionListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    minHeight: 92,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.md,
  },
  collectionCardWide: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 280,
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
    minWidth: 0,
  },
  collectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  collectionMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  logoutCard: {
    width: '100%',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.status.errorLight,
    backgroundColor: colors.brand.white,
  },
  logoutCopy: {
    gap: spacing.xs,
  },
  logoutTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  logoutBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});

