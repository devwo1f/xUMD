import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured, supabaseConfigError } from './supabase';

export interface AvatarUploadAsset {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}

function buildFileName(userId: string) {
  return `${userId}/avatar-${Date.now()}.jpg`;
}

export async function pickAvatarAsset(): Promise<AvatarUploadAsset | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Please allow photo library access to choose a profile photo.');
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
    aspect: [1, 1],
    selectionLimit: 1,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? null,
  };
}

export async function uploadAvatarAsset(userId: string, asset: AvatarUploadAsset): Promise<string> {
  if (!isSupabaseConfigured) {
    return asset.uri;
  }

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 1080 } }],
    {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  const response = await fetch(manipulated.uri);
  const arrayBuffer = await response.arrayBuffer();
  const path = buildFileName(userId);

  const { error } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
    cacheControl: '3600',
  });

  if (error) {
    throw new Error(error.message || 'Unable to upload profile photo.');
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error('Unable to create profile photo URL.');
  }

  return data.publicUrl;
}

export async function clearAvatarForUser(userId: string) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const prefix = `${userId}/`;
  const { data, error } = await supabase.storage.from('avatars').list(prefix, {
    limit: 100,
  });

  if (error) {
    throw new Error(error.message || 'Unable to remove existing avatar.');
  }

  if (!data?.length) {
    return null;
  }

  const targets = data.map((entry) => `${prefix}${entry.name}`);
  await supabase.storage.from('avatars').remove(targets);
  return null;
}

export function assertSupabaseForUploads() {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError);
  }
}
