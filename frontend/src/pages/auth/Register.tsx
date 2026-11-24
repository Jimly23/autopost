import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Sparkles, Mail, Lock, User as UserIcon } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password });
      toastSuccess('Account created successfully');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <img src="/foxman-logo.png" alt="Foxman" className="w-14 h-14 object-contain" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Create your Foxman Workspace</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Multi-Account Social Media Automation SaaS</p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#12131a] py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Jimly Assidqi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
              autoComplete="name"
              required
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password (min 8 chars)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />

            <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
              Create Workspace
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/[0.06] text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700">
                Sign in
              </Link>
            </p>
            <div className="flex justify-center items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
              <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
