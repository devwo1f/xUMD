import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { Post, PostMediaItem } from '../../../shared/types';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';

type GalleryMode = 'feed' | 'detail' | 'composer';

interface PostMediaGalleryProps {
  post?: Post;
  mediaItems?: PostMediaItem[];
  mode?: GalleryMode;
  onRemove?: (mediaId: string) => void;
}

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

function getMediaHeight(mode: GalleryMode) {
  if (mode === 'detail') {
    return 280;
  }

  if (mode === 'composer') {
    return 180;
  }

  return 220;
}

function VideoAttachment({
  item,
  mode,
}: {
  item: PostMediaItem;
  mode: GalleryMode;
}) {
  const player = useVideoPlayer(item.uri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
  });

  const height = getMediaHeight(mode);
  const showControls = mode !== 'feed';

  return (
    <View style={[styles.mediaFrame, { height }]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={showControls}
      />
      {!showControls ? (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={42} color={colors.brand.white} />
          <Text style={styles.videoOverlayText}>Video attachment</Text>
        </View>
      ) : null}
    </View>
  );
}

function VideoPlaceholder({ item }: { item: PostMediaItem }) {
  return (
    <View style={[styles.mediaFrame, styles.videoPlaceholder, { height: getMediaHeight('feed') }]}>
      <Ionicons name="play-circle" size={42} color={colors.brand.white} />
      <Text style={styles.videoOverlayText}>Video attachment</Text>
      {item.duration_ms ? (
        <Text style={styles.videoMeta}>
          {Math.max(1, Math.round(item.duration_ms / 1000))} sec
        </Text>
      ) : null}
    </View>
  );
}

function FullscreenVideo({ item }: { item: PostMediaItem }) {
  const player = useVideoPlayer(item.uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = false;
  });

  return (
    <View style={styles.viewerMediaFrame}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

function FullscreenMediaViewer({
  items,
  activeIndex,
  onClose,
  onChangeIndex,
}: {
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

  const canGoBack = activeIndex > 0;
  const canGoForward = activeIndex < items.length - 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerBackdrop}>
        <View style={styles.viewerHeader}>
          <View style={styles.viewerCounter}>
            <Text style={styles.viewerCounterText}>
              {activeIndex + 1} / {items.length}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.viewerCloseButton}>
            <Ionicons name="close" size={22} color={colors.brand.white} />
          </Pressable>
        </View>

        <View style={[styles.viewerBody, { minHeight: Math.min(height * 0.72, 680) }]}>
          {activeItem.type === 'image' ? (
            <Image
              source={{ uri: activeItem.uri }}
              resizeMode="contain"
              style={[styles.viewerImage, { width: Math.min(width - spacing.xl * 2, 960) }]}
            />
          ) : (
            <FullscreenVideo item={activeItem} />
          )}
        </View>

        {items.length > 1 ? (
          <View style={styles.viewerFooter}>
            <Pressable
              disabled={!canGoBack}
              onPress={() => canGoBack && onChangeIndex(activeIndex - 1)}
              style={[styles.viewerNavButton, !canGoBack && styles.viewerNavButtonDisabled]}
            >
              <Ionicons name="chevron-back" size={18} color={canGoBack ? colors.brand.white : colors.gray[500]} />
              <Text style={[styles.viewerNavText, !canGoBack && styles.viewerNavTextDisabled]}>Previous</Text>
            </Pressable>
            <Pressable
              disabled={!canGoForward}
              onPress={() => canGoForward && onChangeIndex(activeIndex + 1)}
              style={[styles.viewerNavButton, !canGoForward && styles.viewerNavButtonDisabled]}
            >
              <Text style={[styles.viewerNavText, !canGoForward && styles.viewerNavTextDisabled]}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color={canGoForward ? colors.brand.white : colors.gray[500]} />
            </Pressable>
          </View>
        ) : null}
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (normalized.length === 0) {
    return null;
  }

  const visibleItems = mode === 'feed' ? normalized.slice(0, 1) : normalized;
  const previewEnabled = !onRemove && mode !== 'composer';

  return (
    <>
      <View style={[styles.container, mode === 'composer' && styles.composerContainer]}>
        {visibleItems.map((item, index) => {
          const normalizedIndex = mode === 'feed' ? index : normalized.findIndex((entry) => entry.id === item.id);
          const shellProps = previewEnabled
            ? {
                onPress: () => setActiveIndex(normalizedIndex),
                style: styles.itemShell,
              }
            : {
                style: styles.itemShell,
              };

          return (
            <Pressable key={item.id} {...shellProps}>
              {item.type === 'image' ? (
                <Image
                  source={{ uri: item.uri }}
                  style={[styles.mediaFrame, { height: getMediaHeight(mode) }]}
                />
              ) : mode === 'feed' ? (
                <VideoPlaceholder item={item} />
              ) : (
                <VideoAttachment item={item} mode={mode} />
              )}
              {previewEnabled ? (
                <View style={styles.openHint}>
                  <Ionicons name="expand-outline" size={14} color={colors.brand.white} />
                  <Text style={styles.openHintText}>{item.type === 'video' ? 'Open video' : 'Open media'}</Text>
                </View>
              ) : null}
              {onRemove ? (
                <Pressable onPress={() => onRemove(item.id)} style={styles.removeButton}>
                  <Ionicons name="close" size={14} color={colors.text.inverse} />
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
        {mode === 'feed' && normalized.length > 1 ? (
          <Pressable style={styles.moreBadge} onPress={() => previewEnabled && setActiveIndex(0)}>
            <Text style={styles.moreBadgeText}>+{normalized.length - 1} more</Text>
          </Pressable>
        ) : null}
      </View>

      {previewEnabled && activeIndex !== null ? (
        <FullscreenMediaViewer
          items={normalized}
          activeIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
          onChangeIndex={setActiveIndex}
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
  itemShell: {
    position: 'relative',
  },
  mediaFrame: {
    width: '100%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[900],
    gap: spacing.xs,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    gap: spacing.xs,
  },
  videoOverlayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.inverse,
  },
  videoMeta: {
    fontSize: typography.fontSize.xs,
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
  moreBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  moreBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'space-between',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
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
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBody: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  viewerImage: {
    height: '100%',
  },
  viewerMediaFrame: {
    width: '100%',
    maxWidth: 960,
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  viewerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  viewerNavButton: {
    minWidth: 128,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  viewerNavButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  viewerNavText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.brand.white,
  },
  viewerNavTextDisabled: {
    color: colors.gray[500],
  },
});
