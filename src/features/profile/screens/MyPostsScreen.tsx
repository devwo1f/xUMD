import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { useFeedStore } from '../../feed/hooks/useFeed';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'MyPosts'>;

export default function MyPostsScreen({ navigation }: Props) {
  const posts = useFeedStore((state) => state.posts.filter((post) => post.author_id === 'usr-current'));

  return (
    <ScreenLayout
      title="My Posts"
      subtitle="Your voice across the UMD community."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      {posts.map((post) => (
        <Card key={post.id} onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
          <Text style={styles.title}>{post.content}</Text>
          <Text style={styles.meta}>{post.like_count} likes · {post.comment_count} comments</Text>
        </Card>
      ))}
      {posts.length === 0 ? <Text style={styles.emptyText}>Publish your first post to see it here.</Text> : null}
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
  title: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  meta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.text.secondary,
  },
});