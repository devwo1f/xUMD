import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatDistanceToNow } from 'date-fns';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { PostMediaItem, UserProfile } from '../../../shared/types';
import type { ProfileStackParamList } from '../../../navigation/types';
import { isSupabaseConfigured } from '../../../services/supabase';
import {
  fetchCurrentRemoteUserId,
  fetchRemotePostsByUser,
  submitRemotePost,
} from '../../../services/social';
import { useFeedStore } from '../../feed/hooks/useFeed';
import PostMediaGallery from '../../feed/components/PostMediaGallery';
import {
  pickPostMedia,
  preparePostMediaForUpload,
} from '../../feed/utils/mediaComposer';
import { useProfile } from '../hooks/useProfile';
import { CURRENT_SOCIAL_USER_ID } from '../../social/data/mockSocialGraph';

type Props = NativeStackScreenProps<ProfileStackParamList, 'MyPosts'>;

function formatTimestamp(value: string) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return value;
  }
}

export default function MyPostsScreen({ navigation }: Props) {
  const { user } = useProfile();
  const posts = useFeedStore((state) => state.posts);
  const createPost = useFeedStore((state) => state.createPost);
  const hydratePosts = useFeedStore((state) => state.hydratePosts);
  const [draft, setDraft] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<PostMediaItem[]>([]);
  const [currentAuthorId, setCurrentAuthorId] = useState(CURRENT_SOCIAL_USER_ID);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRemotePosts, setLoadingRemotePosts] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!isSupabaseConfigured) {
      return () => {
        isActive = false;
      };
    }

    const loadRemotePosts = async () => {
      setLoadingRemotePosts(true);

      try {
        const remoteUserId = await fetchCurrentRemoteUserId();
        if (!isActive || !remoteUserId) {
          return;
        }

        setCurrentAuthorId(remoteUserId);
        const remotePosts = await fetchRemotePostsByUser(remoteUserId);
        if (isActive && remotePosts.length > 0) {
          hydratePosts(remotePosts);
        }
      } catch (error) {
        console.warn('Unable to sync remote posts for My Posts.', error);
      } finally {
        if (isActive) {
          setLoadingRemotePosts(false);
        }
      }
    };

    void loadRemotePosts();

    return () => {
      isActive = false;
    };
  }, [hydratePosts]);

  const myPosts = useMemo(
    () => posts.filter((post) => post.author_id === currentAuthorId),
    [currentAuthorId, posts],
  );

  const currentAuthor = useMemo<UserProfile>(
    () => ({
      id: currentAuthorId,
      email: user.email,
      username: user.username,
      display_name: user.displayName,
      avatar_url: user.avatar,
      bio: user.bio,
      major: user.major,
      graduation_year: user.classYear,
      push_token: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    [currentAuthorId, user],
  );

  const handleCreatePost = async () => {
    const trimmed = draft.trim();
    if (!trimmed && selectedMedia.length === 0) {
      return;
    }

    setSubmitting(true);

    try {
      if (isSupabaseConfigured) {
        const remoteUserId =
          currentAuthorId !== CURRENT_SOCIAL_USER_ID
            ? currentAuthorId
            : await fetchCurrentRemoteUserId();

        if (!remoteUserId) {
          throw new Error('Sign in again to publish with the live campus feed.');
        }

        if (remoteUserId !== currentAuthorId) {
          setCurrentAuthorId(remoteUserId);
        }

        const uploads = await preparePostMediaForUpload(selectedMedia);
        const result = await submitRemotePost({
          contentText: trimmed,
          mediaItems: uploads,
        });

        if (result.post) {
          hydratePosts([result.post]);
        } else {
          const refreshedPosts = await fetchRemotePostsByUser(remoteUserId, 12);
          hydratePosts(refreshedPosts);
        }

        if (result.moderationStatus === 'pending') {
          Alert.alert(
            'Post submitted',
            'Your post is already on your profile and is waiting on moderation before broader campus discovery.',
          );
        }

        if (result.moderationStatus === 'rejected') {
          Alert.alert(
            'Post needs edits',
            'We saved the post to your profile, but it could not be published more broadly in its current form.',
          );
        }
      } else {
        createPost({
          authorId: currentAuthorId,
          author: currentAuthor,
          clubId: null,
          content: trimmed,
          mediaUrls: selectedMedia.map((item) => item.uri),
          mediaItems: selectedMedia,
          type: selectedMedia.some((item) => item.type === 'video')
            ? 'video'
            : selectedMedia.length > 0
              ? 'image'
              : 'text',
        });
      }

      setDraft('');
      setSelectedMedia([]);
    } catch (error) {
      Alert.alert(
        'Unable to publish post',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickMedia = async () => {
    const { items, warnings } = await pickPostMedia();

    if (warnings.length > 0) {
      Alert.alert('Some files were skipped', warnings.join('\n'));
    }

    if (items.length === 0) {
      return;
    }

    setSelectedMedia((current) => [...current, ...items].slice(0, 4));
  };

  const removeMedia = (mediaId: string) => {
    setSelectedMedia((current) => current.filter((item) => item.id !== mediaId));
  };

  return (
    <ScreenLayout
      title="My Posts"
      subtitle="Share updates, ideas, and campus moments from your profile."
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="create-outline"
          label="Your Voice"
          color={colors.primary.main}
          tintColor={colors.primary.lightest}
        />
      }
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
      headerStyle={styles.headerShell}
    >
      <Card style={styles.composerCard}>
        <View style={styles.composerHeader}>
          <View>
            <Text style={styles.composerTitle}>Create a new post</Text>
            <Text style={styles.composerBody}>This will show up in your profile and the campus feed.</Text>
          </View>
        </View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write the caption for your update, photo, or video."
          placeholderTextColor={colors.text.tertiary}
          multiline
          style={styles.input}
        />
        {selectedMedia.length > 0 ? (
          <View style={styles.attachmentSection}>
            <View style={styles.attachmentHeader}>
              <Text style={styles.attachmentTitle}>Attached media</Text>
              <Text style={styles.attachmentMeta}>
                {selectedMedia.length} item{selectedMedia.length === 1 ? '' : 's'}
              </Text>
            </View>
            <PostMediaGallery mediaItems={selectedMedia} mode="composer" onRemove={removeMedia} />
          </View>
        ) : null}
        <View style={styles.composerFooter}>
          <View style={styles.footerActions}>
            <Pressable onPress={handlePickMedia} style={styles.mediaButton}>
              <Ionicons name="images-outline" size={18} color={colors.primary.main} />
              <Text style={styles.mediaButtonText}>Photo / Video</Text>
            </Pressable>
            {selectedMedia.length > 0 ? (
              <Text style={styles.helperText}>Prepared for upload with image compression and lightweight media packaging.</Text>
            ) : (
              <Text style={styles.helperText}>Images are compressed before upload so posting stays fast on campus Wi-Fi and mobile data.</Text>
            )}
          </View>
          <Button
            title="Post"
            onPress={() => void handleCreatePost()}
            disabled={(!draft.trim() && selectedMedia.length === 0) || submitting}
            loading={submitting}
            icon={<Ionicons name="send" size={16} color={colors.brand.white} />}
          />
        </View>
      </Card>

      {myPosts.length > 0 ? (
        myPosts.map((post) => (
          <Card key={post.id} onPress={() => navigation.navigate('PostDetail', { postId: post.id })} style={styles.postCard}>
            <View style={styles.postTopRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>You posted</Text>
              </View>
              <Text style={styles.timestamp}>{formatTimestamp(post.created_at)}</Text>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            <PostMediaGallery post={post} mode="detail" />
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{post.like_count} likes</Text>
              <Text style={styles.metaText}>{post.comment_count} comments</Text>
              <Text style={styles.metaLink}>Open thread</Text>
            </View>
          </Card>
        ))
      ) : loadingRemotePosts ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="cloud-download-outline" size={28} color={colors.primary.main} />
          <Text style={styles.emptyTitle}>Loading your posts...</Text>
          <Text style={styles.emptyBody}>Pulling in your latest posts from the live social graph.</Text>
        </Card>
      ) : (
        <Card style={styles.emptyCard}>
          <Ionicons name="chatbox-ellipses-outline" size={28} color={colors.primary.main} />
          <Text style={styles.emptyTitle}>You have not posted yet.</Text>
          <Text style={styles.emptyBody}>
            Start with a quick update, a campus thought, or something you are building. Your first post will show up here immediately.
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
  composerCard: {
    gap: spacing.md,
  },
  composerHeader: {
    gap: spacing.xs,
  },
  composerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  composerBody: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  input: {
    minHeight: 140,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.input,
    color: colors.text.primary,
    padding: spacing.md,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerActions: {
    flex: 1,
    gap: spacing.sm,
  },
  mediaButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mediaButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  attachmentSection: {
    gap: spacing.sm,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  attachmentTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  attachmentMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  postCard: {
    gap: spacing.md,
  },
  postTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  pillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  postContent: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  metaLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  emptyCard: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});
