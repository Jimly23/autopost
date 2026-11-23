import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle2, AlertCircle, Loader2, Youtube, Instagram } from 'lucide-react';

export const ConnectCallback: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const status = params.get('status');
  const platform = params.get('platform');
  const account = params.get('account');
  const message = params.get('message');

  const isYT = platform === 'youtube';
  const platformLabel = isYT ? 'YouTube Channel' : 'Instagram account';

  useEffect(() => {
    if (status === 'success') {
      success(`Successfully connected ${platformLabel}: ${account || ''}!`);
      const timer = setTimeout(() => {
        navigate('/accounts', { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    } else if (status === 'error') {
      error(message || `Failed to connect ${platformLabel}.`);
      const timer = setTimeout(() => {
        navigate('/accounts', { replace: true });
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      navigate('/accounts', { replace: true });
    }
  }, [status, platform, account, message, navigate, success, error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      {status === 'success' ? (
        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${isYT ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center`}>
            {isYT ? <Youtube className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {isYT ? 'YouTube Channel Connected!' : 'Instagram Connected!'}
          </h2>
          <p className="text-xs text-slate-500">Redirecting to Social Accounts...</p>
        </div>
      ) : status === 'error' ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Connection Failed</h2>
          <p className="text-xs text-rose-600">{message || 'Unable to connect your account'}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500 font-medium">Processing connection...</p>
        </div>
      )}
    </div>
  );
};
