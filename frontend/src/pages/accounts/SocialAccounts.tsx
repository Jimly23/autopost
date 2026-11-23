import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { instagramService } from '../../services/instagram.service';
import { youtubeService } from '../../services/youtube.service';
import { SocialAccount, InstagramProfile } from '../../types/instagram';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import {
  Instagram,
  Youtube,
  PlusCircle,
  RefreshCw,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const SocialAccounts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<SocialAccount | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const { success, error: toastError } = useToast();

  const loadAccounts = async () => {
    try {
      const [igData, ytData] = await Promise.all([
        instagramService.getAccounts().catch(() => []),
        youtubeService.getAccounts().catch(() => []),
      ]);
      setAccounts([...igData, ...ytData]);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      toastError('Failed to load connected social accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();

    // Check OAuth return params
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const account = searchParams.get('account');
    const message = searchParams.get('message');

    if (status === 'success') {
      const platformName = platform === 'youtube' ? 'YouTube Channel' : 'Instagram';
      success(`Successfully connected ${platformName}: ${account || ''}!`);
      setSearchParams({}, { replace: true });
    } else if (status === 'error') {
      toastError(message || 'Failed to connect social account.');
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleConnectInstagram = () => {
    window.location.href = instagramService.getConnectUrl();
  };

  const handleConnectYouTube = () => {
    window.location.href = youtubeService.getConnectUrl();
  };

  const handleRefreshProfile = async (account: SocialAccount) => {
    if (account.platform === 'youtube') {
      loadAccounts();
      success(`Refreshed data for ${account.username}`);
      return;
    }
    setRefreshingId(account.id);
    try {
      const profile: InstagramProfile = await instagramService.getLiveProfile(account.id);
      success(`Refreshed profile for @${profile.username}`);
      loadAccounts();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to refresh profile from Instagram.');
    } finally {
      setRefreshingId(null);
    }
  };

  const confirmDisconnect = async () => {
    if (!accountToDisconnect) return;
    setDisconnecting(true);
    try {
      if (accountToDisconnect.platform === 'youtube') {
        await youtubeService.disconnectAccount(accountToDisconnect.id);
      } else {
        await instagramService.disconnectAccount(accountToDisconnect.id);
      }
      success(`Disconnected ${accountToDisconnect.username}`);
      setDisconnectModalOpen(false);
      setAccountToDisconnect(null);
      loadAccounts();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to disconnect account.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Social Accounts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect and manage your Instagram & YouTube channels for automated content publishing.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleConnectInstagram}
            icon={<Instagram className="w-4 h-4 text-pink-300" />}
          >
            Connect Instagram
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleConnectYouTube}
            className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            icon={<Youtube className="w-4 h-4 text-red-600" />}
          >
            Connect YouTube
          </Button>
        </div>
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<PlusCircle className="w-8 h-8 text-blue-500" />}
          title="No Social Accounts Connected"
          description="Connect your Instagram Business account or YouTube Channel to unlock automated posting and scheduling capabilities."
          actionLabel="Connect Instagram Now"
          onAction={handleConnectInstagram}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const isYT = acc.platform === 'youtube';
            const externalUrl = isYT
              ? `https://www.youtube.com/channel/${acc.platformUserId}`
              : `https://instagram.com/${acc.username}`;

            return (
              <Card key={acc.id} hover className="overflow-hidden border-slate-200/90 flex flex-col justify-between">
                <div>
                  <CardHeader className="bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isYT ? 'bg-red-500' : 'bg-pink-500'}`} />
                      <span className="text-xs font-semibold text-slate-700 capitalize flex items-center gap-1.5">
                        {isYT ? (
                          <>
                            <Youtube className="w-3.5 h-3.5 text-red-600 inline" /> YouTube Channel
                          </>
                        ) : (
                          <>
                            <Instagram className="w-3.5 h-3.5 text-pink-600 inline" /> Instagram Business
                          </>
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {acc.platformUserId.slice(0, 10)}...
                    </span>
                  </CardHeader>

                  <div className="p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full border border-slate-200 bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                      {acc.profilePicture ? (
                        <img src={acc.profilePicture} alt={acc.username} className="w-full h-full object-cover" />
                      ) : isYT ? (
                        <Youtube className="w-6 h-6 text-red-500" />
                      ) : (
                        <Instagram className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {isYT ? acc.username : `@${acc.username}`}
                        </h4>
                        <a
                          href={externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-600"
                          title={`View ${isYT ? 'YouTube Channel' : 'Instagram Profile'}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Connected: {new Date(acc.createdAt).toLocaleDateString()}
                      </p>

                      {/* Token Status Badge */}
                      <div className="mt-3">
                        {acc.tokenStatus?.isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-500" /> Token Expired (Reconnect)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Token Active & Auto-Refreshed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRefreshProfile(acc)}
                    loading={refreshingId === acc.id}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Sync Data
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAccountToDisconnect(acc);
                      setDisconnectModalOpen(true);
                    }}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Disconnect
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        title="Disconnect Social Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to disconnect{' '}
            <strong className="text-slate-900">
              {accountToDisconnect?.platform === 'youtube'
                ? accountToDisconnect?.username
                : `@${accountToDisconnect?.username}`}
            </strong>
            ? Scheduled posts targeting this channel will be cancelled.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisconnectModalOpen(false)}
              disabled={disconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmDisconnect}
              loading={disconnecting}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
            >
              Confirm Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
