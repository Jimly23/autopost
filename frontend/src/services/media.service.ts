import { api } from '@/api/client';
import { ApiResponse } from '@/types/api';
import { UploadedMedia } from '@/types/media';

export const mediaService = {
  async uploadMedia(file: File): Promise<ApiResponse<UploadedMedia>> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post<ApiResponse<UploadedMedia>>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getUploadedMedia(): Promise<ApiResponse<UploadedMedia[]>> {
    const res = await api.get<ApiResponse<UploadedMedia[]>>('/media');
    return res.data;
  },
};
