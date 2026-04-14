export interface FeedCursorToken {
  score: number;
  postId: string;
}

export interface FeedAuthorSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  major: string | null;
  graduationYear: number | null;
  clubs: string[];
  courses: string[];
  followerCount: number;
  followingCount: number;
}

export interface FeedPostRecord {
  id: string;
  userId: string;
  clubId?: string | null;
  contentText: string;
  mediaUrls: string[];
  mediaType: 'none' | 'image' | 'video';
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isPinned?: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  author: FeedAuthorSummary;
}

export interface FeedItem extends FeedPostRecord {
  score: number;
  suggested: boolean;
  suggestedReason: string | null;
  socialProofCount: number;
  topicAffinity: number;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
  generatedAt: string;
  source: 'redis' | 'postgres' | 'recomputed';
}

export interface RecommendationItem {
  recommendedUserId: string;
  score: number;
  reason: string;
  profile: FeedAuthorSummary;
}

export interface TrendingHashtag {
  tag: string;
  score: number;
}

export interface TrendingSnapshot {
  posts: FeedItem[];
  hashtags: TrendingHashtag[];
  generatedAt: string;
}

export interface SubmitPostMediaInput {
  base64Data: string;
  fileName: string;
  mimeType: string;
  caption?: string;
}

export interface SubmitPostRequest {
  contentText: string;
  media?: SubmitPostMediaInput[];
}

export interface SubmitPostResponse {
  post: FeedPostRecord;
  moderationStatus: 'pending' | 'approved' | 'rejected';
}

export interface GetFeedRequest {
  limit?: number;
  cursor?: string | null;
  mode?: 'for_you' | 'following' | 'trending';
}

export interface GetRecommendationsRequest {
  limit?: number;
}
