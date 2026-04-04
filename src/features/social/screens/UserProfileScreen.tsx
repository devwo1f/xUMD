import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../../../shared/components/Avatar';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { Post } from '../../../shared/types';
import { isSupabaseConfigured } from '../../../services/supabase';
import {
  fetchCurrentRemoteUserId,
  fetchRemotePostsByUser,
  fetchRemoteProfileById,
  type RemoteSocialProfile,
} from '../../../services/social';
import PostMediaGallery from '../../feed/components/PostMediaGallery';
import { useFeedStore } from '../../feed/hooks/useFeed';
import {
  clubNameById,
  CURRENT_SOCIAL_USER_ID,
  type SocialProfile,
} from '../data/mockSocialGraph';
import { useCampusSocialGraph } from '../hooks/useCampusSocialGraph';
import { useSocialGraphStore } from '../hooks/useSocialGraph';

type Props = {
  navigation: {
    goBack: () => void;
    navigate: (routeName: 'PostDetail', params: { postId: string }) => void;
  };
  route: {
    params: {
      userId: string;
    };
  };
};

interface CampusProfileView {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string;
  pronouns?: string | null;
  major: string | null;
  classYear: number | null;
  clubLabels: string[];
  followerCount: number;
  followingCount: number;
  isOfficial?: boolean;
}

interface ActivityItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  timestamp: string;
  postId: string;
}

function intersect(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return Array.from(new Set(left.filter((value) => rightSet.has(value))));
}

function getFollowerCount(followingByUser: Record<string, string[]>, userId: string) {
  return Object.values(followingByUser).filter((following) => following.includes(userId)).length;
}

function formatClubLabel(value: string) {
  return clubNameById[value] ?? value;
}

function formatTimestamp(value: string) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return value;
  }
}

function getActivityDescriptor(post: Post) {
  if (post.media_urls.length > 0) {
    const hasVideo = post.media_items?.some((item) => item.type === 'video');
    return {
      icon: hasVideo ? ('videocam-outline' as const) : ('image-outline' as const),
      title: hasVideo ? 'Shared a new video' : 'Shared a new photo set',
    };
  }

  if (post.hashtags && post.hashtags.length > 0) {
    return {
      icon: 'pricetag-outline' as const,
      title: `Talking about #${post.hashtags[0]}`,
    };
  }

  return {
    icon: 'chatbubble-ellipses-outline' as const,
    title: 'Posted a campus update',
  };
}

function buildActivityItems(posts: Post[]): ActivityItem[] {
  return posts.slice(0, 3).map((post) => {
    const descriptor = getActivityDescriptor(post);

    return {
      id: `activity-${post.id}`,
      icon: descriptor.icon,
      title: descriptor.title,
      detail: post.content || 'Shared media with the campus feed.',
      timestamp: formatTimestamp(post.created_at),
      postId: post.id,
    };
  });
}

function toCampusProfileView(input: {
  profile: SocialProfile | RemoteSocialProfile;
  followerCount: number;
  followingCount: number;
}) {
  return {
    id: input.profile.id,
    displayName: input.profile.displayName,
    username: input.profile.username,
    avatarUrl: input.profile.avatarUrl,
    bio: input.profile.bio,
    pronouns: input.profile.pronouns ?? null,
    major: input.profile.major,
    classYear: input.profile.classYear,
    clubLabels: input.profile.clubIds.map(formatClubLabel),
    followerCount: input.followerCount,
    followingCount: input.followingCount,
    isOfficial: 'isOfficial' in input.profile ? input.profile.isOfficial : false,
  } satisfies CampusProfileView;
}

export default function UserProfileScreen({ navigation, route }: Props) {
  const targetUserId = route.params.userId;
  const { isWide } = useResponsive();
  const hydratePosts = useFeedStore((state) => state.hydratePosts);
  const localPosts = useFeedStore((state) => state.posts);
  const localProfiles = useSocialGraphStore((state) => state.profiles);
  const localFollowingByUser = useSocialGraphStore((state) => state.followingByUser);
  const { isFollowingUser, toggleFollow } = useCampusSocialGraph();
  const [viewerRemoteId, setViewerRemoteId] = useState<string | null>(null);
  const [remoteTargetProfile, setRemoteTargetProfile] = useState<RemoteSocialProfile | null>(null);
  const [remoteViewerProfile, setRemoteViewerProfile] = useState<RemoteSocialProfile | null>(null);
  const [remotePosts, setRemotePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(null);
      return () => {
        isActive = false;
      };
    }

    const loadRemoteProfile = async () => {
      setLoading(true);

      try {
        const nextViewerId = await fetchCurrentRemoteUserId();
        const [nextTargetProfile, nextViewerProfile, nextPosts] = await Promise.all([
          fetchRemoteProfileById(targetUserId),
          nextViewerId ? fetchRemoteProfileById(nextViewerId).catch(() => null) : Promise.resolve(null),
          fetchRemotePostsByUser(targetUserId, 18),
        ]);

        if (!isActive) {
          return;
        }

        setViewerRemoteId(nextViewerId);
        setRemoteTargetProfile(nextTargetProfile);
        setRemoteViewerProfile(nextViewerProfile);
        setRemotePosts(nextPosts);
        if (nextPosts.length > 0) {
          hydratePosts(nextPosts);
        }
        setError(null);
      } catch (nextError) {
        if (!isActive) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : 'Unable to open this profile right now.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadRemoteProfile();

    return () => {
      isActive = false;
    };
  }, [hydratePosts, targetUserId]);

  const demoTargetProfile = localProfiles[targetUserId];
  const demoViewerProfile = localProfiles[CURRENT_SOCIAL_USER_ID];

  const profilePosts = useMemo(
    () =>
      (remoteTargetProfile ? remotePosts : localPosts.filter((post) => post.author_id === targetUserId))
        .slice()
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()),
    [localPosts, remotePosts, remoteTargetProfile, targetUserId],
  );

  const profile = useMemo(() => {
    if (remoteTargetProfile) {
      return toCampusProfileView({
        profile: remoteTargetProfile,
        followerCount: remoteTargetProfile.followerCount,
        followingCount: remoteTargetProfile.followingCount,
      });
    }

    if (!demoTargetProfile) {
      return null;
    }

    return toCampusProfileView({
      profile: demoTargetProfile,
      followerCount: getFollowerCount(localFollowingByUser, targetUserId),
      followingCount: (localFollowingByUser[targetUserId] ?? []).length,
    });
  }, [demoTargetProfile, localFollowingByUser, remoteTargetProfile, targetUserId]);

  const commonClubLabels = useMemo(() => {
    if (remoteTargetProfile) {
      const viewerClubIds = remoteViewerProfile?.clubIds ?? [];
      return intersect(viewerClubIds, remoteTargetProfile.clubIds).map(formatClubLabel);
    }

    if (!demoTargetProfile || !demoViewerProfile) {
      return [];
    }

    return intersect(demoViewerProfile.clubIds, demoTargetProfile.clubIds).map(formatClubLabel);
  }, [demoTargetProfile, demoViewerProfile, remoteTargetProfile, remoteViewerProfile]);

  const recentActivity = useMemo(() => buildActivityItems(profilePosts), [profilePosts]);

  const isOwnProfile = remoteTargetProfile
    ? viewerRemoteId === targetUserId
    : targetUserId === CURRENT_SOCIAL_USER_ID;

  if (!profile && !loading) {
    return (
      <ScreenLayout
        title="Profile"
        subtitle="We could not find that Terp."
        headerTopContent={<UMDBrandLockup />}
        leftAction={
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        }
      >
        <Card>
          <Text style={styles.emptyTitle}>This profile is not available.</Text>
          <Text style={styles.emptyBody}>Try heading back and opening someone else from the feed or your network list.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={profile?.displayName ?? 'Profile'}
      subtitle={profile?.isOfficial ? 'Official campus presence' : 'Public xUMD profile'}
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon={profile?.isOfficial ? 'megaphone-outline' : 'person-outline'}
          label={profile?.isOfficial ? 'Official Account' : 'Campus Profile'}
          color={profile?.isOfficial ? colors.secondary.dark : colors.status.info}
          tintColor={profile?.isOfficial ? colors.secondary.lightest : colors.status.infoLight}
        />
      }
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
      headerStyle={styles.headerShell}
      contentContainerStyle={styles.screenContent}
    >
      <Card style={[styles.heroCard, isWide && styles.heroCardWide]}>
        <View style={[styles.heroTop, isWide && styles.heroTopWide]}>
          <View style={styles.identityRow}>
            <View style={styles.avatarRing}>
              <Avatar uri={profile?.avatarUrl} name={profile?.displayName} size="xl" />
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.name}>{profile?.displayName}</Text>
              <Text style={styles.handle}>@{profile?.username}</Text>
              <View style={styles.metaPills}>
                {profile?.pronouns ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>{profile.pronouns}</Text>
                  </View>
                ) : null}
                {profile?.major ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>
                      {profile.major}
                      {profile.classYear ? ` | ${profile.classYear}` : ''}
                    </Text>
                  </View>
                ) : profile?.classYear ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>Class of {profile.classYear}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          {!isOwnProfile ? (
            <Button
              title={isFollowingUser(targetUserId) ? 'Following' : 'Follow'}
              onPress={() => void toggleFollow(targetUserId)}
              variant={isFollowingUser(targetUserId) ? 'secondary' : 'primary'}
              style={isWide ? styles.followButtonWide : undefined}
            />
          ) : null}
        </View>

        <Text style={styles.bio}>{profile?.bio}</Text>

        <View style={styles.statRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{profilePosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{profile?.followerCount ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{profile?.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </Card>

      {error ? (
        <Card>
          <Text style={styles.errorTitle}>Profile sync paused</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </Card>
      ) : null}

      {commonClubLabels.length > 0 ? (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Common Clubs</Text>
          <View style={styles.pillRow}>
            {commonClubLabels.map((clubLabel) => (
              <View key={clubLabel} style={styles.commonPill}>
                <Text style={styles.commonPillText}>{clubLabel}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {loading ? (
          <Text style={styles.sectionEmpty}>Loading recent activity...</Text>
        ) : recentActivity.length > 0 ? (
          <View style={styles.activityList}>
            {recentActivity.map((item) => (
              <Pressable key={item.id} onPress={() => navigation.navigate('PostDetail', { postId: item.postId })} style={styles.activityRow}>
                <View style={styles.activityIconWrap}>
                  <Ionicons name={item.icon} size={18} color={colors.primary.main} />
                </View>
                <View style={styles.activityCopy}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityTime}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.activityDetail} numberOfLines={2}>{item.detail}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.sectionEmpty}>No recent activity to show yet.</Text>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Posts</Text>
          <Text style={styles.sectionMeta}>{profilePosts.length} total</Text>
        </View>
        {loading ? (
          <Text style={styles.sectionEmpty}>Loading posts...</Text>
        ) : profilePosts.length > 0 ? (
          <View style={styles.postsList}>
            {profilePosts.map((post) => (
              <Card key={post.id} onPress={() => navigation.navigate('PostDetail', { postId: post.id })} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Text style={styles.postTimestamp}>{formatTimestamp(post.created_at)}</Text>
                  {post.hashtags && post.hashtags.length > 0 ? (
                    <View style={styles.postTag}>
                      <Text style={styles.postTagText}>#{post.hashtags[0]}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                <PostMediaGallery post={post} mode="detail" />
                <View style={styles.postMetaRow}>
                  <Text style={styles.postMetaText}>{post.like_count} likes</Text>
                  <Text style={styles.postMetaText}>{post.comment_count} comments</Text>
                  {typeof post.share_count === 'number' ? (
                    <Text style={styles.postMetaText}>{post.share_count} shares</Text>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Text style={styles.sectionEmpty}>This profile has not posted to the campus feed yet.</Text>
        )}
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  heroCard: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  heroCardWide: {
    padding: spacing.xl,
  },
  heroTop: {
    gap: spacing.md,
  },
  heroTopWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatarRing: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.primary.lightest,
  },
  identityCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  handle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  metaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaPill: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  metaPillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  followButtonWide: {
    width: 156,
  },
  bio: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  sectionCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  commonPill: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commonPillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  activityList: {
    gap: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
  },
  activityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  activityTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  activityTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  activityDetail: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  postsList: {
    gap: spacing.md,
  },
  postCard: {
    gap: spacing.md,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  postTimestamp: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  postTag: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  postTagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  postContent: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  postMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  postMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  sectionEmpty: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  errorTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  errorBody: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyBody: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});
