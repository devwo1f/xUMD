import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import Avatar from './Avatar';

interface PostAuthor {
  id: string;
  name: string;
  handle: string;
  avatarUri?: string;
}

interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  imageUri?: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onPress?: () => void;
  onProfilePress?: () => void;
}

const ActionButton: React.FC<{
  icon: string;
  count?: number;
  active?: boolean;
  activeColor?: string;
  onPress?: () => void;
}> = ({ icon, count, active = false, activeColor = colors.primary.main, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.actionButton} activeOpacity={0.6}>
    <Text style={[styles.actionIcon, active && { color: activeColor }]}>{icon}</Text>
    {count !== undefined && count > 0 && (
      <Text style={[styles.actionCount, active && { color: activeColor }]}>
        {count}
      </Text>
    )}
  </TouchableOpacity>
);

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onPress,
  onProfilePress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          uri={post.author.avatarUri}
          name={post.author.name}
          size="md"
          onPress={onProfilePress}
        />
        <View style={styles.headerText}>
          <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7}>
            <Text style={styles.authorName}>{post.author.name}</Text>
          </TouchableOpacity>
          <View style={styles.handleRow}>
            <Text style={styles.handle}>@{post.author.handle}</Text>
            <Text style={styles.dot}>{' \u00B7 '}</Text>
            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Image */}
      {post.imageUri && (
        <Image source={{ uri: post.imageUri }} style={styles.image} />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <ActionButton
            icon={post.isLiked ? '❤️' : '🤍'}
            count={post.likeCount}
            active={post.isLiked}
            onPress={onLike}
          />
          <ActionButton
            icon="💬"
            count={post.commentCount}
            onPress={onComment}
          />
          <ActionButton
            icon="🔄"
            count={post.shareCount}
            onPress={onShare}
          />
        </View>
        <ActionButton
          icon={post.isBookmarked ? '🔖' : '🏷️'}
          active={post.isBookmarked}
          activeColor={colors.secondary.main}
          onPress={onBookmark}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  dot: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  timestamp: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  content: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    resizeMode: 'cover',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    paddingVertical: spacing.xs,
  },
  actionIcon: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  actionCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
});

export default PostCard;
