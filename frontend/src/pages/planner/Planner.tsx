import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../../services/post.service';
import { Post } from '../../types/post';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clock,
  Instagram,
  Youtube,
  X,
  ExternalLink,
} from 'lucide-react';

export const Planner: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected post for detail / reschedule modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPosts = async () => {
    try {
      // Fetch scheduled posts
      const res = await postService.getPosts({ status: 'scheduled', limit: 100 });
      setPosts(res.posts);
    } catch (err) {
      console.error('Failed to load scheduled posts for planner:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open detail modal
  const handleOpenPost = (post: Post) => {
    setSelectedPost(post);
    if (post.scheduledAt) {
      const dt = new Date(post.scheduledAt);
      setRescheduleDate(dt.toISOString().split('T')[0]);
      setRescheduleTime(dt.toTimeString().slice(0, 5));
    }
    setModalOpen(true);
  };

  // Reschedule handler
  const handleReschedule = async () => {
    if (!selectedPost || !rescheduleDate || !rescheduleTime) return;
    const target = new Date(`${rescheduleDate}T${rescheduleTime}`);
    if (target <= new Date()) {
      toastError('Rescheduled time must be in the future.');
      return;
    }

    setActionLoading(true);
    try {
      await postService.updatePost(selectedPost.id, {
        scheduledAt: target.toISOString(),
      });
      success('Schedule updated successfully');
      setModalOpen(false);
      fetchPosts();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel schedule
  const handleCancelSchedule = async () => {
    if (!selectedPost) return;
    setActionLoading(true);
    try {
      // Delete or set draft
      await postService.updatePost(selectedPost.id, { scheduledAt: null });
      success('Post schedule cancelled and converted to Draft');
      setModalOpen(false);
      fetchPosts();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to cancel schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  // Map posts into days
  const getPostsForDay = (day: number) => {
    return posts.filter((p) => {
      if (!p.scheduledAt) return false;
      const d = new Date(p.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Content Planner</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visual calendar for scheduled content across all connected channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200/90 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-32 text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/create')}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            New Schedule
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden border-slate-200/90">
        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
          {/* Empty offset padding for days before month start */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-28 sm:h-32 bg-slate-50/40 p-2" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNumber = idx + 1;
            const dayPosts = getPostsForDay(dayNumber);
            const isToday =
              new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === dayNumber;

            return (
              <div
                key={`day-${dayNumber}`}
                className={`h-28 sm:h-32 p-2 flex flex-col justify-between hover:bg-slate-50/60 transition-colors relative group ${
                  isToday ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                    }`}
                  >
                    {dayNumber}
                  </span>
                  {dayPosts.length > 0 && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                      {dayPosts.length}
                    </span>
                  )}
                </div>

                {/* Day posts badges */}
                <div className="space-y-1 overflow-y-auto max-h-16 my-1">
                  {dayPosts.map((p) => {
                    const isYT = p.socialAccount?.platform === 'youtube';
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleOpenPost(p)}
                        className={`w-full text-left p-1 rounded text-[11px] font-medium truncate flex items-center gap-1 transition-colors ${
                          isYT
                            ? 'bg-red-50/80 hover:bg-red-100/90 border border-red-200/80 text-red-900'
                            : 'bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/80 text-blue-900'
                        }`}
                      >
                        {isYT ? (
                          <Youtube className="w-2.5 h-2.5 text-red-600 shrink-0" />
                        ) : (
                          <Instagram className="w-2.5 h-2.5 text-pink-500 shrink-0" />
                        )}
                        <span className="truncate">{p.title || p.caption || 'Scheduled Post'}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-300 group-hover:text-slate-400 text-right">
                  +
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Post Detail / Reschedule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Scheduled Post Details"
        description="Inspect or update the publication schedule for this post"
        maxWidth="md"
      >
        {selectedPost && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {selectedPost.mediaType === 'IMAGE' ? (
                  <img src={selectedPost.mediaUrl} alt="media" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-slate-500">VIDEO</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge status="scheduled" size="sm" />
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    {selectedPost.socialAccount?.platform === 'youtube' ? (
                      <>
                        <Youtube className="w-3 h-3 text-red-600" />
                        {selectedPost.socialAccount?.username || 'YouTube Channel'}
                      </>
                    ) : (
                      <>
                        <Instagram className="w-3 h-3 text-pink-500" />
                        @{selectedPost.socialAccount?.username || 'instagram'}
                      </>
                    )}
                  </span>
                </div>
                {selectedPost.title && (
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {selectedPost.title}
                  </h4>
                )}
                <p className="text-xs text-slate-800 line-clamp-3">
                  {selectedPost.caption || '(No caption)'}
                </p>
              </div>
            </div>

            {/* Reschedule Inputs */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Change Schedule Time
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="New Date"
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  label="New Time"
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelSchedule}
                disabled={actionLoading}
                className="text-rose-600 hover:bg-rose-50"
              >
                Cancel Schedule (Move to Draft)
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReschedule}
                  loading={actionLoading}
                >
                  Save Reschedule
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
