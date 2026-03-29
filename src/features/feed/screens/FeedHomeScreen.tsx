import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

type Props = NativeStackScreenProps<FeedStackParamList, 'FeedHome'>;

export default function FeedHomeScreen({ navigation }: Props) {
  const { posts, activeTab, setActiveTab, toggleLike } = useFeed();

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
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.text.tertiary} />
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.media_urls[0] ? <Image source={{ uri: post.media_urls[0] }} style={styles.postImage} /> : null}

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
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
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
});
