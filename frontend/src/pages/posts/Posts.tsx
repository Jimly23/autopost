import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../../services/post.service';
import { Post, PostStatus } from '../../types/post';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../contexts/ToastContext';
import {
  FileText,
  PlusCircle,
  Search,
  ExternalLink,
  Trash2,
  Send,
  Edit2,
  Clock,
  Instagram,
  Youtube,
  AlertCircle,
} from 'lucide-react';

const STATUS_TABS: Array<{ label: string; value?: PostStatus }> = [
  { label: 'All Posts' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const Posts: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState<PostStatus | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit draft modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await postService.getPosts({
        status: activeTab,
        page,
        limit,
      });
      setPosts(res.posts);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error('Failed to load posts:', err);
      toastError('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, activeTab]);

  // Publish immediate handler
  const handlePublishNow = async (post: Post) => {
    setActionLoading(true);
    try {
      await postService.publishPost(post.id);
      success('Post published successfully to Instagram!');
      fetchPosts();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Publishing failed. Check status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm delete handler
  const confirmDelete = async () => {
    if (!postToDelete) return;
    setActionLoading(true);
    try {
      await postService.deletePost(postToDelete.id);
      success('Post deleted successfully');
      setDeleteModalOpen(false);
      setPostToDelete(null);
      fetchPosts();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete post.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save edit handler
  const handleSaveEdit = async () => {
    if (!postToEdit) return;
    setActionLoading(true);
    try {
      await postService.updatePost(postToEdit.id, {
        caption: editCaption.trim() || undefined,
        mediaUrl: editMediaUrl.trim() || undefined,
      });
      success('Post updated successfully');
      setEditModalOpen(false);
      setPostToEdit(null);
      fetchPosts();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update post.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (p: Post) => {
    setPostToEdit(p);
    setEditCaption(p.caption || '');
    setEditMediaUrl(p.mediaUrl || '');
    setEditModalOpen(true);
  };

  // Client-side search filter
  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.caption?.toLowerCase().includes(q) ||
      p.socialAccount?.username?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Riwayat Publikasi</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Kelola alur pipeline konten, draf, jadwal otomatis, dan riwayat yang telah terbit.
          </p>
        </div>
        <Link to="/create">
          <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
            Buat Postingan
          </Button>
        </Link>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  setActiveTab(tab.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search caption or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Posts Table / Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-slate-400 dark:text-zinc-500" />}
              title="No posts found"
              description={
                activeTab
                  ? `No posts with status "${activeTab}" found in your workspace.`
                  : 'You have not created any posts yet.'
              }
              actionLabel="Create a Post"
              onAction={() => (window.location.href = '/create')}
              className="border-0 bg-transparent py-12"
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Left: Thumbnail & Content */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                      {post.mediaType === 'IMAGE' ? (
                        <img
                          src={post.mediaUrl}
                          alt="thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">VIDEO</div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge status={post.status} size="sm" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 flex items-center gap-1">
                          {post.socialAccount?.platform === 'youtube' ? (
                            <>
                              <Youtube className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              {post.socialAccount?.username || 'YouTube'}
                            </>
                          ) : (
                            <>
                              <Instagram className="w-3 h-3 text-pink-500" />
                              @{post.socialAccount?.username || 'instagram'}
                            </>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {post.title && (
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5 line-clamp-1">
                          {post.title}
                        </h4>
                      )}

                      <p className="text-xs text-slate-800 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                        {post.caption || <span className="text-slate-400 dark:text-zinc-500 italic">(No caption provided)</span>}
                      </p>

                      {post.scheduledAt && post.status === 'scheduled' && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Scheduled for: {new Date(post.scheduledAt).toLocaleString()}
                        </p>
                      )}

                      {post.publishedAt && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
                          Published: {new Date(post.publishedAt).toLocaleString()}
                        </p>
                      )}

                      {post.errorMessage && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          Error: {post.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* View on Platform permalink if published */}
                    {post.status === 'published' && (
                      post.socialAccount?.platform === 'youtube' && post.platformPostId ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${post.platformPostId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>YouTube</span>
                        </a>
                      ) : (
                        <a
                          href="https://www.instagram.com/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Instagram</span>
                        </a>
                      )
                    )}

                    {/* Publish Now button for draft or failed */}
                    {['draft', 'failed'].includes(post.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishNow(post)}
                        disabled={actionLoading}
                        icon={<Send className="w-3.5 h-3.5 text-blue-600" />}
                      >
                        Publish Now
                      </Button>
                    )}

                    {/* Edit draft */}
                    {['draft', 'scheduled'].includes(post.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(post)}
                        icon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                    )}

                    {/* Delete post */}
                    <button
                      onClick={() => {
                        setPostToDelete(post);
                        setDeleteModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
            totalItems={total}
            limit={limit}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Post?"
        description="Are you sure you want to delete this post record? This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            {postToDelete?.caption ? (
              <span className="line-clamp-2">"{postToDelete.caption}"</span>
            ) : (
              <span>Post ID: {postToDelete?.id}</span>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} loading={actionLoading}>
              Delete Post
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Draft Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Post"
        description="Modify post caption or media URL"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label="Media URL"
            type="url"
            value={editMediaUrl}
            onChange={(e) => setEditMediaUrl(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Caption
            </label>
            <textarea
              rows={4}
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="w-full bg-white rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit} loading={actionLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
