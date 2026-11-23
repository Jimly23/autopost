import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Trash2, Database, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const lastUpdated = 'November 21, 2026';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
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
              Welcome to <strong>Automation</strong> ("we", "our", or "us"). We provide a modern Social Media Management SaaS platform that enables creators, businesses, and professionals to streamline, schedule, and publish content to authorized social media platforms, including Instagram.
            </p>
            <p className="mt-3">
              We respect your privacy and are committed to protecting your personal data in full compliance with applicable privacy laws and Meta Platform Terms. This Privacy Policy describes how we collect, use, store, and protect your information when you use our service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">2</span>
              Information We Collect
            </h2>
            <p>We only collect information strictly necessary to provide and operate our social media publishing services:</p>
            
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-blue-600" />
                  Account Information
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  Your name, email address, and encrypted authentication credentials when you register for an Automation account.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-blue-600" />
                  Instagram Account Data
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  When you connect an Instagram Professional account via Meta OAuth: your Instagram User ID, username, account type, and profile picture URL.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-blue-600" />
                  OAuth Access Tokens
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  System User and access tokens provided by Meta, strictly encrypted at rest with industry-standard AES-256-GCM algorithms.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Content & Media Files
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  Post captions, schedules, photos, and video Reels uploaded by you for publishing to your authorized connected accounts.
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
                <strong>Publishing & Scheduling:</strong> To transmit and publish your scheduled photos, carousel posts, and video Reels directly to your designated Instagram accounts via official Meta Graph API endpoints.
              </li>
              <li>
                <strong>Profile Display:</strong> To display connected usernames, profile avatars, and connection health status within your personal SaaS dashboard.
              </li>
              <li>
                <strong>Analytics & Insights:</strong> To calculate aggregate publishing performance metrics (total posts published, scheduled queue, and success/failure statuses).
              </li>
              <li>
                <strong>Strict Prohibition on Data Sale:</strong> We <strong>never sell, rent, lease, or monetize</strong> your personal data, media, or Meta account information to third-party data brokers, advertisers, or marketing agencies.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">4</span>
              Meta Platform & Third-Party Integration
            </h2>
            <p>
              Our application integrates with the official <strong>Meta Graph API</strong> (Instagram API with Unified Login). By connecting your Instagram account, you acknowledge that your usage of Instagram features is also governed by:
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
              <a
                href="https://www.facebook.com/terms.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Meta Terms of Service &rarr;
              </a>
              <a
                href="https://privacycenter.instagram.com/policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Instagram Privacy Policy &rarr;
              </a>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">5</span>
              Data Storage & Security Measures
            </h2>
            <p>We implement rigorous security practices to protect your data:</p>
            <ul className="mt-3 list-disc pl-5 space-y-2">
              <li>
                <strong>AES-256-GCM Encryption:</strong> All social media OAuth tokens are encrypted before being written to our database and decrypted only in-memory when communicating with official Meta API servers.
              </li>
              <li>
                <strong>Multi-Tenant Data Isolation:</strong> Every user operates within an isolated workspace keyed by <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">userId</code>. No user can access or view another user's accounts, tokens, or posts.
              </li>
              <li>
                <strong>Secure Transports:</strong> All API communication and file deliveries occur over HTTPS with modern TLS encryption and anti-CSRF token protection.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">6</span>
              User Rights & Data Deletion Instructions
            </h2>
            <p>
              In accordance with Meta Platform Policy and data privacy regulations, you retain complete ownership and control over your data:
            </p>
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Trash2 className="h-4 w-4 text-blue-600" />
                How to Delete Your Data & Revoke Access
              </h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-600">
                <li>
                  <strong>Disconnect via Dashboard:</strong> Navigate to <strong>Social Accounts</strong> in your dashboard and click <strong>Disconnect</strong> on any linked Instagram account. This immediately cascades and deletes all associated access tokens and publishing authorizations from our database.
                </li>
                <li>
                  <strong>Revoke via Instagram:</strong> You can revoke Automation's permissions directly in your Instagram settings at <em>Settings & Privacy &gt; Website Permissions &gt; Apps and Websites &gt; Active &gt; Remove</em>.
                </li>
                <li>
                  <strong>Account Deletion Request:</strong> If you wish to delete your entire Automation user account and all stored media/history, you may submit a deletion request to our support email below. All records will be permanently purged within 30 days.
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
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact our Data Protection team:
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>support@automation.dev</span>
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