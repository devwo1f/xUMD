import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../../../shared/components/Avatar';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import CommentItem from '../components/CommentItem';
import PostMediaGallery from '../components/PostMediaGallery';
import { getCommentsForPost, mockAuthors, useFeedStore } from '../hooks/useFeed';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CommentWithReplies } from '../../../assets/data/mockFeed';
import type { FeedStackParamList, ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<FeedStackParamList & ProfileStackParamList, 'PostDetail'>;

function toggleCommentLike(comments: CommentWithReplies[], commentId: string): CommentWithReplies[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      const isLiked = !comment.is_liked;
      return {
        ...comment,
        is_liked: isLiked,
        like_count: Math.max(0, (comment.like_count ?? 0) + (isLiked ? 1 : -1)),
      };
    }

    return {
      ...comment,
      replies: comment.replies ? toggleCommentLike(comment.replies, commentId) : comment.replies,
    };
  });
}

export default function PostDetailScreen({ navigation, route }: Props) {
  const posts = useFeedStore((state) => state.posts);
  const toggleLike = useFeedStore((state) => state.toggleLike);
  const addComment = useFeedStore((state) => state.addComment);
  const post = posts.find((item) => item.id === route.params.postId);
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState<CommentWithReplies[]>(() => getCommentsForPost(route.params.postId));
  const openUserProfile = (userId: string) => navigation.navigate('UserProfile', { userId });
  const openLinkedEvent = (eventId: string) => navigation.navigate('EventDetail', { eventId });

  const timestamp = useMemo(() => {
    if (!post) {
      return '';
    }

    try {
      return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    } catch {
      return post.created_at;
    }
  }, [post]);

  if (!post) {
    return (
      <ScreenLayout
        title="Post"
        subtitle="We couldn't find that post."
        leftAction={
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        }
      >
        <Card>
          <Text style={styles.emptyText}>Head back to the feed and choose another post.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const handleAddComment = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    const nextComment: CommentWithReplies = {
      id: `draft-${Date.now()}`,
      post_id: post.id,
      author_id: mockAuthors.currentUser.id,
      author: mockAuthors.currentUser,
      content: trimmed,
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      like_count: 0,
      is_liked: false,
      replies: [],
    };

    setComments((current) => [nextComment, ...current]);
    addComment(post.id, trimmed);
    setDraft('');
  };

  return (
    <ScreenLayout
      title="Post"
      subtitle="Join the conversation."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
      rightAction={
        <Pressable style={styles.backButton} onPress={() => toggleLike(post.id)}>
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.is_liked ? colors.primary.main : colors.text.primary}
          />
        </Pressable>
      }
    >
      <Card>
        <View style={styles.postHeader}>
          <Pressable onPress={() => openUserProfile(post.author_id)} style={styles.authorLink}>
            <Avatar uri={post.author?.avatar_url} name={post.author?.display_name} size="md" />
            <View style={styles.postHeaderCopy}>
              <Text style={styles.authorName}>{post.author?.display_name ?? 'Unknown'}</Text>
              <Text style={styles.authorMeta}>{timestamp}</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.postContent}>{post.content}</Text>
        <PostMediaGallery post={post} mode="detail" />

        {post.event_id ? (
          <Pressable style={styles.linkedEventCard} onPress={() => openLinkedEvent(post.event_id!)}>
            <View style={styles.linkedEventIcon}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary.main} />
            </View>
            <View style={styles.linkedEventCopy}>
              <Text style={styles.linkedEventTitle}>Linked event</Text>
              <Text style={styles.linkedEventBody}>Open the event this post is referencing.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </Pressable>
        ) : null}

        <View style={styles.postStats}>
          <Text style={styles.statText}>{post.like_count} likes</Text>
          <Text style={styles.statText}>{post.comment_count} comments</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Add a comment</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Share your thoughts with fellow Terps..."
          placeholderTextColor={colors.text.tertiary}
          multiline
          style={styles.input}
        />
        <Button title="Post Comment" onPress={handleAddComment} disabled={!draft.trim()} fullWidth />
      </Card>

      <View style={styles.commentsHeader}>
        <Text style={styles.sectionTitle}>Comments</Text>
        <Text style={styles.commentsCount}>{comments.length}</Text>
      </View>

      {comments.map((comment) => (
        <Card key={comment.id} style={styles.commentCard}>
          <CommentItem
            comment={comment}
            onReply={() => setDraft(`@${comment.author?.display_name ?? 'terp'} `)}
            onLike={(commentId) => setComments((current) => toggleCommentLike(current, commentId))}
            onOpenAuthor={openUserProfile}
          />
        </Card>
      ))}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
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
  postContent: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  linkedEventCard: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary.light,
    backgroundColor: colors.primary.lightest,
    padding: spacing.md,
  },
  linkedEventIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
  },
  linkedEventCopy: {
    flex: 1,
    gap: 2,
  },
  linkedEventTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  linkedEventBody: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  postStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 96,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.input,
    color: colors.text.primary,
    padding: spacing.md,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  commentCard: {
    paddingVertical: spacing.xs,
  },
});
