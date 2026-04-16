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
import { useCampusFeed } from '../hooks/useCampusFeed';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { FeedStackParamList } from '../../../navigation/types';
import FollowButton from '../../social/components/FollowButton';
import { useCampusSocialGraph } from '../../social/hooks/useCampusSocialGraph';
import PostMediaGallery from '../components/PostMediaGallery';

type Props = NativeStackScreenProps<FeedStackParamList, 'FeedHome'>;

export default function FeedHomeScreen({ navigation }: Props) {
  const {
    posts,
    activeTab,
    setActiveTab,
    toggleLike,
    loading,
    error,
    hashtags,
    hasMore,
    loadMore,
  } = useCampusFeed();
  const { recommendations, viewerUserId, isFollowingUser, toggleFollow } = useCampusSocialGraph();
  const topSuggestions = recommendations.slice(0, 4);
  const openUserProfile = (userId: string) => navigation.navigate('UserProfile', { userId });
  const openEventDetail = (eventId: string) => navigation.navigate('EventDetail', { eventId });

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

      {hashtags.length > 0 ? (
        <Card style={styles.trendingCard}>
          <Text style={styles.trendingTitle}>Trending hashtags</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingRow}>
            {hashtags.map((tag) => (
              <View key={tag.tag} style={styles.hashtagChip}>
                <Text style={styles.hashtagLabel}>#{tag.tag}</Text>
              </View>
            ))}
          </ScrollView>
        </Card>
      ) : null}

      {topSuggestions.length > 0 ? (
        <Card style={styles.suggestionsCard}>
          <View style={styles.suggestionsHeader}>
            <View>
              <Text style={styles.suggestionsTitle}>People you may know</Text>
              <Text style={styles.suggestionsBody}>Built from mutuals, shared context, and campus conversation overlap.</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
            {topSuggestions.map((entry) => (
              <View key={entry.profile.id} style={styles.suggestionPill}>
                <Pressable onPress={() => openUserProfile(entry.profile.id)} style={styles.suggestionIdentity}>
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
                </Pressable>
                {entry.profile.id !== viewerUserId ? (
                  <FollowButton
                    compact
                    isFollowing={isFollowingUser(entry.profile.id)}
                    onPress={() => void toggleFollow(entry.profile.id)}
                  />
                ) : null}
              </View>
            ))}
          </ScrollView>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <Text style={styles.errorTitle}>Feed is having a moment.</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </Card>
      ) : null}

      {loading && posts.length === 0 ? (
        Array.from({ length: 3 }).map((_, index) => (
          <Card key={`skeleton-${index}`}>
            <View style={styles.skeletonHeader} />
            <View style={styles.skeletonBody} />
            <View style={[styles.skeletonBody, styles.skeletonBodyShort]} />
          </Card>
        ))
      ) : null}

      {activeTab === 'Following' && posts.length === 0 && !loading ? (
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
              <Pressable onPress={() => openUserProfile(post.author_id)} style={styles.authorLink}>
                <Avatar uri={post.author?.avatar_url} name={post.author?.display_name} size="md" />
                <View style={styles.postHeaderCopy}>
                  <Text style={styles.authorName}>{post.author?.display_name ?? 'Unknown'}</Text>
                  <Text style={styles.authorMeta}>{timestamp}</Text>
                </View>
              </Pressable>
              {post.author_id !== viewerUserId ? (
                <FollowButton
                  compact
                  isFollowing={isFollowingUser(post.author_id)}
                  onPress={() => void toggleFollow(post.author_id)}
                />
              ) : null}
            </View>

            {post.suggested_reason ? (
              <View style={styles.suggestedPill}>
                <Ionicons name="sparkles-outline" size={14} color={colors.primary.main} />
                <Text style={styles.suggestedLabel}>{post.suggested_reason}</Text>
              </View>
            ) : null}

            <Text style={styles.postContent}>{post.content}</Text>

            <PostMediaGallery post={post} mode="feed" />

            {post.event_id ? (
              <Pressable style={styles.linkedEventChip} onPress={() => openEventDetail(post.event_id!)}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary.main} />
                <Text style={styles.linkedEventLabel}>Open linked event</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.text.tertiary} />
              </Pressable>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable style={styles.actionButton} onPress={() => void toggleLike(post.id)}>
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

      {hasMore ? (
        <Pressable style={styles.loadMoreButton} onPress={() => void loadMore()}>
          <Text style={styles.loadMoreLabel}>Load more</Text>
        </Pressable>
      ) : null}
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
  trendingCard: {
    gap: spacing.sm,
  },
  trendingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  trendingRow: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  hashtagChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hashtagLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
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
  suggestionIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  suggestionCopy: {
    flex: 1,
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
  errorTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  errorBody: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  skeletonHeader: {
    width: '38%',
    height: 14,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border.light,
  },
  skeletonBody: {
    marginTop: spacing.md,
    width: '100%',
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border.light,
  },
  skeletonBodyShort: {
    width: '68%',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderCopy: {
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
  suggestedPill: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  suggestedLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  postContent: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  linkedEventChip: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary.light,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkedEventLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
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
  loadMoreButton: {
    alignSelf: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loadMoreLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
});
