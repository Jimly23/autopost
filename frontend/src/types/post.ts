export type PostStatus = 'draft' | 'scheduled' | 'processing' | 'published' | 'failed' | 'cancelled';
export type MediaType = 'IMAGE' | 'VIDEO';

export interface Post {
  id: string;
  userId: string;
  socialAccountId: string;
  caption?: string | null;
  mediaType: MediaType;
  mediaUrl: string;
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
  caption?: string;
  mediaType: MediaType;
  mediaUrl: string;
  scheduledAt?: string;
}

export interface UpdatePostPayload {
  socialAccountId?: string;
  caption?: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  scheduledAt?: string | null;
}
