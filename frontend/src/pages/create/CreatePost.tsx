import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { instagramService } from '../../services/instagram.service';
import { youtubeService } from '../../services/youtube.service';
import { postService } from '../../services/post.service';
import { mediaService } from '../../services/media.service';
import { SocialAccount } from '../../types/instagram';
import { MediaType, PrivacyStatus } from '../../types/post';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../contexts/ToastContext';
import {
  Instagram,
  Youtube,
  Image as ImageIcon,
  Video,
  Send,
  Calendar,
  Save,
  Clock,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Film,
  Globe,
  Lock,
  EyeOff,
} from 'lucide-react';

export const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [mediaUrl, setMediaUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>('public');
  const [isShorts, setIsShorts] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(true);

  // Load target accounts and handle query params
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const [igData, ytData] = await Promise.all([
          instagramService.getAccounts().catch(() => []),
          youtubeService.getAccounts().catch(() => []),
        ]);
        const all = [...igData, ...ytData];
        setAccounts(all);
        if (all.length > 0) {
          setSelectedAccountId(all[0].id);
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      } finally {
        setFetchingAccounts(false);
      }
    };
    fetchAccounts();

    // If coming from media library with preselected mediaUrl
    const paramUrl = searchParams.get('mediaUrl');
    const paramType = searchParams.get('mediaType');
    if (paramUrl) {
      setMediaUrl(paramUrl);
      setLocalPreviewUrl(paramUrl);
      if (paramType === 'VIDEO') {
        setMediaType('VIDEO');
      } else {
        setMediaType('IMAGE');
      }
    }
  }, [searchParams]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const isYouTube = selectedAccount?.platform === 'youtube';

  // Automatically switch to VIDEO if YouTube is selected and mediaType is IMAGE
  useEffect(() => {
    if (isYouTube && mediaType === 'IMAGE') {
      setMediaType('VIDEO');
    }
  }, [isYouTube, mediaType]);

  // Handle file selection (drag & drop or input)
  const handleProcessFile = async (file: File) => {
    setUploadError(null);

    // Validate type
    const isVid = file.type.startsWith('video/');
    const isImg = file.type.startsWith('image/');

    if (isYouTube && !isVid) {
      setUploadError('YouTube hanya mendukung format file video (MP4, MOV).');
      return;
    }

    if (!isVid && !isImg) {
      setUploadError('Format file tidak didukung. Harap pilih gambar (JPG, PNG, WEBP) atau video (MP4, MOV).');
      return;
    }

    // Size limit
    if (isImg && file.size > 25 * 1024 * 1024) {
      setUploadError('Ukuran gambar maksimal adalah 25MB.');
      return;
    }
    if (isVid && file.size > 100 * 1024 * 1024) {
      setUploadError('Ukuran video maksimal adalah 100MB.');
      return;
    }

    setSelectedFile(file);

    // Update media type
    if (isVid) {
      setMediaType(isShorts ? 'SHORTS' : 'VIDEO');
    } else {
      setMediaType('IMAGE');
    }

    // Local instant preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);

    // Upload to server
    setIsUploading(true);
    try {
      const uploaded = await mediaService.uploadMedia(file);
      if (uploaded.data?.url) {
        setMediaUrl(uploaded.data.url);
      }
      success('File media berhasil diunggah ke server!');
    } catch (err: any) {
      console.error('File upload error:', err);
      const msg = err.response?.data?.message || 'Gagal mengunggah file ke server.';
      setUploadError(msg);
      toastError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMediaUrl('');
    setLocalPreviewUrl('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Validation
  const validateForm = () => {
    if (!selectedAccountId) {
      toastError('Silakan hubungkan dan pilih akun media sosial terlebih dahulu.');
      return false;
    }
    if (isYouTube) {
      if (!title.trim()) {
        toastError('Judul video YouTube wajib diisi (maksimal 100 karakter).');
        return false;
      }
      if (mediaType === 'IMAGE') {
        toastError('YouTube hanya mendukung upload video (MP4, MOV).');
        return false;
      }
    }
    if (!mediaUrl) {
      toastError('Silakan pilih file foto atau video terlebih dahulu.');
      return false;
    }
    if (!isYouTube && caption.length > 2200) {
      toastError('Caption melebihi batas Meta maksimum 2.200 karakter.');
      return false;
    }
    if (isYouTube && caption.length > 5000) {
      toastError('Deskripsi video melebihi batas YouTube 5.000 karakter.');
      return false;
    }
    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        toastError('Silakan tentukan tanggal dan jam publikasi.');
        return false;
      }
      const targetTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (targetTime <= new Date()) {
        toastError('Jadwal publikasi harus berada di waktu masa depan.');
        return false;
      }
    }
    return true;
  };

  // 1. Save Draft
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await postService.createPost({
        socialAccountId: selectedAccountId,
        title: isYouTube ? title.trim() : undefined,
        caption: caption.trim() || undefined,
        mediaType,
        mediaUrl: mediaUrl.trim(),
        privacyStatus: isYouTube ? privacyStatus : undefined,
      });
      success('Postingan berhasil disimpan sebagai draft!');
      navigate('/posts');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Gagal menyimpan draft.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Schedule Post
  const handleSchedulePost = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      await postService.createPost({
        socialAccountId: selectedAccountId,
        title: isYouTube ? title.trim() : undefined,
        caption: caption.trim() || undefined,
        mediaType,
        mediaUrl: mediaUrl.trim(),
        privacyStatus: isYouTube ? privacyStatus : undefined,
        scheduledAt,
      });
      success('Postingan berhasil dijadwalkan! Scheduler backend akan memproses secara otomatis.');
      navigate('/planner');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Gagal menjadwalkan postingan.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Publish Now
  const handlePublishNow = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const post = await postService.createPost({
        socialAccountId: selectedAccountId,
        title: isYouTube ? title.trim() : undefined,
        caption: caption.trim() || undefined,
        mediaType,
        mediaUrl: mediaUrl.trim(),
        privacyStatus: isYouTube ? privacyStatus : undefined,
      });

      await postService.publishPost(post.id);
      success(isYouTube ? 'Video berhasil dipublikasikan ke YouTube!' : 'Postingan berhasil dipublikasikan ke Instagram feed!');
      navigate('/posts');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Publikasi gagal. Periksa status log postingan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Buat & Jadwalkan Postingan</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Pilih file foto atau video dari perangkat Anda, atur detail postingan, lalu jadwalkan atau publikasikan langsung ke Instagram atau YouTube.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Composer Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Post Composer</span>
                {isYouTube ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                    <Youtube className="w-3.5 h-3.5" /> YouTube
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-pink-100 text-pink-700">
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {isYouTube
                  ? 'Unggah video untuk YouTube Channel atau YouTube Shorts'
                  : 'Unggah file foto atau video reels dan atur detail postingan Instagram'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target Account */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Akun Media Sosial
                </label>
                {fetchingAccounts ? (
                  <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ) : accounts.length === 0 ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
                    <span>Belum ada akun sosial yang terhubung.</span>
                    <Button variant="outline" size="sm" onClick={() => navigate('/accounts')}>
                      Hubungkan Akun
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    options={accounts.map((a) => ({
                      value: a.id,
                      label: a.platform === 'youtube'
                        ? `📺 ${a.username} (YouTube Channel)`
                        : `📷 @${a.username} (Instagram Business)`,
                    }))}
                  />
                )}
              </div>

              {/* YouTube Specific Fields */}
              {isYouTube && (
                <div className="space-y-4 p-4 bg-red-50/40 rounded-xl border border-red-100">
                  {/* Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider">
                        Judul Video YouTube *
                      </label>
                      <span className={`text-[11px] font-mono ${title.length > 100 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                        {title.length} / 100
                      </span>
                    </div>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      placeholder="Masukkan judul video YouTube yang menarik..."
                    />
                  </div>

                  {/* Shorts Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-red-600" /> Publikasikan sebagai YouTube Shorts
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Video vertikal 9:16 (durasi ≤ 60 detik). Tag #Shorts akan otomatis ditambahkan ke deskripsi.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isShorts}
                      onChange={(e) => {
                        setIsShorts(e.target.checked);
                        setMediaType(e.target.checked ? 'SHORTS' : 'VIDEO');
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </div>

                  {/* Privacy Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                      Status Privasi Video
                    </label>
                    <Select
                      value={privacyStatus}
                      onChange={(e) => setPrivacyStatus(e.target.value as PrivacyStatus)}
                      options={[
                        { value: 'public', label: '🌐 Public (Dapat ditonton semua orang di YouTube)' },
                        { value: 'unlisted', label: '🔗 Unlisted (Hanya orang yang memiliki link)' },
                        { value: 'private', label: '🔒 Private (Hanya Anda yang dapat melihat)' },
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Direct Media File Upload Zone */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {isYouTube ? 'File Video (MP4 / MOV)' : 'File Media (Foto / Video)'}
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    {isYouTube
                      ? 'Format MP4, MOV (maks. 100MB)'
                      : 'JPG, PNG, WEBP (maks. 25MB) • MP4, MOV (maks. 38MB)'}
                  </span>
                </div>

                {/* Hidden input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={isYouTube ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime'}
                  className="hidden"
                />

                {!selectedFile && !mediaUrl ? (
                  /* Dropzone */
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/80 bg-slate-50/40'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Klik untuk memilih file atau seret file ke sini
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isYouTube
                          ? 'Pilih video MP4 atau Shorts dari komputer Anda'
                          : 'Foto single image atau Video Reels dari komputer Anda'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Selected File Box */
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          {mediaType === 'IMAGE' ? <ImageIcon className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {selectedFile ? selectedFile.name : mediaUrl.split('/').pop()}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • ` : ''}
                            Tipe: {mediaType}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          title="Ganti file"
                          className="text-xs text-slate-600 hover:text-blue-600"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Ganti
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          title="Hapus file"
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Upload progress or ready indicator */}
                    {isUploading ? (
                      <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200/80 p-2.5 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Mengunggah file media ke server...</span>
                      </div>
                    ) : uploadError ? (
                      <div className="flex items-center justify-between gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                        {selectedFile && (
                          <button
                            type="button"
                            onClick={() => handleProcessFile(selectedFile)}
                            className="text-xs font-semibold underline text-rose-800 hover:text-rose-900"
                          >
                            Coba Lagi
                          </button>
                        )}
                      </div>
                    ) : mediaUrl ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                        <FileCheck2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>
                          {isYouTube
                            ? 'Video tersimpan & siap diunggah ke YouTube Channel'
                            : 'Media tersimpan & siap dipublikasikan ke Meta Instagram'}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Caption / Description Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {isYouTube ? 'Deskripsi Video (Description)' : 'Caption'}
                  </label>
                  <span className={`text-[11px] font-mono ${caption.length > (isYouTube ? 5000 : 2200) ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                    {caption.length} / {isYouTube ? 5000 : 2200}
                  </span>
                </div>
                <textarea
                  rows={isYouTube ? 5 : 4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    isYouTube
                      ? 'Tulis deskripsi video YouTube, sertakan link, informasi konten, dan hashtag #Shorts jika ingin dibuat shorts...'
                      : 'Tulis caption menarik, sertakan hashtag #automation #marketing...'
                  }
                  className="w-full bg-white rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-none"
                />
              </div>

              {/* Scheduling Options */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Jadwalkan untuk publikasi otomatis nanti
                  </span>
                </label>

                {isScheduled && (
                  <div className="grid grid-cols-2 gap-3 mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 animate-in fade-in duration-150">
                    <Input
                      label="Tanggal"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                      label="Jam"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={handleSaveDraft}
              disabled={loading || isUploading}
              icon={<Save className="w-4 h-4" />}
            >
              Simpan Draft
            </Button>

            {isScheduled ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleSchedulePost}
                loading={loading}
                disabled={isUploading}
                icon={<Calendar className="w-4 h-4" />}
              >
                Jadwalkan Postingan
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handlePublishNow}
                loading={loading}
                disabled={isUploading}
                className={isYouTube ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}
                icon={<Send className="w-4 h-4" />}
              >
                Publikasikan Sekarang
              </Button>
            )}
          </div>
        </div>

        {/* Right: Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3 sticky top-20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isYouTube ? 'YouTube Player Mockup Preview' : 'Instagram Feed Mockup Preview'}
          </div>

          {isYouTube ? (
            /* YouTube Mockup Preview */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-sm mx-auto">
              {/* Video Player Box */}
              <div className={`${isShorts ? 'aspect-[9/16]' : 'aspect-video'} bg-black flex items-center justify-center overflow-hidden relative`}>
                {localPreviewUrl ? (
                  <video
                    src={localPreviewUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500 p-6 text-center">
                    <Video className="w-8 h-8 opacity-40 text-red-500" />
                    <span className="text-xs font-medium">Pilih file video untuk melihat preview</span>
                  </div>
                )}
              </div>

              {/* YouTube Video Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                    {title || '(Judul Video YouTube Anda)'}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 uppercase shrink-0">
                    {privacyStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 pt-1 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedAccount?.username || 'YouTube Channel'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isShorts ? 'YouTube Shorts' : 'Standard Video'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                  {caption || '(Deskripsi video akan tampil di sini)'}
                </div>

                {isScheduled && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Jadwal: {scheduledDate || 'Tanggal'} jam {scheduledTime || 'Waktu'}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Instagram Mockup Preview */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-sm mx-auto">
              <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[1.5px]">
                    <div className="w-full h-full bg-white rounded-full p-[1px] flex items-center justify-center">
                      <Instagram className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {selectedAccount?.username || 'akun_instagram'}
                  </span>
                </div>
                <span className="text-slate-400 text-xs">•••</span>
              </div>

              <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                {localPreviewUrl ? (
                  mediaType === 'IMAGE' ? (
                    <img
                      src={localPreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <video
                      src={localPreviewUrl}
                      controls
                      autoPlay
                      muted
                      loop
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 p-6 text-center">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span className="text-xs font-medium">
                      Pilih file foto atau video untuk melihat preview
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3.5 space-y-2">
                <div className="flex items-center gap-3 text-slate-700">
                  <span className="text-sm font-bold">♥</span>
                  <span className="text-sm">💬</span>
                  <span className="text-sm">↗</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                  <span className="font-bold mr-1.5">
                    {selectedAccount?.username || 'akun_instagram'}
                  </span>
                  {caption || '(Caption postingan akan tampil di sini)'}
                </p>
                {isScheduled && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-blue-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Jadwal: {scheduledDate || 'Tanggal'} jam {scheduledTime || 'Waktu'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
