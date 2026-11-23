import { Post } from './post';

export interface DashboardOverview {
  totalAccounts: number;
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  failedPosts: number;
  recentPosts: Array<Partial<Post>>;
  upcomingScheduled: Array<Partial<Post>>;
}
