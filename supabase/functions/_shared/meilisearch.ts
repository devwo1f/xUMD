import { getEnv } from './env.ts';
import type { FeedAuthorSummary, FeedPostRecord } from './types.ts';

async function upsertDocuments(indexName: string, documents: unknown[]) {
  const env = getEnv();
  if (!env.meiliSearchHost || !env.meiliSearchApiKey || documents.length === 0) {
    return;
  }

  await fetch(`${env.meiliSearchHost.replace(/\/$/, '')}/indexes/${indexName}/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.meiliSearchApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documents),
  });
}

export async function syncUserToMeilisearch(profile: FeedAuthorSummary) {
  await upsertDocuments('users', [
    {
      id: profile.id,
      username: profile.username,
      display_name: profile.displayName,
      bio: profile.bio,
      major: profile.major,
      clubs: profile.clubs,
      courses: profile.courses,
      follower_count: profile.followerCount,
    },
  ]);
}

export async function syncPostToMeilisearch(post: FeedPostRecord) {
  await upsertDocuments('posts', [
    {
      id: post.id,
      user_id: post.userId,
      username: post.author.username,
      display_name: post.author.displayName,
      content_text: post.contentText,
      hashtags: post.hashtags,
      created_at: post.createdAt,
      like_count: post.likeCount,
      comment_count: post.commentCount,
      share_count: post.shareCount,
    },
  ]);
}