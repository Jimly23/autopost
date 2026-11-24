import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/auth.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  LogOut,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { success, error: toastError } = useToast();

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await authService.updateProfile({ name, email });
      await refreshUser();
      success('Profile updated successfully');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toastError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Pengaturan Akun</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Kelola detail workspace personal dan kredensial keamanan akun Anda.
        </p>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your display name and registered email address</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" loading={profileLoading} icon={<Save className="w-3.5 h-3.5" />}>
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Form */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Ensure your account uses a secure password of at least 8 characters</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" loading={passwordLoading} icon={<Save className="w-3.5 h-3.5" />}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security & Session Info */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> Security & Session Management
            </CardTitle>
            <CardDescription>Authentication storage and tenant identification</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <p>
              <span className="font-semibold text-slate-800">User ID (Tenant):</span>{' '}
              <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{user?.id}</code>
            </p>
            <p>
              <span className="font-semibold text-slate-800">Session Mode:</span>{' '}
              <span className="text-emerald-700 font-semibold">HttpOnly Cookie (Server-side MySQL Session)</span>
            </p>
            <p>
              <span className="font-semibold text-slate-800">Account Created:</span>{' '}
              {user?.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">End your current session across this browser.</span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => logout()}
              icon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
