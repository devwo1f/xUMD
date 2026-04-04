import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../../../shared/components/Avatar';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import FeedTabs from '../components/FeedTabs';
import { useFeed } from '../hooks/useFeed';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { FeedStackParamList } from '../../../navigation/types';
import FollowButton from '../../social/components/FollowButton';
import { useSocialGraph } from '../../social/hooks/useSocialGraph';
import PostMediaGallery from '../components/PostMediaGallery';

type Props = NativeStackScreenProps<FeedStackParamList, 'FeedHome'>;

export default function FeedHomeScreen({ navigation }: Props) {
  const { posts, activeTab, setActiveTab, toggleLike } = useFeed();
  const { recommendations, isFollowingUser, toggleFollow } = useSocialGraph();
  const topSuggestions = recommendations.slice(0, 4);

  return (
    <ScreenLayout
      title="Feed"
      subtitle="What Terps are talking about right now."
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="chatbubbles-outline"
          label="Terp Conversations"
          color={colors.status.info}
          tintColor={colors.status.infoLight}
        />
      }
      headerStyle={styles.headerShell}
    >
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {topSuggestions.length > 0 ? (
        <Card style={styles.suggestionsCard}>
          <View style={styles.suggestionsHeader}>
            <View>
              <Text style={styles.suggestionsTitle}>People you may know</Text>
              <Text style={styles.suggestionsBody}>Built from mutuals, clubs, and who is shaping campus talk.</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
            {topSuggestions.map((entry) => (
              <View key={entry.profile.id} style={styles.suggestionPill}>
                <Avatar
                  uri={entry.profile.avatarUrl}
                  name={entry.profile.displayName}
                  size="md"
                />
                <View style={styles.suggestionCopy}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {entry.profile.displayName}
                  </Text>
                  <Text style={styles.suggestionReason} numberOfLines={2}>
                    {entry.reason.headline}
                  </Text>
                </View>
                <FollowButton
                  compact
                  isFollowing={isFollowingUser(entry.profile.id)}
                  onPress={() => toggleFollow(entry.profile.id)}
                />
              </View>
            ))}
          </ScrollView>
        </Card>
      ) : null}

      {activeTab === 'Following' && posts.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>Your Following feed is waiting on a few more people.</Text>
          <Text style={styles.emptyBody}>
            Follow clubs, creators, and campus accounts to turn this lane into your daily UMD timeline.
          </Text>
        </Card>
      ) : null}

      {posts.map((post) => {
        const timestamp = (() => {
          try {
            return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
          } catch {
            return post.created_at;
          }
        })();

        return (
          <Card key={post.id}>
            <View style={styles.postHeader}>
              <Avatar uri={post.author?.avatar_url} name={post.author?.display_name} size="md" />
              <View style={styles.postHeaderCopy}>
                <Text style={styles.authorName}>{post.author?.display_name ?? 'Unknown'}</Text>
                <Text style={styles.authorMeta}>{timestamp}</Text>
              </View>
              {post.author_id !== 'usr-current' ? (
                <FollowButton
                  compact
                  isFollowing={isFollowingUser(post.author_id)}
                  onPress={() => toggleFollow(post.author_id)}
                />
              ) : (
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.text.tertiary} />
              )}
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            <PostMediaGallery post={post} mode="feed" />

            <View style={styles.actionRow}>
              <Pressable style={styles.actionButton} onPress={() => toggleLike(post.id)}>
                <Ionicons
                  name={post.is_liked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={post.is_liked ? colors.primary.main : colors.text.secondary}
                />
                <Text style={[styles.actionText, post.is_liked && styles.actionTextActive]}>
                  {post.like_count}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionButton}
                onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
              >
                <Ionicons name="chatbubble-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.actionText}>{post.comment_count}</Text>
              </Pressable>

              <View style={styles.actionButton}>
                <Ionicons name="share-social-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.actionText}>Share</Text>
              </View>
            </View>
          </Card>
        );
      })}
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
    borderColor: colors.status.infoLight,
    backgroundColor: '#FCFEFF',
  },
  suggestionsCard: {
    gap: spacing.md,
  },
  suggestionsHeader: {
    gap: spacing.xs,
  },
  suggestionsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  suggestionsBody: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  suggestionsRow: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  suggestionPill: {
    width: 230,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm + 2,
    gap: spacing.sm,
  },
  suggestionCopy: {
    gap: spacing.xs,
  },
  suggestionName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  suggestionReason: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderCopy: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  authorMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  postContent: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  actionTextActive: {
    color: colors.primary.main,
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
