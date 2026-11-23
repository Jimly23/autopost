import { api } from '../api/client';
import { ApiResponse } from '../types/api';
import { DashboardOverview } from '../types/dashboard';

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const res = await api.get<ApiResponse<{ overview: DashboardOverview }>>('/dashboard/overview');
    return res.data.data!.overview;
  },
};
