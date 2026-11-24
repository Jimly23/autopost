import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import { DashboardOverview } from '../../types/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  CheckCircle2,
  Instagram,
  Lock,
  Info,
  Clock,
  Sparkles,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getOverview();
        setData(res);
      } catch (err) {
        console.error('Failed to load overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const total = data?.totalPosts || 0;
  const published = data?.publishedPosts || 0;
  const scheduled = data?.scheduledPosts || 0;
  const failed = data?.failedPosts || 0;

  const successRate = total > 0 ? Math.round((published / (published + failed || 1)) * 100) : 100;
  const publicationRatio = total > 0 ? Math.round((published / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Analitik & Insights</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Performa publikasi konten dan metrik pengiriman automasi channel.
        </p>
      </div>

      {/* Available Database Performance Metrics (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Publishing Success Rate
          </span>
          {loading ? (
            <Skeleton className="h-9 w-24 my-2" />
          ) : (
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{successRate}%</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Reliable
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">Rasio publikasi tanpa kendala API</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Delivered vs Pipeline
          </span>
          {loading ? (
            <Skeleton className="h-9 w-24 my-2" />
          ) : (
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{publicationRatio}%</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">dari total dibuat</span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">Persentase konten telah terbit</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Active Scheduled Queue
          </span>
          {loading ? (
            <Skeleton className="h-9 w-24 my-2" />
          ) : (
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{scheduled}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">menunggu cron</span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">Pipeline jadwal postingan aktif</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Published Media
          </span>
          {loading ? (
            <Skeleton className="h-9 w-24 my-2" />
          ) : (
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{published}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">live di platform</span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">Total konten berhasil dipublikasikan</p>
        </Card>
      </div>

      {/* Meta Graph Insights Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-500" />
              Meta Audience & Engagement Insights
            </CardTitle>
            <CardDescription>Reach, impressions, profile clicks, and audience demographics</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-12 px-6 text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-400 dark:text-zinc-400 mb-4 border border-slate-200 dark:border-white/10">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Meta Insights Scope Pending App Review</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Sesuai kebijakan Meta Developer Platform, data reach, impressions, dan demografi audiens memerlukan izin <code className="bg-slate-100 dark:bg-white/[0.08] px-1.5 py-0.5 rounded text-slate-700 dark:text-zinc-200 font-mono text-[11px]">read_insights</code> yang disetujui melalui Meta App Review.
            </p>
            <div className="mt-5 p-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200/80 dark:border-white/[0.07] text-left text-xs text-slate-600 dark:text-zinc-300 space-y-1.5 w-full">
              <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Status Integrasi Saat Ini:
              </p>
              <p>• Content Publishing: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active & Live</span></p>
              <p>• Account Management: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span></p>
              <p>• Insights Metrics: <span className="text-amber-600 dark:text-amber-400 font-semibold">Scheduled for App Review Phase</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
