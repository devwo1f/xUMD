import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { PostMediaItem } from '../../../shared/types';

const MAX_MEDIA_ATTACHMENTS = 4;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_COMPRESS_QUALITY = 0.82;
const MAX_VIDEO_BYTES = 35 * 1024 * 1024;
const MAX_VIDEO_DURATION_MS = 90 * 1000;

export interface PreparedPostMediaUpload {
  base64Data: string;
  fileName: string;
  mimeType: string;
}

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

function inferExtension(mimeType?: string | null, fallback: 'jpg' | 'mp4' = 'jpg') {
  if (!mimeType) {
    return fallback;
  }

  const normalized = mimeType.split('/')[1]?.toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (normalized === 'jpeg') {
    return 'jpg';
  }

  return normalized;
}

function inferFileName(item: PostMediaItem, index: number) {
  if (item.file_name) {
    return item.file_name;
  }

  const lastSegment = item.uri.split('/').pop();
  if (lastSegment && lastSegment.includes('.')) {
    return lastSegment;
  }

  const extension = inferExtension(item.mime_type, item.type === 'video' ? 'mp4' : 'jpg');
  return `${item.type}-${index + 1}.${extension}`;
}

async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read media for upload.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to convert media for upload.'));
        return;
      }

      const commaIndex = reader.result.indexOf(',');
      resolve(commaIndex >= 0 ? reader.result.slice(commaIndex + 1) : reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

async function readUriAsBase64(uri: string) {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Unable to prepare media for upload.');
  }

  const blob = await response.blob();
  return blobToBase64(blob);
}

async function optimizeImage(asset: ImagePicker.ImagePickerAsset): Promise<PostMediaItem> {
  const resized = getResizedDimensions(asset.width, asset.height);
  const actions = resized ? [{ resize: resized }] : [];

  const result = await manipulateAsync(asset.uri, actions, {
    compress: IMAGE_COMPRESS_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });

  return {
    id: makeMediaId('image'),
    uri: result.uri,
    type: 'image',
    mime_type: 'image/jpeg',
    file_name: asset.fileName ?? `image-${Date.now()}.jpg`,
    width: result.width,
    height: result.height,
    file_size: asset.fileSize,
    base64_data: result.base64 ?? null,
  };
}

function normalizeVideo(asset: ImagePicker.ImagePickerAsset): PostMediaItem {
  return {
    id: makeMediaId('video'),
    uri: asset.uri,
    type: 'video',
    mime_type: asset.mimeType ?? 'video/mp4',
    file_name: asset.fileName ?? `video-${Date.now()}.${inferExtension(asset.mimeType, 'mp4')}`,
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

export async function preparePostMediaForUpload(items: PostMediaItem[]) {
  const uploads: PreparedPostMediaUpload[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const mimeType = item.mime_type ?? (item.type === 'video' ? 'video/mp4' : 'image/jpeg');
    const base64Data = item.base64_data ?? await readUriAsBase64(item.uri);

    uploads.push({
      base64Data,
      fileName: inferFileName(item, index),
      mimeType,
    });
  }

  return uploads;
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
