import { api } from '../api/client';
import { ApiResponse, Pagination } from '../types/api';
import { Post, CreatePostPayload, UpdatePostPayload, PostStatus } from '../types/post';

export interface GetPostsParams {
  status?: PostStatus;
  page?: number;
  limit?: number;
}

export const postService = {
  async getPosts(params: GetPostsParams = {}): Promise<{ posts: Post[]; pagination: Pagination }> {
    const res = await api.get<ApiResponse<{ posts: Post[]; pagination: Pagination }>>('/posts', { params });
    return res.data.data || { posts: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  async getPostById(id: string): Promise<Post> {
    const res = await api.get<ApiResponse<{ post: Post }>>(`/posts/${id}`);
    return res.data.data!.post;
  },

  async createPost(payload: CreatePostPayload): Promise<Post> {
    const res = await api.post<ApiResponse<{ post: Post }>>('/posts', payload);
    return res.data.data!.post;
  },

  async updatePost(id: string, payload: UpdatePostPayload): Promise<Post> {
    const res = await api.put<ApiResponse<{ post: Post }>>(`/posts/${id}`, payload);
    return res.data.data!.post;
  },

  async deletePost(id: string): Promise<void> {
    await api.delete<ApiResponse>(`/posts/${id}`);
  },

  async publishPost(id: string): Promise<Post> {
    const res = await api.post<ApiResponse<{ post: Post }>>(`/posts/${id}/publish`);
    return res.data.data!.post;
  },

  async getPostStatus(id: string): Promise<any> {
    const res = await api.get<ApiResponse<{ status: any }>>(`/posts/${id}/status`);
    return res.data.data!.status;
  },
};
