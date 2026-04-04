import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { PostMediaItem } from '../../../shared/types';

const MAX_MEDIA_ATTACHMENTS = 4;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_COMPRESS_QUALITY = 0.82;
const MAX_VIDEO_BYTES = 35 * 1024 * 1024;
const MAX_VIDEO_DURATION_MS = 90 * 1000;

function makeMediaId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getResizedDimensions(width: number, height: number) {
  const longestEdge = Math.max(width, height);
  if (!width || !height || longestEdge <= MAX_IMAGE_DIMENSION) {
    return null;
  }

  const scale = MAX_IMAGE_DIMENSION / longestEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

async function optimizeImage(asset: ImagePicker.ImagePickerAsset): Promise<PostMediaItem> {
  const resized = getResizedDimensions(asset.width, asset.height);
  const actions = resized ? [{ resize: resized }] : [];

  const result = await manipulateAsync(asset.uri, actions, {
    compress: IMAGE_COMPRESS_QUALITY,
    format: SaveFormat.JPEG,
  });

  return {
    id: makeMediaId('image'),
    uri: result.uri,
    type: 'image',
    mime_type: 'image/jpeg',
    width: result.width,
    height: result.height,
    file_size: asset.fileSize,
  };
}

function normalizeVideo(asset: ImagePicker.ImagePickerAsset): PostMediaItem {
  return {
    id: makeMediaId('video'),
    uri: asset.uri,
    type: 'video',
    mime_type: asset.mimeType ?? 'video/mp4',
    width: asset.width,
    height: asset.height,
    file_size: asset.fileSize,
    duration_ms: asset.duration ?? null,
  };
}

export function formatMediaSize(bytes?: number) {
  if (!bytes || Number.isNaN(bytes)) {
    return null;
  }

  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }

  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

export async function pickPostMedia() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return {
      items: [] as PostMediaItem[],
      warnings: ['Media library permission is required to attach images or videos.'],
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    orderedSelection: true,
    selectionLimit: MAX_MEDIA_ATTACHMENTS,
    quality: 0.9,
    videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
  });

  if (result.canceled) {
    return {
      items: [] as PostMediaItem[],
      warnings: [] as string[],
    };
  }

  const warnings: string[] = [];
  const items: PostMediaItem[] = [];

  for (const asset of result.assets) {
    if (asset.type === 'video') {
      if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
        warnings.push(`${asset.fileName ?? 'A video'} was skipped because it is larger than 35 MB.`);
        continue;
      }

      if (asset.duration && asset.duration > MAX_VIDEO_DURATION_MS) {
        warnings.push(`${asset.fileName ?? 'A video'} was skipped because it is longer than 90 seconds.`);
        continue;
      }

      items.push(normalizeVideo(asset));
      continue;
    }

    items.push(await optimizeImage(asset));
  }

  return { items, warnings };
}
