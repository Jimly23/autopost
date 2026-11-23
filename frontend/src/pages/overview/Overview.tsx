import React, { useEffect, useState } from 'react';
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
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const Overview: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const overview = await dashboardService.getOverview();
        setData(overview);
      } catch (err) {
        console.error('Failed to load dashboard overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const statCards = [
    {
      title: 'Connected Accounts',
      value: data?.totalAccounts ?? 0,
      icon: Instagram,
      color: 'text-pink-600 bg-pink-50 border-pink-100',
      link: '/accounts',
    },
    {
      title: 'Total Posts',
      value: data?.totalPosts ?? 0,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      link: '/posts',
    },
    {
      title: 'Scheduled Posts',
      value: data?.scheduledPosts ?? 0,
      icon: Calendar,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      link: '/posts?status=scheduled',
    },
    {
      title: 'Published Posts',
      value: data?.publishedPosts ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      link: '/posts?status=published',
    },
    {
      title: 'Failed Posts',
      value: data?.failedPosts ?? 0,
      icon: AlertCircle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      link: '/posts?status=failed',
    },
  ];

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Top Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status of your Instagram channels and automation schedules.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/accounts">
            <Button variant="outline" size="sm" icon={<Instagram className="w-3.5 h-3.5" />}>
              Connect Instagram
            </Button>
          </Link>
          <Link to="/create">
            <Button variant="primary" size="sm" icon={<PlusCircle className="w-3.5 h-3.5" />}>
              Create Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.title} to={c.link}>
              <Card hover className="p-4 border-slate-200/90 h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 leading-tight line-clamp-1">{c.title}</span>
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${c.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{c.value}</div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Two Columns: Upcoming Scheduled & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Schedules */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming Schedules</CardTitle>
              <CardDescription>Queued posts waiting for automated publishing</CardDescription>
            </div>
            <Link to="/planner" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Planner <ArrowRight className="w-3 h-3" />
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
                icon={<Clock className="w-6 h-6 text-slate-400" />}
                title="No posts currently scheduled"
                description="Create and schedule a post to automate your Instagram feed."
                actionLabel="Schedule a Post"
                onAction={() => window.location.href = '/create'}
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.upcomingScheduled.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.mediaType === 'IMAGE' ? (
                          <img src={p.mediaUrl} alt="thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[10px] font-bold text-slate-400">VIDEO</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate max-w-xs sm:max-w-md">
                          {p.caption || '(No caption)'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Instagram className="w-3 h-3 text-pink-500" />
                          <span>@{p.socialAccount?.username || 'instagram'}</span>
                          <span>•</span>
                          <span>{p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : ''}</span>
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
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest posts published or drafted</CardDescription>
            </div>
            <Link to="/posts" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
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
                icon={<FileText className="w-6 h-6 text-slate-400" />}
                title="No posts created yet"
                description="Start publishing content to build your social presence."
                actionLabel="Create First Post"
                onAction={() => window.location.href = '/create'}
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentPosts.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.mediaType === 'IMAGE' ? (
                          <img src={p.mediaUrl} alt="thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[10px] font-bold text-slate-400">VIDEO</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate max-w-xs sm:max-w-md">
                          {p.caption || '(No caption)'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Instagram className="w-3 h-3 text-pink-500" />
                          <span>@{p.socialAccount?.username || 'instagram'}</span>
                          <span>•</span>
                          <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={p.status as any} size="sm" />
                      {p.platformPostId && (
                        <a
                          href={`https://www.instagram.com/`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-600 p-1"
                          title="Open Instagram"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
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
