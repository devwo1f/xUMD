import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Avatar from '../../../shared/components/Avatar';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { ProfileStackParamList } from '../../../navigation/types';
import FollowButton from '../../social/components/FollowButton';
import { useSocialGraph } from '../../social/hooks/useSocialGraph';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Connections'>;

type ConnectionMode = ProfileStackParamList['Connections']['mode'];

const copyByMode: Record<
  ConnectionMode,
  {
    title: string;
    subtitle: string;
    tag: string;
    tagColor: string;
    tagTint: string;
  }
> = {
  followers: {
    title: 'Followers',
    subtitle: 'People keeping up with your UMD updates.',
    tag: 'Your Audience',
    tagColor: colors.status.info,
    tagTint: colors.status.infoLight,
  },
  following: {
    title: 'Following',
    subtitle: 'The Terps and campus voices shaping your feed.',
    tag: 'Your Circle',
    tagColor: colors.primary.main,
    tagTint: colors.primary.lightest,
  },
  mutuals: {
    title: 'Mutuals',
    subtitle: 'People already connected from both sides of your network.',
    tag: 'Shared Orbit',
    tagColor: colors.status.success,
    tagTint: colors.status.successLight,
  },
  discover: {
    title: 'People You May Know',
    subtitle: 'Strong fits based on mutuals, clubs, and campus interests.',
    tag: 'Recommended',
    tagColor: colors.secondary.dark,
    tagTint: colors.secondary.lightest,
  },
};

export default function ConnectionsScreen({ navigation, route }: Props) {
  const { mode } = route.params;
  const {
    followers,
    following,
    mutualConnections,
    recommendations,
    isFollowingUser,
    toggleFollow,
    getMutualCount,
  } = useSocialGraph();

  const copy = copyByMode[mode];

  const rows =
    mode === 'followers'
      ? followers.map((profile) => ({
          key: profile.id,
          profile,
          badge: getMutualCount(profile.id) > 0 ? `${getMutualCount(profile.id)} mutual` : null,
          supporting: profile.bio,
        }))
      : mode === 'following'
        ? following.map((profile) => ({
            key: profile.id,
            profile,
            badge: profile.major ?? null,
            supporting: profile.bio,
          }))
        : mode === 'mutuals'
          ? mutualConnections.map((profile) => ({
              key: profile.id,
              profile,
              badge: 'Mutual connection',
              supporting: profile.bio,
            }))
          : recommendations.map((entry) => ({
              key: entry.profile.id,
              profile: entry.profile,
              badge: entry.reason.headline,
              supporting: entry.profile.bio,
            }));

  return (
    <ScreenLayout
      title={copy.title}
      subtitle={copy.subtitle}
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="people-outline"
          label={copy.tag}
          color={copy.tagColor}
          tintColor={copy.tagTint}
        />
      }
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
      headerStyle={styles.headerShell}
    >
      {rows.length > 0 ? (
        rows.map(({ key, profile, badge, supporting }) => (
          <Card key={key} style={styles.personCard}>
            <View style={styles.personRow}>
              <Avatar uri={profile.avatarUrl} name={profile.displayName} size="md" />
              <View style={styles.personCopy}>
                <Text style={styles.personName}>{profile.displayName}</Text>
                <Text style={styles.personHandle}>@{profile.username}</Text>
                <Text style={styles.personBio} numberOfLines={2}>
                  {supporting}
                </Text>
                {badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
              </View>
              <FollowButton
                compact
                isFollowing={isFollowingUser(profile.id)}
                onPress={() => toggleFollow(profile.id)}
              />
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.emptyTitle}>Your network is still taking shape.</Text>
          <Text style={styles.emptyBody}>
            Follow a few more Terps and your recommendations, mutuals, and following lane will start to feel much
            smarter.
          </Text>
        </Card>
      )}
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  personCard: {
    padding: spacing.md,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  personCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  personName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  personHandle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  personBio: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyBody: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});
