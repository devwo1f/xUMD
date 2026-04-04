import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

export default function PostMediaGallery({
  post,
  mediaItems,
  mode = 'feed',
  onRemove,
}: PostMediaGalleryProps) {
  const normalized = normalizeMedia(post, mediaItems);

  if (normalized.length === 0) {
    return null;
  }

  const visibleItems = mode === 'feed' ? normalized.slice(0, 1) : normalized;

  return (
    <View style={[styles.container, mode === 'composer' && styles.composerContainer]}>
      {visibleItems.map((item) => (
        <View key={item.id} style={styles.itemShell}>
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
          {onRemove ? (
            <Pressable onPress={() => onRemove(item.id)} style={styles.removeButton}>
              <Ionicons name="close" size={14} color={colors.text.inverse} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {mode === 'feed' && normalized.length > 1 ? (
        <View style={styles.moreBadge}>
          <Text style={styles.moreBadgeText}>+{normalized.length - 1} more</Text>
        </View>
      ) : null}
    </View>
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
});
