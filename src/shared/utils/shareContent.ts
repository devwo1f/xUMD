import { Platform, Share } from 'react-native';

export type ShareContentPayload = {
  title?: string;
  message: string;
  url?: string;
};

export type ShareContentResult = 'shared' | 'copied';

function buildCopyText(payload: ShareContentPayload) {
  if (payload.url && !payload.message.includes(payload.url)) {
    return `${payload.message}\n${payload.url}`;
  }

  return payload.message;
}

export async function shareContent(payload: ShareContentPayload): Promise<ShareContentResult> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const webNavigator = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
      clipboard?: {
        writeText?: (value: string) => Promise<void>;
      };
    };

    if (typeof webNavigator.share === 'function') {
      await webNavigator.share({
        title: payload.title,
        text: payload.message,
        url: payload.url,
      });
      return 'shared';
    }

    if (typeof webNavigator.clipboard?.writeText === 'function') {
      await webNavigator.clipboard.writeText(buildCopyText(payload));
      return 'copied';
    }
  }

  await Share.share({
    title: payload.title,
    message: payload.message,
    url: payload.url,
  });
  return 'shared';
}
