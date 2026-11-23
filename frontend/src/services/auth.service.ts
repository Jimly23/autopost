import { api } from '../api/client';
import { ApiResponse } from '../types/api';
import { User, RegisterPayload, LoginPayload, UpdateProfilePayload, ChangePasswordPayload } from '../types/auth';

export const authService = {
  async register(payload: RegisterPayload): Promise<User> {
    const res = await api.post<ApiResponse<{ user: User }>>('/auth/register', payload);
    return res.data.data!.user;
  },

  async login(payload: LoginPayload): Promise<User> {
    const res = await api.post<ApiResponse<{ user: User }>>('/auth/login', payload);
    return res.data.data!.user;
  },

  async logout(): Promise<void> {
    await api.post<ApiResponse>('/auth/logout');
  },

  async getMe(): Promise<User> {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data!.user;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await api.put<ApiResponse<{ user: User }>>('/auth/profile', payload);
    return res.data.data!.user;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.put<ApiResponse>('/auth/password', payload);
  },
};
