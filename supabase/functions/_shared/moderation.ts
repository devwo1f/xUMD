import { getEnv } from './env.ts';
import { HttpError } from './errors.ts';
import { moderateText } from './openai.ts';
import type { SubmitPostMediaInput } from './types.ts';

const BLOCKING_SAFE_SEARCH_LABELS = ['LIKELY', 'VERY_LIKELY'];

export async function moderateImage(base64Data: string) {
  const env = getEnv();
  if (!env.googleCloudVisionApiKey) {
    return {
      flagged: false,
      reasons: [] as string[],
    };
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${env.googleCloudVisionApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Data,
            },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
          },
        ],
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new HttpError(response.status, 'upstream_error', 'Vision moderation failed.', payload);
  }

  const annotation = payload.responses?.[0]?.safeSearchAnnotation ?? {};
  const reasons = Object.entries(annotation)
    .filter(([, value]) => BLOCKING_SAFE_SEARCH_LABELS.includes(String(value)))
    .map(([key]) => key);

  return {
    flagged: reasons.length > 0,
    reasons,
  };
}

export async function moderatePost(input: {
  contentText: string;
  media: SubmitPostMediaInput[];
}) {
  const textResult = await moderateText(input.contentText);
  const imageResults = await Promise.all(
    input.media
      .filter((item) => item.mimeType.startsWith('image/'))
      .map((item) => moderateImage(item.base64Data)),
  );

  const imageFlags = imageResults.flatMap((result) => result.reasons);
  const containsVideo = input.media.some((item) => item.mimeType.startsWith('video/'));

  return {
    isRejected: textResult.flagged || imageFlags.length > 0,
    moderationStatus:
      containsVideo && !textResult.flagged && imageFlags.length === 0
        ? 'pending'
        : textResult.flagged || imageFlags.length > 0
          ? 'rejected'
          : 'approved',
    summary: {
      textCategories: textResult.categories,
      imageFlags,
      videoReviewQueued: containsVideo,
    },
  } as const;
}