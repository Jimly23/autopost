import React, { useEffect, useState } from 'react';
import { instagramService } from '../../services/instagram.service';
import { SocialAccount, InstagramProfile } from '../../types/instagram';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import {
  Instagram,
  PlusCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const SocialAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<SocialAccount | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const { success, error: toastError } = useToast();

  const loadAccounts = async () => {
    try {
      const data = await instagramService.getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      toastError('Failed to load connected social accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleConnect = () => {
    // Redirect browser to backend OAuth initiation
    window.location.href = instagramService.getConnectUrl();
  };

  const handleRefreshProfile = async (account: SocialAccount) => {
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
      await instagramService.disconnectAccount(accountToDisconnect.id);
      success(`Disconnected @${accountToDisconnect.username}`);
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
            Connect and manage your Instagram Business channels for automated content delivery.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConnect}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Connect Instagram
        </Button>
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Instagram className="w-8 h-8 text-pink-500" />}
          title="No Instagram Accounts Connected"
          description="Connect your Instagram Business account to unlock automated posting and scheduling capabilities."
          actionLabel="Connect Instagram Now"
          onAction={handleConnect}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => (
            <Card key={acc.id} hover className="overflow-hidden border-slate-200/90 flex flex-col justify-between">
              <div>
                <CardHeader className="bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700 capitalize">
                      {acc.platform} {acc.accountType ? `(${acc.accountType})` : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {acc.platformUserId.slice(0, 8)}...
                  </span>
                </CardHeader>

                <div className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-slate-200 bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                    {acc.profilePicture ? (
                      <img src={acc.profilePicture} alt={acc.username} className="w-full h-full object-cover" />
                    ) : (
                      <Instagram className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 truncate">@{acc.username}</h4>
                      <a
                        href={`https://instagram.com/${acc.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-slate-600"
                        title="View Instagram Profile"
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
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Token Active & Encrypted
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
                  Sync Profile
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
          ))}
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        title="Disconnect Instagram Account?"
        description="Are you sure you want to disconnect this account? Scheduled posts tied to this account will not be published."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-3">
            <Instagram className="w-5 h-5 text-pink-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block truncate">
                @{accountToDisconnect?.username}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {accountToDisconnect?.platformUserId}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisconnectModalOpen(false)}
              disabled={disconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDisconnect}
              loading={disconnecting}
            >
              Disconnect Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
