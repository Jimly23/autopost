import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  Trash2,
  Database,
  Mail,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const lastUpdated = 'November 24, 2026';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg shadow-sm">
              A
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Automation
            </span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Title Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-4">
            <Shield className="h-3.5 w-3.5" />
            Legal & Security Compliance
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Last Updated: <span className="font-medium text-slate-700">{lastUpdated}</span>
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm space-y-10 leading-relaxed text-slate-600 text-base">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">1</span>
              Introduction
            </h2>
            <p>
              Welcome to <strong>Automation</strong> ("we", "our", or "us"). We provide a multi-channel Social Media Management SaaS platform that enables content creators, agencies, and businesses to streamline, schedule, and publish video and visual media across authorized social media networks, including <strong>Meta (Instagram Business)</strong>, <strong>YouTube (Google LLC)</strong>, and <strong>TikTok</strong>.
            </p>
            <p className="mt-3">
              We respect your privacy and are committed to protecting your personal data in strict compliance with applicable global privacy laws (including GDPR and CCPA), Meta Platform Terms, Google API Services User Data Policy, and TikTok Developer Terms. This policy describes our collection, storage, usage, and protection of information when you access our service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">2</span>
              Information We Collect
            </h2>
            <p>We collect only the minimal data strictly required to deliver social media scheduling and publishing functionality:</p>
            
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-blue-600" />
                  Account Profile Information
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  Your name, email address, and encrypted credentials when registering an Automation user account.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-pink-600" />
                  Meta (Instagram) Account Data
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  When you connect via Meta OAuth: your Instagram Business Account ID, username, profile picture URL, and account type.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-red-600" />
                  YouTube (Google) Account Data
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  When connecting via Google OAuth: your YouTube Channel ID, channel title, channel avatar thumbnail, and publication status.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-slate-900" />
                  TikTok Account Data
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  When connecting via TikTok OAuth: your TikTok Open ID, display name, avatar URL, and authorized publishing scopes.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-emerald-600" />
                  Encrypted OAuth Tokens
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  OAuth access tokens and refresh tokens granted by Meta, Google, and TikTok, encrypted at rest using military-grade AES-256-GCM encryption.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Content & Media Files
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  Captions, video titles, scheduled publishing dates, photos, and video files (standard videos, Reels, Shorts) uploaded by you for publishing.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">3</span>
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Publishing & Scheduling:</strong> To transmit and publish your scheduled media directly to your designated Meta Instagram, YouTube, and TikTok accounts via official developer APIs.
              </li>
              <li>
                <strong>Token Auto-Refresh:</strong> To automatically renew expired access tokens using your encrypted refresh tokens without requiring repeated logins.
              </li>
              <li>
                <strong>Workspace Management:</strong> To display connected channel avatars, usernames, and publishing health statuses within your private SaaS dashboard.
              </li>
              <li>
                <strong>Strict Prohibition on Data Sale:</strong> We <strong>never sell, rent, monetize, or lease</strong> your personal data, media, or social account information to third-party data brokers, advertisers, or AI training datasets.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">4</span>
              Third-Party Platform Policies & Compliance
            </h2>
            <p>
              Our application uses official developer APIs and complies with all governing platform policies:
            </p>

            {/* Meta */}
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                Meta Platforms (Instagram API)
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Usage of Instagram publishing features is subject to the{' '}
                <a href="https://www.facebook.com/terms.php" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                  Meta Terms of Service <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                and the{' '}
                <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                  Instagram Privacy Policy <ExternalLink className="w-3 h-3 inline" />
                </a>.
              </p>
            </div>

            {/* YouTube / Google */}
            <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                YouTube API Services (Google LLC)
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Automation utilizes YouTube API Services. By connecting your YouTube account, you agree to be bound by the{' '}
                <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                  YouTube Terms of Service <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                and the{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                  Google Privacy Policy <ExternalLink className="w-3 h-3 inline" />
                </a>.
              </p>
              <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200">
                <strong>Google API Limited Use Disclosure:</strong> Automation's use and transfer to any other app of information received from Google APIs adheres to the{' '}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                  Google API Services User Data Policy
                </a>, including the Limited Use requirements.
              </div>
            </div>

            {/* TikTok */}
            <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                TikTok Developer Platform
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Connecting and publishing to TikTok is governed by the{' '}
                <a href="https://www.tiktok.com/legal/page/row/terms-of-service/en" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                  TikTok Terms of Service <ExternalLink className="w-3 h-3 inline" />
                </a>,{' '}
                <a href="https://www.tiktok.com/legal/page/row/privacy-policy/en" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                  TikTok Privacy Policy <ExternalLink className="w-3 h-3 inline" />
                </a>, and TikTok Developer Terms.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">5</span>
              Data Storage & Security Measures
            </h2>
            <p>We employ state-of-the-art security safeguards:</p>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>AES-256-GCM Encryption:</strong> All tokens (Meta, YouTube, TikTok) are encrypted before writing to persistent storage and decrypted only ephemeral in-memory during active publish requests.
              </li>
              <li>
                <strong>Workspace Multi-Tenant Isolation:</strong> Every record is keyed strictly to the authenticated user ID. Cross-tenant access is prohibited at both ORM and database layer.
              </li>
              <li>
                <strong>Secure Transport:</strong> All communication between your browser, our backend, and third-party APIs occurs exclusively over TLS 1.3/HTTPS with anti-CSRF token protection.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">6</span>
              User Rights, Disconnection & Data Deletion
            </h2>
            <p>
              You maintain 100% ownership of your accounts and may revoke access or delete your stored data at any time through multiple channels:
            </p>
            
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Trash2 className="h-4 w-4 text-blue-600" />
                How to Revoke Access & Delete Data:
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
                <li>
                  <strong>Direct Dashboard Disconnection:</strong> In Automation, go to <strong>Social Accounts</strong> and click <strong>Disconnect</strong> on any linked Meta, YouTube, or TikTok account. This immediately and permanently deletes the corresponding access tokens, refresh tokens, and scheduled drafts from our database.
                </li>
                <li>
                  <strong>Revoke Meta Access:</strong> In Instagram, navigate to <em>Settings &gt; Website Permissions &gt; Apps and Websites &gt; Active &gt; Remove</em>.
                </li>
                <li>
                  <strong>Revoke Google/YouTube Access:</strong> You can view and revoke Automation's access at any time via the{' '}
                  <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">
                    Google Security Settings Permissions Page
                  </a>.
                </li>
                <li>
                  <strong>Revoke TikTok Access:</strong> In the TikTok app, go to <em>Settings and Privacy &gt; Security &gt; Manage App Permissions</em> and remove Automation.
                </li>
                <li>
                  <strong>Full Account Purge Request:</strong> To request deletion of your entire user account, profile, and media history, email our privacy team at <strong>privacy@automation.bikinkafe.id</strong>. All data will be permanently wiped within 14 days.
                </li>
              </ol>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">7</span>
              Contact Us
            </h2>
            <p>
              If you have any questions or data privacy inquiries regarding this Privacy Policy or platform compliance, please contact our team:
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>privacy@automation.bikinkafe.id</span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Automation Platform. All rights reserved.
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
