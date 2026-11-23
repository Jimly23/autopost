export interface UploadedMedia {
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  mediaType: 'IMAGE' | 'VIDEO';
  size: number;
  createdAt?: string;
}
