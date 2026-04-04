/**
 * CommentItem
 *
 * Renders a single comment with avatar, author, timestamp, content,
 * like button, and reply button. Nested replies are indented.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../../../shared/components/Avatar';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { spacing, borderRadius } from '../../../shared/theme/spacing';
import type { CommentWithReplies } from '../../../assets/data/mockFeed';

interface CommentItemProps {
  comment: CommentWithReplies;
  onReply: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onOpenAuthor?: (authorId: string) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onOpenAuthor,
  isReply = false,
}) => {
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <View style={[styles.wrapper, isReply && styles.replyWrapper]}>
      <View style={styles.row}>
        <Avatar
          uri={comment.author?.avatar_url}
          name={comment.author?.display_name}
          size="sm"
          onPress={comment.author_id ? () => onOpenAuthor?.(comment.author_id) : undefined}
        />
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={comment.author_id ? () => onOpenAuthor?.(comment.author_id) : undefined}
              disabled={!comment.author_id || !onOpenAuthor}
            >
              <Text style={styles.authorName}>
                {comment.author?.display_name ?? 'Unknown'}
              </Text>
            </Pressable>
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>
          <Text style={styles.content}>{comment.content}</Text>
          <View style={styles.actions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => onLike(comment.id)}
            >
              <Ionicons
                name={comment.is_liked ? 'heart' : 'heart-outline'}
                size={14}
                color={comment.is_liked ? colors.primary.main : colors.text.tertiary}
              />
              {(comment.like_count ?? 0) > 0 && (
                <Text
                  style={[
                    styles.actionText,
                    comment.is_liked && styles.actionTextActive,
                  ]}
                >
                  {comment.like_count}
                </Text>
              )}
            </Pressable>
            {!isReply && (
              <Pressable
                style={styles.actionButton}
                onPress={() => onReply(comment.id)}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={13}
                  color={colors.text.tertiary}
                />
                <Text style={styles.actionText}>Reply</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onOpenAuthor={onOpenAuthor}
              isReply
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: spacing.sm,
  },
  replyWrapper: {
    marginLeft: spacing.xl + spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray[200],
    paddingLeft: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  body: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  content: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * 1.5,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  actionTextActive: {
    color: colors.primary.main,
  },
  repliesContainer: {
    marginTop: spacing.xs,
  },
});

export default CommentItem;
