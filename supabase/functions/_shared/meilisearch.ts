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

async function searchDocuments<T>(indexName: string, query: string, limit = 8) {
  const env = getEnv();
  if (!env.meiliSearchHost || !env.meiliSearchApiKey || !query.trim()) {
    return [] as T[];
  }

  const response = await fetch(
    `${env.meiliSearchHost.replace(/\/$/, '')}/indexes/${indexName}/search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.meiliSearchApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        limit,
      }),
    },
  );

  if (!response.ok) {
    return [] as T[];
  }

  const payload = (await response.json()) as { hits?: T[] };
  return payload.hits ?? [];
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

export async function syncCampusEventToMeilisearch(event: {
  id: string;
  title: string;
  description: string;
  location_name: string;
  category: string;
  tags: string[];
  starts_at: string;
  latitude: number;
  longitude: number;
}) {
  await upsertDocuments('campus_events', [
    {
      id: event.id,
      title: event.title,
      description: event.description,
      location_name: event.location_name,
      category: event.category,
      tags: event.tags,
      starts_at: event.starts_at,
      latitude: event.latitude,
      longitude: event.longitude,
    },
  ]);
}

export async function syncCampusLocationToMeilisearch(location: {
  id: string;
  name: string;
  short_name: string;
  building_type: string;
  latitude: number;
  longitude: number;
}) {
  await upsertDocuments('campus_locations', [
    {
      id: location.id,
      name: location.name,
      short_name: location.short_name,
      building_type: location.building_type,
      latitude: location.latitude,
      longitude: location.longitude,
    },
  ]);
}

export async function searchMeilisearch<T>(indexName: string, query: string, limit = 8) {
  return searchDocuments<T>(indexName, query, limit);
}
