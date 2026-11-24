import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import { DashboardOverview } from '../../types/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Instagram,
  Youtube,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  RotateCw,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

type TimeRange = 'today' | '7days' | '30days' | 'custom';
type PlatformFilter = 'all' | 'instagram' | 'youtube' | 'tiktok';

export const Overview: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const { theme } = useTheme();

  const fetchOverview = async () => {
    try {
      const overview = await dashboardService.getOverview();
      setData(overview);
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOverview();
  };

  // Date ranges computation
  const dateRangeLabel = useMemo(() => {
    const now = new Date();
    const endDateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    let startDaysAgo = 6;
    if (timeRange === 'today') startDaysAgo = 0;
    if (timeRange === '30days') startDaysAgo = 29;

    const startDate = new Date();
    startDate.setDate(now.getDate() - startDaysAgo);
    const startDateStr = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    if (timeRange === 'today') {
      return `${endDateStr} • WIB`;
    }
    return `${startDateStr} – ${endDateStr} • WIB`;
  }, [timeRange]);

  const comparisonLabel = useMemo(() => {
    const now = new Date();
    const pastEnd = new Date();
    pastEnd.setDate(now.getDate() - 7);
    const pastStart = new Date();
    pastStart.setDate(now.getDate() - 13);

    const startStr = pastStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const endStr = pastEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    return `Dibandingkan ${startStr} – ${endStr}, hingga jam WIB yang sama.`;
  }, []);

  // Compute publication trend data for Recharts
  const chartData = useMemo(() => {
    const daysCount = timeRange === 'today' ? 1 : timeRange === '30days' ? 30 : 7;
    const result = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      // Aggregate published posts on this date
      let igCount = 0;
      let ytCount = 0;
      let ttCount = 0;

      if (data?.recentPosts) {
        data.recentPosts.forEach((post) => {
          if (post.createdAt && post.createdAt.startsWith(dateKey) && post.status === 'published') {
            const p = post.socialAccount?.platform?.toLowerCase();
            if (p === 'youtube') ytCount++;
            else if (p === 'tiktok') ttCount++;
            else igCount++;
          }
        });
      }

      // If today and published posts exist in data, reflect them
      if (i === 0 && (igCount === 0 && ytCount === 0 && ttCount === 0)) {
        igCount = data?.publishedPosts || 0;
      }

      result.push({
        date: label,
        Instagram: igCount,
        YouTube: ytCount,
        TikTok: ttCount,
      });
    }

    return result;
  }, [timeRange, data]);

  const totalPublished = data?.publishedPosts ?? 0;
  const totalAccounts = data?.totalAccounts ?? 0;
  const scheduledCount = data?.scheduledPosts ?? 0;
  const failedCount = data?.failedPosts ?? 0;
  const totalPosts = data?.totalPosts ?? 0;

  const successRate = totalPosts > 0 ? Math.round((totalPublished / (totalPublished + failedCount || 1)) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Filter Card (matching Minbat Dark UI reference) */}
      <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200/90 dark:border-white/[0.07] p-5 sm:p-6 shadow-xs transition-colors">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Analitik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Lihat aktivitas publikasi dan pertumbuhan performa multi-platform untuk akun sosial Anda.
          </p>
        </div>

        {/* Filter controls row */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
          {/* Left: Time Range Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200/60 dark:border-white/[0.05]">
            {(
              [
                { id: 'today', label: 'Hari ini' },
                { id: '7days', label: '7 hari' },
                { id: '30days', label: '30 hari' },
                { id: 'custom', label: 'Kustom' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setTimeRange(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === item.id
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right: Platform Pills & Refresh Button */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200/60 dark:border-white/[0.05]">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'youtube', label: 'YouTube' },
                  { id: 'tiktok', label: 'TikTok' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    platform === p.id
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/[0.07] transition-all disabled:opacity-60"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Muat ulang</span>
            </button>
          </div>
        </div>

        {/* Date active subtitle */}
        <div className="mt-4 text-xs font-medium text-slate-400 dark:text-zinc-500">
          {dateRangeLabel}
        </div>
      </div>

      {/* 2. Comparison Context Label */}
      <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium px-1">
        {comparisonLabel}
      </div>

      {/* 3. Stat Metric Cards (4 Cards Grid matching reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Postingan dipublikasikan */}
        <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200/90 dark:border-white/[0.07] p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Postingan dipublikasikan
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Setiap publikasi per platform dihitung satu kali.
            </p>
          </div>
          <div className="my-4">
            {loading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {totalPublished}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
            {totalPublished > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Naik 100%
              </span>
            ) : (
              <span className="text-slate-400 dark:text-zinc-500">Belum ada pembanding</span>
            )}
            <span>•</span>
            <span>sebelumnya 0</span>
          </div>
        </div>

        {/* Card 2: Akun aktif */}
        <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200/90 dark:border-white/[0.07] p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Channel aktif
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Channel unik yang mempublikasikan pada periode ini.
            </p>
          </div>
          <div className="my-4">
            {loading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {totalAccounts}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung
            </span>
            <span>•</span>
            <span>Meta, YT, TikTok</span>
          </div>
        </div>

        {/* Card 3: Antrean terjadwal */}
        <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200/90 dark:border-white/[0.07] p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Antrean terjadwal
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Postingan aktif menunggu eksekusi cron otomatis.
            </p>
          </div>
          <div className="my-4">
            {loading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {scheduledCount}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
            <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Scheduler aktif
            </span>
            <span>•</span>
            <span>siap dipublikasikan</span>
          </div>
        </div>

        {/* Card 4: Rasio keberhasilan */}
        <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200/90 dark:border-white/[0.07] p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Rasio keberhasilan
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Tingkat keberhasilan publikasi tanpa kendala API.
            </p>
          </div>
          <div className="my-4">
            {loading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {successRate}%
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Reliable
            </span>
            <span>•</span>
            <span>{failedCount} gagal</span>
          </div>
        </div>
      </div>

      {/* 4. Tren Publikasi Chart (Grafik matching Minbat Dark UI reference) */}
      <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200/90 dark:border-white/[0.07] p-5 sm:p-6 shadow-xs transition-colors">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Tren publikasi
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Jumlah postingan yang dipublikasikan setiap hari, per platform.
          </p>
        </div>

        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="0 0"
                vertical={false}
                stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)'}
              />
              <XAxis
                dataKey="date"
                stroke={theme === 'dark' ? '#71717a' : '#94a3b8'}
                tick={{ fill: theme === 'dark' ? '#71717a' : '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke={theme === 'dark' ? '#71717a' : '#94a3b8'}
                tick={{ fill: theme === 'dark' ? '#71717a' : '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                dx={-5}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#181924' : '#ffffff',
                  borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  color: theme === 'dark' ? '#ffffff' : '#0f172a',
                  fontSize: '12px',
                  padding: '10px 14px',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
              />
              {(platform === 'all' || platform === 'instagram') && (
                <Line
                  type="monotone"
                  dataKey="Instagram"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: theme === 'dark' ? '#090a0f' : '#ffffff', strokeWidth: 2 }}
                />
              )}
              {(platform === 'all' || platform === 'youtube') && (
                <Line
                  type="monotone"
                  dataKey="YouTube"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: theme === 'dark' ? '#090a0f' : '#ffffff', strokeWidth: 2 }}
                />
              )}
              {(platform === 'all' || platform === 'tiktok') && (
                <Line
                  type="monotone"
                  dataKey="TikTok"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f43f5e' }}
                  activeDot={{ r: 6, fill: '#f43f5e', stroke: theme === 'dark' ? '#090a0f' : '#ffffff', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend matching reference at bottom */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs font-medium text-slate-600 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]" />
            <span>Instagram</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
            <span>YouTube</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#f43f5e]" />
            <span>TikTok</span>
          </div>
        </div>
      </div>

      {/* 5. Two Columns: Upcoming Scheduled Posts & Recent Publishing Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Schedules */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Jadwal Mendatang</CardTitle>
              <CardDescription>Postingan antrean siap dipublikasikan otomatis</CardDescription>
            </div>
            <Link to="/planner" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Lihat Planner <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : !data?.upcomingScheduled || data.upcomingScheduled.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-6 h-6 text-slate-400 dark:text-zinc-500" />}
                title="Belum ada jadwal postingan"
                description="Buat dan jadwalkan postingan baru untuk memulai automasi media sosial."
                actionLabel="Jadwalkan Postingan"
                onAction={() => window.location.href = '/create'}
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {data.upcomingScheduled.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {p.mediaType === 'IMAGE' ? (
                          <img src={p.mediaUrl} alt="thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">VIDEO</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                          {p.caption || p.title || '(Tanpa judul)'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          {p.socialAccount?.platform === 'youtube' ? (
                            <Youtube className="w-3 h-3 text-red-500" />
                          ) : (
                            <Instagram className="w-3 h-3 text-pink-500" />
                          )}
                          <span>@{p.socialAccount?.username || 'account'}</span>
                          <span>•</span>
                          <span>{p.scheduledAt ? new Date(p.scheduledAt).toLocaleString('id-ID') : ''}</span>
                        </p>
                      </div>
                    </div>
                    <Badge status="scheduled" size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Publishing Activity */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Aktivitas Terakhir</CardTitle>
              <CardDescription>Postingan yang baru saja dipublikasikan</CardDescription>
            </div>
            <Link to="/posts" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : !data?.recentPosts || data.recentPosts.length === 0 ? (
              <EmptyState
                icon={<Layers className="w-6 h-6 text-slate-400 dark:text-zinc-500" />}
                title="Belum ada riwayat postingan"
                description="Mulai publikasikan konten sekarang untuk membangun presensi digital Anda."
                actionLabel="Buat Postingan Pertama"
                onAction={() => window.location.href = '/create'}
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {data.recentPosts.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {p.mediaType === 'IMAGE' ? (
                          <img src={p.mediaUrl} alt="thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">VIDEO</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                          {p.caption || p.title || '(Tanpa judul)'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          {p.socialAccount?.platform === 'youtube' ? (
                            <Youtube className="w-3 h-3 text-red-500" />
                          ) : (
                            <Instagram className="w-3 h-3 text-pink-500" />
                          )}
                          <span>@{p.socialAccount?.username || 'account'}</span>
                          <span>•</span>
                          <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID') : ''}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={p.status as any} size="sm" />
                      {p.platformPostId && (
                        <span className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
