import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export const TermsOfService: React.FC = () => {
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
            <FileText className="h-3.5 w-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Terms of Service
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
              Agreement to Terms
            </h2>
            <p>
              By accessing, browsing, or creating an account on the <strong>Automation</strong> social media management software platform, you agree to comply with and be legally bound by these Terms of Service. If you do not agree to these terms in full, you may not use our services.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">2</span>
              Description of Service
            </h2>
            <p>
              Automation provides an automated content scheduling, planning, and publishing platform connecting creators and businesses with third-party social media platforms, including:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1.5 text-sm">
              <li><strong>Meta Platforms (Instagram Business):</strong> Publishing photos, carousel albums, and Instagram Reels via the official Meta Graph API.</li>
              <li><strong>YouTube (Google LLC):</strong> Uploading standard videos and YouTube Shorts via the official YouTube Data API v3.</li>
              <li><strong>TikTok:</strong> Scheduling and publishing short-form video content via the official TikTok Content Posting API.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">3</span>
              Third-Party Platform Policies & Compliance
            </h2>
            <p>
              Your use of Automation is additionally contingent upon adhering to the rules, policies, and guidelines established by each connected social platform:
            </p>
            
            <div className="mt-4 space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  Meta Platforms (Instagram) Compliance
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  You agree to comply with the{' '}
                  <a href="https://www.facebook.com/terms.php" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Meta Terms of Service
                  </a>{' '}
                  and Instagram Community Guidelines. Prohibited content or spamming will lead to immediate service suspension.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  YouTube (Google LLC) Compliance
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  By using YouTube publishing features, you agree to be bound by the{' '}
                  <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    YouTube Terms of Service
                  </a>{' '}
                  and YouTube Community Guidelines.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                  TikTok Compliance
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  You must comply with the{' '}
                  <a href="https://www.tiktok.com/legal/page/row/terms-of-service/en" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    TikTok Terms of Service
                  </a>{' '}
                  and TikTok Community Guidelines for all video content scheduled through Automation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">4</span>
              User Content Ownership & Acceptable Use
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>You Retain Ownership:</strong> You retain 100% intellectual property ownership of all videos, graphics, photos, captions, and media you upload to Automation.
              </li>
              <li>
                <strong>Copyright & Authorizations:</strong> You affirm that you hold all required copyright licenses, authorizations, and consents for all media files scheduled through the system.
              </li>
              <li>
                <strong>Prohibited Uses:</strong> You may not use the service to post defamatory, obscene, deceptive, copyright-infringing, or malicious content, or to execute botting/spam campaigns.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">5</span>
              Account Termination & Access Revocation
            </h2>
            <p className="text-sm">
              You are free to terminate your Automation account or disconnect any connected social channels at any time via the <strong>Social Accounts</strong> settings menu. Upon disconnection, stored authorization tokens and queued pending posts for that channel are immediately deleted.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">6</span>
              Limitation of Liability
            </h2>
            <p className="text-sm">
              Automation is provided "as is" without warranty of uninterrupted service. We are not liable for any account restrictions, rate limits, or removals enacted by Meta, Google, or TikTok on your social media channels.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">7</span>
              Contact Us
            </h2>
            <p className="text-sm">
              For questions regarding these Terms, contact our legal team at: <strong>legal@automation.bikinkafe.id</strong>.
            </p>
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

export default TermsOfService;
