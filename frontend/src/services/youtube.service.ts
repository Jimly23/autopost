import { api } from '../api/client';
import { ApiResponse } from '../types/api';
import { SocialAccount } from '../types/instagram';

export const youtubeService = {
  getConnectUrl(): string {
    return '/api/youtube/connect';
  },

  async getAccounts(): Promise<SocialAccount[]> {
    const res = await api.get<ApiResponse<{ accounts: SocialAccount[] }>>('/youtube/accounts');
    return res.data.data?.accounts || [];
  },

  async disconnectAccount(id: string): Promise<void> {
    await api.delete<ApiResponse>(`/youtube/accounts/${id}`);
  },
};
