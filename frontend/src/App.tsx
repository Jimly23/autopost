import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Dashboard Pages
import { Overview } from './pages/overview/Overview';
import { SocialAccounts } from './pages/accounts/SocialAccounts';
import { ConnectCallback } from './pages/accounts/ConnectCallback';
import { CreatePost } from './pages/create/CreatePost';
import { Planner } from './pages/planner/Planner';
import { Posts } from './pages/posts/Posts';
import { MediaLibrary } from './pages/media/MediaLibrary';
import { Analytics } from './pages/analytics/Analytics';
import { Settings } from './pages/settings/Settings';

// Legal Pages (Public for Meta Review & Compliance)
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Legal Pages */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Public Auth Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* OAuth Callback route (accessible when returning from Instagram) */}
            <Route path="/instagram/connect" element={<ConnectCallback />} />

            {/* Protected SaaS Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Overview />} />
                <Route path="/accounts" element={<SocialAccounts />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/posts" element={<Posts />} />
                <Route path="/media" element={<MediaLibrary />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
