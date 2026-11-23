import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import { DashboardOverview } from '../../types/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Instagram,
  Lock,
  Info,
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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Analytics & Insights</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Publishing performance and channel automation delivery metrics.
        </p>
      </div>

      {/* Available Database Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Publishing Success Rate
          </span>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{successRate}%</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Reliable
              </span>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Delivered vs Pipeline
          </span>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{publicationRatio}%</span>
              <span className="text-xs text-slate-500">of total created</span>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Active Scheduled Queue
          </span>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">{scheduled}</span>
              <span className="text-xs text-slate-500">posts awaiting cron</span>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Published Media
          </span>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">{published}</span>
              <span className="text-xs text-slate-500">live on Instagram</span>
            </div>
          )}
        </Card>
      </div>

      {/* Meta Graph Insights Section (Real Data Policy) */}
      <Card className="border-slate-200/90">
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
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Meta Insights Scope Pending App Review</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              In accordance with Meta Developer Platform policies, audience reach, impressions, and follower demographics require the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono text-[11px]">read_insights</code> permission approved via Meta App Review.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-left text-xs text-slate-600 space-y-1 w-full">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" /> Current Integration Status:
              </p>
              <p>• Content Publishing: <span className="text-emerald-600 font-semibold">Active & Live</span></p>
              <p>• Account Management: <span className="text-emerald-600 font-semibold">Active</span></p>
              <p>• Insights Metrics: <span className="text-amber-600 font-semibold">Scheduled for App Review Phase</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
