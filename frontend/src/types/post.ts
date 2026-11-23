export type PostStatus = 'draft' | 'scheduled' | 'processing' | 'published' | 'failed' | 'cancelled';
export type MediaType = 'IMAGE' | 'VIDEO' | 'REELS' | 'SHORTS';
export type PrivacyStatus = 'public' | 'unlisted' | 'private';

export interface Post {
  id: string;
  userId: string;
  socialAccountId: string;
  title?: string | null;
  caption?: string | null;
  mediaType: MediaType;
  mediaUrl: string;
  privacyStatus?: PrivacyStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  status: PostStatus;
  platformPostId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  socialAccount?: {
    id: string;
    username: string;
    platform: string;
  };
  publishingLogs?: PublishingLog[];
}

export interface PublishingLog {
  id?: string;
  action: string;
  status: string;
  responseData?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface CreatePostPayload {
  socialAccountId: string;
  title?: string;
  caption?: string;
  mediaType: MediaType;
  mediaUrl: string;
  privacyStatus?: PrivacyStatus;
  scheduledAt?: string;
}

export interface UpdatePostPayload {
  socialAccountId?: string;
  title?: string;
  caption?: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  privacyStatus?: PrivacyStatus;
  scheduledAt?: string | null;
}
