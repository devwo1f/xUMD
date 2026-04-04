import { handleOptions, parseJsonBody, jsonResponse, errorResponse } from '../_shared/http.ts';
import { syncPostToMeilisearch } from '../_shared/meilisearch.ts';
import { moderatePost } from '../_shared/moderation.ts';
import { embedText } from '../_shared/openai.ts';
import { fetchUsersByIds } from '../_shared/records.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';
import type {
  FeedAuthorSummary,
  SubmitPostMediaInput,
  SubmitPostRequest,
} from '../_shared/types.ts';
import { getRedis } from '../_shared/upstash.ts';

const MAX_POST_LENGTH = 500;
const MAX_MEDIA_COUNT = 4;

function decodeBase64(input: string) {
  const binary = atob(input);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function normalizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
}

function inferMediaType(media: SubmitPostMediaInput[]) {
  if (media.length === 0) {
    return 'none' as const;
  }

  return media.some((item) => item.mimeType.startsWith('video/')) ? 'video' as const : 'image' as const;
}

function extractHashtags(contentText: string) {
  const matches = contentText.match(/#[a-z0-9_]+/gi) ?? [];
  return Array.from(new Set(matches.map((tag) => tag.slice(1).toLowerCase()))).slice(0, 20);
}

async function signStoredMediaUrls(
  adminClient: Awaited<ReturnType<typeof requireAuthenticatedUser>>['adminClient'],
  mediaPaths: string[],
) {
  if (mediaPaths.length === 0) {
    return mediaPaths;
  }

  const { data, error } = await adminClient.storage.from('social-media').createSignedUrls(mediaPaths, 60 * 60);
  if (error) {
    throw error;
  }

  const signedByPath = new Map((data ?? []).map((entry) => [entry.path, entry.signedUrl ?? entry.path]));
  return mediaPaths.map((path) => signedByPath.get(path) ?? path);
}

async function buildResponsePost(input: {
  adminClient: Awaited<ReturnType<typeof requireAuthenticatedUser>>['adminClient'];
  userId: string;
  postId: string;
  contentText: string;
  hashtags: string[];
  mediaPaths: string[];
  mediaType: 'none' | 'image' | 'video';
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}) {
  const usersById = await fetchUsersByIds(input.adminClient, [input.userId]);
  const author = usersById.get(input.userId);

  if (!author) {
    throw new Error('Unable to resolve the author for this post.');
  }

  const mediaUrls = await signStoredMediaUrls(input.adminClient, input.mediaPaths);

  return {
    id: input.postId,
    userId: input.userId,
    contentText: input.contentText,
    mediaUrls,
    mediaType: input.mediaType,
    hashtags: input.hashtags,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    moderationStatus: input.moderationStatus,
    createdAt: input.createdAt,
    author: author as FeedAuthorSummary,
  };
}

async function invalidateFreshFeedCaches(input: {
  adminClient: Awaited<ReturnType<typeof requireAuthenticatedUser>>['adminClient'];
  authorId: string;
}) {
  const { data: followerRows, error } = await input.adminClient
    .from('follows')
    .select('follower_id')
    .eq('following_id', input.authorId);

  if (error) {
    throw error;
  }

  const recipientIds = Array.from(
    new Set([input.authorId, ...(followerRows ?? []).map((row: { follower_id: string }) => row.follower_id)]),
  );

  if (recipientIds.length === 0) {
    return;
  }

  const { error: deleteError } = await input.adminClient
    .from('feed_cache')
    .delete()
    .in('user_id', recipientIds);

  if (deleteError) {
    throw deleteError;
  }

  const redis = getRedis();
  if (!redis) {
    return;
  }

  await Promise.all(
    recipientIds.flatMap((recipientId) => [
      redis.del(`feed:${recipientId}`),
      redis.del(`feedmeta:${recipientId}`),
    ]),
  );
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<SubmitPostRequest>(request);
    const contentText = body.contentText?.trim() ?? '';
    const media = body.media ?? [];

    if (!contentText && media.length === 0) {
      throw new Error('A post needs text, media, or both.');
    }

    if (contentText.length > MAX_POST_LENGTH) {
      throw new Error(`Posts must be ${MAX_POST_LENGTH} characters or fewer.`);
    }

    if (media.length > MAX_MEDIA_COUNT) {
      throw new Error(`You can attach up to ${MAX_MEDIA_COUNT} files.`);
    }

    const moderation = await moderatePost({ contentText, media });
    const postId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const mediaPaths: string[] = [];
    const hashtags = extractHashtags(contentText);
    const mediaType = inferMediaType(media);

    for (let index = 0; index < media.length; index += 1) {
      const item = media[index];
      const extension = normalizeFileName(item.fileName).split('.').pop() ?? 'bin';
      const path = `${userId}/${postId}/${String(index + 1).padStart(2, '0')}.${extension}`;

      const { error } = await adminClient.storage
        .from('social-media')
        .upload(path, decodeBase64(item.base64Data), {
          contentType: item.mimeType,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      mediaPaths.push(path);
    }

    const { error: postError } = await adminClient.from('posts').insert({
      id: postId,
      user_id: userId,
      content_text: contentText,
      media_urls: mediaPaths,
      media_type: mediaType,
      hashtags,
      moderation_status: moderation.moderationStatus,
      created_at: createdAt,
    });

    if (postError) {
      throw postError;
    }

    if (contentText && moderation.moderationStatus !== 'rejected') {
      try {
        const embedding = await embedText(contentText);
        if (embedding) {
          await adminClient.from('post_embeddings').insert({
            post_id: postId,
            embedding: `[${embedding.join(',')}]`,
          });
        }
      } catch (error) {
        console.error('submit-post embedding step failed', error);
      }
    }

    const post = await buildResponsePost({
      adminClient,
      userId,
      postId,
      contentText,
      hashtags,
      mediaPaths,
      mediaType,
      moderationStatus: moderation.moderationStatus,
      createdAt,
    });

    if (moderation.moderationStatus === 'approved') {
      try {
        await Promise.all([
          syncPostToMeilisearch(post),
          invalidateFreshFeedCaches({ adminClient, authorId: userId }),
        ]);
      } catch (error) {
        console.error('submit-post follow-up sync failed', error);
      }
    }

    return jsonResponse({
      post,
      moderationStatus: moderation.moderationStatus,
      moderationSummary: moderation.summary,
    });
  } catch (error) {
    return errorResponse(error);
  }
});