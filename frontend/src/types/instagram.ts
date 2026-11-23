export interface SocialAccount {
  id: string;
  platform: 'instagram' | 'youtube';
  platformUserId: string;
  username: string;
  accountType?: string | null;
  profilePicture?: string | null;
  createdAt: string;
  updatedAt?: string;
  tokenStatus?: {
    isExpired: boolean;
    isNearExpiry: boolean;
    expiresAt: string | null;
  } | null;
}

export interface InstagramProfile {
  platformUserId: string;
  username: string;
  accountType?: string | null;
  profilePicture?: string | null;
}
