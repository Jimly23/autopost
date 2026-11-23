import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaService } from '../../services/media.service';
import { postService } from '../../services/post.service';
import { UploadedMedia } from '../../types/media';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import {
  Image as ImageIcon,
  UploadCloud,
  ExternalLink,
  Film,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const MediaLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [mediaItems, setMediaItems] = useState<UploadedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      // Fetch directly uploaded files
      const uploadRes = await mediaService.getUploadedMedia().catch(() => ({ success: true, data: [] }));
      const uploadedList = uploadRes.data || [];

      // Also get any historical post media
      const postRes = await postService.getPosts({ limit: 50 }).catch(() => ({ posts: [] }));
      const knownUrls = new Set(uploadedList.map((m) => m.url));

      postRes.posts?.forEach((p) => {
        if (p.mediaUrl && !knownUrls.has(p.mediaUrl)) {
          knownUrls.add(p.mediaUrl);
          uploadedList.push({
            url: p.mediaUrl,
            filename: p.mediaUrl.split('/').pop() || 'post-media',
            originalName: p.mediaUrl.split('/').pop() || 'post-media',
            mimetype: p.mediaType === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
            mediaType: p.mediaType === 'IMAGE' ? 'IMAGE' : 'VIDEO',
            size: 0,
            createdAt: p.createdAt,
          });
        }
      });

      setMediaItems(uploadedList);
    } catch (err) {
      console.error('Failed to load media assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toastError('Format file tidak didukung. Harap pilih gambar atau video.');
      return;
    }

    setUploading(true);
    try {
      const res = await mediaService.uploadMedia(file);
      if (res.success && res.data) {
        success('Media berhasil diunggah ke perpustakaan!');
        fetchMedia();
      } else {
        throw new Error(res.message || 'Gagal mengunggah media');
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Gagal mengunggah media.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreatePostWithMedia = (item: UploadedMedia) => {
    navigate(`/create?mediaUrl=${encodeURIComponent(item.url)}&mediaType=${item.mediaType}`);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Media Library</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Koleksi file foto dan video yang diunggah untuk materi publikasi Instagram Anda.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadFile}
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            className="hidden"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
            icon={<UploadCloud className="w-4 h-4" />}
          >
            Upload Media Baru
          </Button>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
        </div>
      ) : mediaItems.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-8 h-8 text-slate-400" />}
          title="Belum ada file media"
          description="Unggah file foto atau video dari perangkat Anda untuk mulai mempublikasikan konten ke Instagram."
          actionLabel="Upload Media Sekarang"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mediaItems.map((item, idx) => (
            <Card key={idx} hover className="overflow-hidden group flex flex-col justify-between">
              <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {item.mediaType === 'IMAGE' ? (
                  <img
                    src={item.url}
                    alt={item.originalName || 'Asset'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-1.5 p-4 text-center">
                    <Film className="w-8 h-8 text-blue-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Video Reels</span>
                  </div>
                )}

                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 shadow-xs backdrop-blur-xs flex items-center gap-1">
                    {item.mediaType === 'VIDEO' ? (
                      <Film className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ImageIcon className="w-3 h-3 text-slate-600" />
                    )}
                    {item.mediaType}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white flex items-center justify-between border-t border-slate-100">
                <div className="overflow-hidden pr-2">
                  <p className="text-[11px] font-medium text-slate-800 truncate" title={item.originalName || item.filename}>
                    {item.originalName || item.filename}
                  </p>
                  {item.size > 0 && (
                    <p className="text-[10px] text-slate-400">{formatFileSize(item.size)}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                    title="Buka file media"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreatePostWithMedia(item)}
                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50"
                    title="Gunakan untuk membuat postingan"
                  >
                    Gunakan
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
