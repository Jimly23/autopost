import { api } from '../api/client';
import { ApiResponse } from '../types/api';
import { SocialAccount, InstagramProfile } from '../types/instagram';

export const instagramService = {
  // Returns redirect URL or triggers direct navigation
  getConnectUrl(): string {
    return '/api/instagram/connect';
  },

  async getAccounts(): Promise<SocialAccount[]> {
    const res = await api.get<ApiResponse<{ accounts: SocialAccount[] }>>('/instagram/accounts');
    return res.data.data?.accounts || [];
  },

  async getAccount(id: string): Promise<SocialAccount> {
    const res = await api.get<ApiResponse<{ account: SocialAccount }>>(`/instagram/accounts/${id}`);
    return res.data.data!.account;
  },

  async disconnectAccount(id: string): Promise<void> {
    await api.delete<ApiResponse>(`/instagram/accounts/${id}`);
  },

  async getLiveProfile(id: string): Promise<InstagramProfile> {
    const res = await api.get<ApiResponse<{ profile: InstagramProfile }>>(`/instagram/accounts/${id}/profile`);
    return res.data.data!.profile;
  },
};
