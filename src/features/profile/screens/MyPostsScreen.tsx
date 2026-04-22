import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { Event, PostMediaItem, UserProfile } from '../../../shared/types';
import type { ProfileStackParamList } from '../../../navigation/types';
import { isSupabaseConfigured } from '../../../services/supabase';
import {
  fetchCurrentRemoteUserId,
  fetchMentionableProfiles,
  fetchRemotePostsByUser,
  submitRemotePost,
} from '../../../services/social';
import { isUmdSportsEventId } from '../../../services/umdSports';
import { useFeedStore } from '../../feed/hooks/useFeed';
import PostMediaGallery from '../../feed/components/PostMediaGallery';
import { pickPostMedia, preparePostMediaForUpload } from '../../feed/utils/mediaComposer';
import { useMapData } from '../../map/hooks/useMapData';
import { useProfile } from '../hooks/useProfile';

type Props = NativeStackScreenProps<ProfileStackParamList, 'MyPosts'>;
type MentionCandidate = Awaited<ReturnType<typeof fetchMentionableProfiles>>[number];

const COMPOSER_PROMPTS = [
  'Anyone else heading to this?',
  'Quick campus win from today:',
  'Need one more teammate for...',
  'If you missed this event, here is the vibe:',
] as const;

function formatTimestamp(value: string) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return value;
  }
}

function isIgnorableRemotePostSyncError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string; message?: string; details?: string };
  const text = `${candidate.message ?? ''} ${candidate.details ?? ''}`.toLowerCase();
  return candidate.code === 'PGRST116' || text.includes('cannot coerce the result to a single json object');
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getEventCategoryColor(category: Event['category']) {
  const palette = colors.eventCategory as Record<string, string>;
  return palette[category] ?? colors.eventCategory.other;
}

function formatLinkedEventTime(event: Event) {
  try {
    const start = new Date(event.starts_at);
    return `${format(start, 'EEE, MMM d')} | ${format(start, 'h:mm a')}`;
  } catch {
    return event.starts_at;
  }
}

function getActiveMentionContext(value: string, selection: { start: number; end: number }) {
  if (selection.start !== selection.end) {
    return null;
  }

  const cursor = selection.start;
  let tokenStart = cursor - 1;
  while (tokenStart >= 0 && !/\s/.test(value[tokenStart] ?? '')) {
    tokenStart -= 1;
  }
  tokenStart += 1;

  let tokenEnd = cursor;
  while (tokenEnd < value.length && !/\s/.test(value[tokenEnd] ?? '')) {
    tokenEnd += 1;
  }

  const token = value.slice(tokenStart, tokenEnd);
  if (!token.startsWith('@')) {
    return null;
  }

  const query = value.slice(tokenStart + 1, cursor);
  if (query.includes('@')) {
    return null;
  }

  return { query, start: tokenStart, end: tokenEnd };
}

function scoreMentionCandidate(candidate: MentionCandidate, query: string) {
  const normalizedQuery = query.trim().replace(/^@+/, '').toLowerCase();
  if (!normalizedQuery) {
    return candidate.followingCount + candidate.followerCount;
  }

  const username = candidate.username.toLowerCase();
  const displayName = candidate.displayName.toLowerCase();
  const major = (candidate.major ?? '').toLowerCase();

  let score = 0;
  if (username === normalizedQuery) {
    score += 100;
  } else if (username.startsWith(normalizedQuery)) {
    score += 60;
  } else if (username.includes(normalizedQuery)) {
    score += 28;
  }

  if (displayName === normalizedQuery) {
    score += 90;
  } else if (displayName.startsWith(normalizedQuery)) {
    score += 55;
  } else if (displayName.includes(normalizedQuery)) {
    score += 22;
  }

  if (major.includes(normalizedQuery)) {
    score += 10;
  }

  return score + candidate.followerCount * 0.05 + candidate.followingCount * 0.02;
}

function matchesEventQuery(event: Event, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    event.title,
    event.location_name,
    event.organizer_name ?? '',
    event.category,
    ...(event.tags ?? []),
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export default function MyPostsScreen({ navigation }: Props) {
  const { user } = useProfile();
  const { rawEvents, source } = useMapData();
  const posts = useFeedStore((state) => state.posts);
  const createPost = useFeedStore((state) => state.createPost);
  const hydratePosts = useFeedStore((state) => state.hydratePosts);
  const inputRef = useRef<TextInput>(null);

  const [draft, setDraft] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<PostMediaItem[]>([]);
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [currentAuthorId, setCurrentAuthorId] = useState(user.id);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRemotePosts, setLoadingRemotePosts] = useState(false);
  const [mentionDirectory, setMentionDirectory] = useState<MentionCandidate[]>([]);
  const [loadingMentionDirectory, setLoadingMentionDirectory] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const canLinkLiveEvents = !isSupabaseConfigured || !source.startsWith('mock');

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
        if (__DEV__ && !isIgnorableRemotePostSyncError(error)) {
          console.warn('Unable to sync remote posts for My Posts.', error);
        }
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

  useEffect(() => {
    let isActive = true;

    const loadMentionDirectory = async () => {
      setLoadingMentionDirectory(true);

      try {
        const profiles = await fetchMentionableProfiles('', 60);
        if (isActive) {
          setMentionDirectory(profiles);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Unable to load mention suggestions.', error);
        }
      } finally {
        if (isActive) {
          setLoadingMentionDirectory(false);
        }
      }
    };

    void loadMentionDirectory();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!canLinkLiveEvents && linkedEventId) {
      setLinkedEventId(null);
    }
  }, [canLinkLiveEvents, linkedEventId]);

  const upcomingEvents = useMemo(
    () =>
      rawEvents
        .filter(
          (event) =>
            !isUmdSportsEventId(event.id) &&
            isAfter(new Date(event.ends_at), new Date()),
        )
        .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime()),
    [rawEvents],
  );

  const linkedEvent = useMemo(
    () => upcomingEvents.find((event) => event.id === linkedEventId) ?? null,
    [linkedEventId, upcomingEvents],
  );

  const mentionContext = useMemo(() => getActiveMentionContext(draft, selection), [draft, selection]);

  const mentionSuggestions = useMemo(() => {
    if (!mentionContext) {
      return [];
    }

    return mentionDirectory
      .filter((candidate) => candidate.id !== currentAuthorId && candidate.id !== user.id)
      .filter((candidate) => {
        const normalizedQuery = mentionContext.query.trim().toLowerCase();
        if (!normalizedQuery) {
          return true;
        }

        return [candidate.username, candidate.displayName, candidate.major ?? ''].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .sort((left, right) => scoreMentionCandidate(right, mentionContext.query) - scoreMentionCandidate(left, mentionContext.query))
      .slice(0, 6);
  }, [currentAuthorId, mentionContext, mentionDirectory, user.id]);

  const eventSuggestions = useMemo(
    () =>
      !canLinkLiveEvents
        ? []
        :
      upcomingEvents
        .filter((event) => event.id !== linkedEventId)
        .filter((event) => matchesEventQuery(event, eventSearchQuery))
        .slice(0, eventSearchQuery.trim() ? 6 : 8),
    [canLinkLiveEvents, eventSearchQuery, linkedEventId, upcomingEvents],
  );

  const myPosts = useMemo(() => posts.filter((post) => post.author_id === currentAuthorId), [currentAuthorId, posts]);

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
          currentAuthorId !== user.id
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
          eventId: linkedEventId,
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
          eventId: linkedEventId,
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
      setLinkedEventId(null);
      setEventSearchQuery('');
      setSelection({ start: 0, end: 0 });
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

  const handlePromptPress = (prompt: string) => {
    setDraft((current) => {
      const trimmed = current.trim();
      if (!trimmed) {
        return prompt;
      }

      return `${current}${/[\s\n]$/.test(current) ? '' : '\n'}${prompt}`;
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleMentionSelect = (candidate: MentionCandidate) => {
    if (!mentionContext) {
      return;
    }

    const replacement = `@${candidate.username} `;
    const nextDraft = `${draft.slice(0, mentionContext.start)}${replacement}${draft.slice(mentionContext.end)}`;
    const cursor = mentionContext.start + replacement.length;

    setDraft(nextDraft);
    setSelection({ start: cursor, end: cursor });
    requestAnimationFrame(() => inputRef.current?.focus());
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
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.composerCard}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.composerTitle}>Create a new post</Text>
            <Text style={styles.composerBody}>
              Add context, tag people, and link an event so the feed stays consistent everywhere.
            </Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="flash-outline" size={16} color={colors.primary.main} />
            <Text style={styles.badgeText}>Campus-ready</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptRow}>
          {COMPOSER_PROMPTS.map((prompt) => (
            <Pressable key={prompt} style={styles.promptChip} onPress={() => handlePromptPress(prompt)}>
              <Text style={styles.promptChipText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
            selection={selection}
            placeholder="Write the caption for your update, photo, or video. Use @ to tag people."
            placeholderTextColor={colors.text.tertiary}
            multiline
            style={styles.input}
          />
          <View style={styles.rowBetween}>
            <Text style={styles.helperText}>`@` brings up people you can tag.</Text>
            <Text style={styles.metaText}>{draft.length} chars</Text>
          </View>
        </View>

        {mentionContext ? (
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Tag someone</Text>
              {loadingMentionDirectory ? <Text style={styles.metaText}>Loading campus people...</Text> : null}
            </View>
            {mentionSuggestions.length > 0 ? (
              <View style={styles.listCard}>
                {mentionSuggestions.map((candidate) => (
                  <Pressable key={candidate.id} style={styles.listRow} onPress={() => handleMentionSelect(candidate)}>
                    {candidate.avatarUrl ? (
                      <Image source={{ uri: candidate.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>{getInitials(candidate.displayName)}</Text>
                      </View>
                    )}
                    <View style={styles.flex}>
                      <Text style={styles.listTitle}>{candidate.displayName}</Text>
                      <Text style={styles.listSubtitle}>
                        @{candidate.username}
                        {candidate.major ? ` | ${candidate.major}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="arrow-up-outline" size={16} color={colors.primary.main} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.helperText}>No campus matches yet. Try another name or handle.</Text>
            )}
          </View>
        ) : null}

        <View style={styles.rowBetween}>
          <Pressable onPress={handlePickMedia} style={styles.actionChip}>
            <Ionicons name="images-outline" size={18} color={colors.primary.main} />
            <Text style={styles.actionChipText}>Photo / Video</Text>
          </Pressable>
          <View style={styles.helperChip}>
            <Ionicons name="link-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.helperChipText}>Link an event below</Text>
          </View>
        </View>

        {selectedMedia.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Attached media</Text>
              <Text style={styles.metaText}>
                {selectedMedia.length} item{selectedMedia.length === 1 ? '' : 's'}
              </Text>
            </View>
            <PostMediaGallery mediaItems={selectedMedia} mode="composer" onRemove={removeMedia} />
          </View>
        ) : (
          <Text style={styles.helperText}>
            Images are compressed before upload so posting stays fast on campus Wi-Fi and mobile data.
          </Text>
        )}

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.sectionTitle}>Link an event</Text>
              <Text style={styles.helperText}>
                {canLinkLiveEvents
                  ? 'Optional, but it keeps feed posts tied to the real event record.'
                  : 'Event linking is temporarily unavailable because campus events are currently loading from fallback data, not the live event database.'}
              </Text>
            </View>
          </View>
          {canLinkLiveEvents ? (
            <View style={styles.searchShell}>
              <Ionicons name="search-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                value={eventSearchQuery}
                onChangeText={setEventSearchQuery}
                placeholder="Search campus events by name or place"
                placeholderTextColor={colors.text.tertiary}
                style={styles.searchInput}
              />
            </View>
          ) : (
            <View style={styles.disabledState}>
              <Ionicons name="cloud-offline-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.disabledStateText}>Publish still works. The post just won’t attach a live event until the event feed reconnects.</Text>
            </View>
          )}
          {linkedEvent ? (
            <View style={styles.linkedCard}>
              <View style={styles.rowBetween}>
                <View style={styles.inlineRow}>
                  <View style={[styles.dot, { backgroundColor: getEventCategoryColor(linkedEvent.category) }]} />
                  <Text style={styles.linkedLabel}>Linked event</Text>
                </View>
                <Pressable onPress={() => setLinkedEventId(null)}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => navigation.navigate('EventDetail', { eventId: linkedEvent.id })}>
                <Text style={styles.linkedTitle}>{linkedEvent.title}</Text>
                <Text style={styles.listSubtitle}>
                  {formatLinkedEventTime(linkedEvent)} | {linkedEvent.location_name}
                </Text>
              </Pressable>
            </View>
          ) : null}
          {canLinkLiveEvents && eventSuggestions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptRow}>
              {eventSuggestions.map((event) => (
                <Pressable
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => {
                    setLinkedEventId(event.id);
                    setEventSearchQuery('');
                  }}
                >
                  <View style={styles.inlineRow}>
                    <View style={[styles.dot, { backgroundColor: getEventCategoryColor(event.category) }]} />
                    <Text style={styles.metaText}>{formatLinkedEventTime(event)}</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.listTitle}>{event.title}</Text>
                  <Text numberOfLines={1} style={styles.listSubtitle}>{event.location_name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : canLinkLiveEvents ? (
            <Text style={styles.helperText}>No matching events yet. You can still post without linking one.</Text>
          ) : null}
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.helperText}>
              {linkedEvent
                ? 'This post will carry the linked event through the feed and open the same event detail everywhere else.'
                : 'Linking an event helps people jump from your post straight into the real event detail and RSVP flow.'}
            </Text>
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
        myPosts.map((post) => {
          const postLinkedEvent = rawEvents.find((event) => event.id === post.event_id) ?? null;

          return (
            <Card key={post.id} onPress={() => navigation.navigate('PostDetail', { postId: post.id })} style={styles.postCard}>
              <View style={styles.rowBetween}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>You posted</Text>
                </View>
                <Text style={styles.metaText}>{formatTimestamp(post.created_at)}</Text>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              {postLinkedEvent ? (
                <Pressable
                  style={styles.postLinkedRow}
                  onPress={() => navigation.navigate('EventDetail', { eventId: postLinkedEvent.id })}
                >
                  <View style={[styles.dot, { backgroundColor: getEventCategoryColor(postLinkedEvent.category) }]} />
                  <Text style={styles.postLinkedText}>Linked to {postLinkedEvent.title}</Text>
                </Pressable>
              ) : null}
              <PostMediaGallery post={post} mode="detail" />
              <View style={styles.inlineRowWrap}>
                <Text style={styles.metaText}>{post.like_count} likes</Text>
                <Text style={styles.metaText}>{post.comment_count} comments</Text>
                <Text style={styles.metaLink}>Open thread</Text>
              </View>
            </Card>
          );
        })
      ) : loadingRemotePosts ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="cloud-download-outline" size={28} color={colors.primary.main} />
          <Text style={styles.emptyTitle}>Loading your posts...</Text>
          <Text style={styles.helperText}>Pulling in your latest posts from the live social graph.</Text>
        </Card>
      ) : (
        <Card style={styles.emptyCard}>
          <Ionicons name="chatbox-ellipses-outline" size={28} color={colors.primary.main} />
          <Text style={styles.emptyTitle}>You have not posted yet.</Text>
          <Text style={styles.helperText}>
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
  composerCard: { gap: spacing.md },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  inlineRowWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  flex: { flex: 1 },
  composerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  composerBody: { marginTop: spacing.xs, fontSize: typography.fontSize.sm, lineHeight: 20, color: colors.text.secondary },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  badgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semiBold, color: colors.primary.main, textTransform: 'uppercase' },
  promptRow: { gap: spacing.sm },
  promptChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  promptChipText: { fontSize: typography.fontSize.sm, color: colors.text.secondary, fontWeight: typography.fontWeight.medium },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  input: {
    minHeight: 160,
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
  helperText: { fontSize: typography.fontSize.sm, lineHeight: 20, color: colors.text.secondary },
  metaText: { fontSize: typography.fontSize.sm, color: colors.text.tertiary },
  listCard: { borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border.light, overflow: 'hidden' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.brand.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatar: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.background.secondary },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
  },
  avatarFallbackText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary.main },
  listTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary, lineHeight: 22 },
  listSubtitle: { fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 20 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionChipText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.primary.main },
  helperChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.background.secondary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  helperChipText: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  disabledState: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  disabledStateText: { flex: 1, fontSize: typography.fontSize.sm, lineHeight: 20, color: colors.text.secondary },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.text.primary, fontSize: typography.fontSize.base, paddingVertical: spacing.xs },
  linkedCard: { gap: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.primary.light, backgroundColor: colors.primary.lightest, padding: spacing.md },
  linkedLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.primary.main },
  removeText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.primary.dark },
  linkedTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  eventCard: { width: 220, gap: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.brand.white, padding: spacing.md },
  dot: { width: 10, height: 10, borderRadius: borderRadius.full },
  postCard: { gap: spacing.md },
  pill: { alignSelf: 'flex-start', borderRadius: borderRadius.full, backgroundColor: colors.primary.lightest, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs },
  pillText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semiBold, color: colors.primary.main, letterSpacing: typography.letterSpacing.wider, textTransform: 'uppercase' },
  postContent: { fontSize: typography.fontSize.base, lineHeight: 24, color: colors.text.primary },
  postLinkedRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.background.secondary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  postLinkedText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.secondary },
  metaLink: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.primary.main },
  emptyCard: { alignItems: 'flex-start', gap: spacing.sm },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
});
