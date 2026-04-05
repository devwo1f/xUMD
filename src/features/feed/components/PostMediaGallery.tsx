import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { VideoView, useVideoPlayer } from 'expo-video';
import Avatar from '../../../shared/components/Avatar';
import type { Post, PostMediaItem } from '../../../shared/types';
import type { CommentWithReplies } from '../../../assets/data/mockFeed';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { getCommentsForPost } from '../hooks/useFeed';

type GalleryMode = 'feed' | 'detail' | 'composer';

interface PostMediaGalleryProps {
  post?: Post;
  mediaItems?: PostMediaItem[];
  mode?: GalleryMode;
  onRemove?: (mediaId: string) => void;
}

const DESKTOP_BREAKPOINT = 1100;
const DESKTOP_SIDEBAR_WIDTH = 360;
const MIN_PREVIEW_ASPECT_RATIO = 4 / 5;
const MAX_PREVIEW_ASPECT_RATIO = 1.91;

function inferLegacyMediaType(uri: string): PostMediaItem['type'] {
  const sanitized = uri.split('?')[0].toLowerCase();
  if (/\.(mp4|mov|m4v|webm|avi|mkv)$/.test(sanitized)) {
    return 'video';
  }
  return 'image';
}

function normalizeMedia(post?: Post, mediaItems?: PostMediaItem[]) {
  if (mediaItems && mediaItems.length > 0) {
    return mediaItems;
  }

  if (post?.media_items && post.media_items.length > 0) {
    return post.media_items;
  }

  if (post?.media_urls?.length) {
    return post.media_urls.map((uri, index) => ({
      id: `${post.id}-legacy-${index}`,
      uri,
      type: inferLegacyMediaType(uri),
    }));
  }

  return [];
}

function getRawAspectRatio(item?: PostMediaItem | null) {
  if (!item?.width || !item?.height || item.width <= 0 || item.height <= 0) {
    return null;
  }

  return item.width / item.height;
}

function getPreviewAspectRatio(item?: PostMediaItem | null) {
  const fallback = item?.type === 'video' ? 9 / 16 : 1;
  const ratio = getRawAspectRatio(item) ?? fallback;
  return Math.min(MAX_PREVIEW_ASPECT_RATIO, Math.max(MIN_PREVIEW_ASPECT_RATIO, ratio));
}

function getPreviewHeight(width: number, item?: PostMediaItem | null) {
  const aspectRatio = getPreviewAspectRatio(item);
  return Math.round(width / aspectRatio);
}

function getViewerDimensions(item: PostMediaItem, maxWidth: number, maxHeight: number) {
  const rawAspectRatio = getRawAspectRatio(item) ?? (item.type === 'video' ? 9 / 16 : 1);
  let width = maxWidth;
  let height = width / rawAspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * rawAspectRatio;
  }

  return { width, height };
}

function formatDuration(durationMs?: number | null) {
  if (!durationMs) {
    return null;
  }

  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatTimestamp(value?: string) {
  if (!value) {
    return 'just now';
  }

  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return value;
  }
}

function getPostHandle(post?: Post) {
  if (!post?.author) {
    return '@xumd';
  }

  if (post.author.username) {
    return `@${post.author.username}`;
  }

  if (post.author.email) {
    return `@${post.author.email.split('@')[0]}`;
  }

  return '@xumd';
}

function flattenComments(comments: CommentWithReplies[]) {
  const flattened: CommentWithReplies[] = [];

  const visit = (items: CommentWithReplies[]) => {
    items.forEach((item) => {
      flattened.push(item);
      if (item.replies && item.replies.length > 0) {
        visit(item.replies);
      }
    });
  };

  visit(comments);
  return flattened;
}

function VideoPreview({
  item,
  height,
}: {
  item: PostMediaItem;
  height: number;
}) {
  const durationLabel = formatDuration(item.duration_ms);

  return (
    <View style={[styles.mediaFrame, styles.videoPreviewFrame, { height }]}>
      <View style={styles.videoPreviewGlow} />
      <View style={styles.videoPreviewCenter}>
        <Ionicons name="play-circle" size={56} color={colors.brand.white} />
        <Text style={styles.videoOverlayText}>Tap to play</Text>
      </View>
      <View style={styles.videoPreviewFooter}>
        <View style={styles.videoTypePill}>
          <Ionicons name="videocam" size={12} color={colors.brand.white} />
          <Text style={styles.videoTypePillText}>Video</Text>
        </View>
        {durationLabel ? <Text style={styles.videoMeta}>{durationLabel}</Text> : null}
      </View>
    </View>
  );
}

function FullscreenVideo({
  item,
  width,
  height,
}: {
  item: PostMediaItem;
  width: number;
  height: number;
}) {
  const player = useVideoPlayer(item.uri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = false;
  });
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    try {
      player.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }

    return () => {
      try {
        player.pause();
      } catch {
        // noop
      }
    };
  }, [player]);

  const togglePlayback = () => {
    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
        return;
      }

      player.play();
      setIsPlaying(true);
    } catch {
      // noop
    }
  };

  return (
    <View style={[styles.viewerMediaFrame, { width, height }]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="contain"
        nativeControls
      />
      <Pressable onPress={togglePlayback} style={styles.playerToggle}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={colors.brand.white} />
        <Text style={styles.playerToggleText}>{isPlaying ? 'Pause' : 'Play'}</Text>
      </Pressable>
    </View>
  );
}

function ViewerSidebar({ post }: { post: Post }) {
  const comments = useMemo(() => flattenComments(getCommentsForPost(post.id)).slice(0, 8), [post.id]);

  return (
    <View style={styles.viewerSidebar}>
      <View style={styles.sidebarHeader}>
        <Avatar uri={post.author?.avatar_url} name={post.author?.display_name} size="md" />
        <View style={styles.sidebarHeaderCopy}>
          <Text style={styles.sidebarName}>{post.author?.display_name ?? 'xUMD'}</Text>
          <Text style={styles.sidebarMeta}>{getPostHandle(post)} • {formatTimestamp(post.created_at)}</Text>
        </View>
      </View>

      <View style={styles.sidebarCaptionBlock}>
        <Text style={styles.sidebarSectionLabel}>Caption</Text>
        <Text style={styles.sidebarCaptionText}>{post.content || 'Shared media on xUMD.'}</Text>
      </View>

      <View style={styles.sidebarStatsRow}>
        <Text style={styles.sidebarStat}>{post.like_count} likes</Text>
        <Text style={styles.sidebarStat}>{post.comment_count} comments</Text>
        {typeof post.share_count === 'number' ? <Text style={styles.sidebarStat}>{post.share_count} shares</Text> : null}
      </View>

      <View style={styles.sidebarCommentsBlock}>
        <Text style={styles.sidebarSectionLabel}>Comments</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarCommentsList}>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <View key={comment.id} style={styles.sidebarCommentRow}>
                <Text style={styles.sidebarCommentAuthor}>{comment.author?.display_name ?? 'Terp'}</Text>
                <Text style={styles.sidebarCommentText}>{comment.content}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.sidebarEmptyText}>No comments yet. Be the first Terp to jump in.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function FullscreenMediaViewer({
  post,
  items,
  activeIndex,
  onClose,
  onChangeIndex,
}: {
  post?: Post;
  items: PostMediaItem[];
  activeIndex: number;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}) {
  const { width, height } = useWindowDimensions();
  const activeItem = items[activeIndex];

  if (!activeItem) {
    return null;
  }

  const isDesktop = width >= DESKTOP_BREAKPOINT && Boolean(post);
  const canGoBack = activeIndex > 0;
  const canGoForward = activeIndex < items.length - 1;
  const horizontalPadding = isDesktop ? spacing.xl * 2 + DESKTOP_SIDEBAR_WIDTH + spacing.lg : spacing.xl * 2;
  const mediaSize = getViewerDimensions(
    activeItem,
    Math.min(width - horizontalPadding, 980),
    Math.min(height * 0.78, 780),
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerRoot}>
        <Pressable style={styles.viewerDismissArea} onPress={onClose} />

        <View style={[styles.viewerDialog, isDesktop && styles.viewerDialogDesktop]}>
          <View style={[styles.viewerContent, isDesktop && styles.viewerContentDesktop]}>
            <View style={[styles.viewerMediaStage, { width: mediaSize.width, height: mediaSize.height }]}> 
              {activeItem.type === 'image' ? (
                <Image
                  source={{ uri: activeItem.uri }}
                  resizeMode="contain"
                  style={{ width: mediaSize.width, height: mediaSize.height }}
                />
              ) : (
                <FullscreenVideo item={activeItem} width={mediaSize.width} height={mediaSize.height} />
              )}

              {canGoBack ? (
                <Pressable style={[styles.viewerArrow, styles.viewerArrowLeft]} onPress={() => onChangeIndex(activeIndex - 1)}>
                  <Ionicons name="chevron-back" size={22} color={colors.brand.white} />
                </Pressable>
              ) : null}

              {canGoForward ? (
                <Pressable style={[styles.viewerArrow, styles.viewerArrowRight]} onPress={() => onChangeIndex(activeIndex + 1)}>
                  <Ionicons name="chevron-forward" size={22} color={colors.brand.white} />
                </Pressable>
              ) : null}
            </View>

            {isDesktop && post ? <ViewerSidebar post={post} /> : null}
          </View>
        </View>

        <View style={styles.viewerTopBar} pointerEvents="box-none">
          <View style={styles.viewerCounter}>
            <Text style={styles.viewerCounterText}>
              {activeIndex + 1} / {items.length}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.viewerCloseButton}>
            <Ionicons name="close" size={22} color={colors.brand.white} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function PostMediaGallery({
  post,
  mediaItems,
  mode = 'feed',
  onRemove,
}: PostMediaGalleryProps) {
  const normalized = normalizeMedia(post, mediaItems);
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(Math.min(windowWidth - spacing.lg * 2, 760));

  const activePreviewItem = normalized[pageIndex] ?? normalized[0];
  const previewHeight = useMemo(
    () => getPreviewHeight(containerWidth, activePreviewItem),
    [activePreviewItem, containerWidth],
  );

  if (normalized.length === 0) {
    return null;
  }

  const showPager = normalized.length > 1;

  return (
    <>
      <View
        style={[styles.container, mode === 'composer' && styles.composerContainer]}
        onLayout={(event) => {
          const nextWidth = Math.max(1, Math.round(event.nativeEvent.layout.width));
          if (nextWidth !== containerWidth) {
            setContainerWidth(nextWidth);
          }
        }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / Math.max(containerWidth, 1));
            setPageIndex(nextIndex);
          }}
          scrollEnabled={showPager}
          contentContainerStyle={styles.carouselTrack}
        >
          {normalized.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => setActiveIndex(index)}
              style={[styles.itemShell, { width: containerWidth }]}
            >
              {item.type === 'image' ? (
                <Image
                  source={{ uri: item.uri }}
                  resizeMode="contain"
                  style={[styles.mediaFrame, styles.imageFrame, { height: previewHeight }]}
                />
              ) : (
                <VideoPreview item={item} height={previewHeight} />
              )}
              <View style={styles.openHint}>
                <Ionicons name={item.type === 'video' ? 'play-outline' : 'expand-outline'} size={14} color={colors.brand.white} />
                <Text style={styles.openHintText}>{item.type === 'video' ? 'Open player' : 'Open media'}</Text>
              </View>
              {onRemove ? (
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    onRemove(item.id);
                  }}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={14} color={colors.text.inverse} />
                </Pressable>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>

        {showPager ? (
          <View style={styles.pageDots}>
            {normalized.map((item, index) => (
              <View
                key={`${item.id}-dot`}
                style={[styles.pageDot, index === pageIndex && styles.pageDotActive]}
              />
            ))}
          </View>
        ) : null}
      </View>

      {activeIndex !== null ? (
        <FullscreenMediaViewer
          post={post}
          items={normalized}
          activeIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
          onChangeIndex={(nextIndex) => {
            setActiveIndex(nextIndex);
            setPageIndex(nextIndex);
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  composerContainer: {
    marginTop: 0,
  },
  carouselTrack: {
    alignItems: 'stretch',
  },
  itemShell: {
    position: 'relative',
  },
  mediaFrame: {
    width: '100%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  imageFrame: {
    backgroundColor: '#F8FAFC',
  },
  videoPreviewFrame: {
    justifyContent: 'space-between',
    backgroundColor: '#050816',
    padding: spacing.md,
  },
  videoPreviewGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
  },
  videoPreviewCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  videoPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  videoTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  videoTypePillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.brand.white,
  },
  videoOverlayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.inverse,
  },
  videoMeta: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.gray[200],
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.overlay,
  },
  openHint: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  openHintText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.brand.white,
  },
  pageDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pageDot: {
    width: 7,
    height: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[300],
  },
  pageDotActive: {
    width: 22,
    backgroundColor: colors.primary.main,
  },
  viewerRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerDismissArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
  },
  viewerDialog: {
    width: '100%',
    maxWidth: 1040,
    paddingHorizontal: spacing.xl,
    zIndex: 1,
  },
  viewerDialogDesktop: {
    maxWidth: 1380,
  },
  viewerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerContentDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  viewerMediaStage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  viewerMediaFrame: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  viewerArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  viewerArrowLeft: {
    left: spacing.md,
  },
  viewerArrowRight: {
    right: spacing.md,
  },
  viewerTopBar: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  viewerCounter: {
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewerCounterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.brand.white,
  },
  viewerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerSidebar: {
    width: DESKTOP_SIDEBAR_WIDTH,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sidebarHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  sidebarName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sidebarMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  sidebarCaptionBlock: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sidebarSectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },
  sidebarCaptionText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  sidebarStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sidebarStat: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  sidebarCommentsBlock: {
    flex: 1,
    gap: spacing.sm,
    minHeight: 0,
  },
  sidebarCommentsList: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  sidebarCommentRow: {
    gap: spacing.xs,
  },
  sidebarCommentAuthor: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sidebarCommentText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  sidebarEmptyText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  playerToggle: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(15, 23, 42, 0.74)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  playerToggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.brand.white,
  },
});
