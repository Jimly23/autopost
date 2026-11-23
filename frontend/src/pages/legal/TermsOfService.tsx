import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const TermsOfService: React.FC = () => {
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
              By accessing or using the <strong>Automation</strong> social media management platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">2</span>
              Description of Service
            </h2>
            <p>
              Automation provides tools for scheduling, managing, and publishing content to supported social media accounts (including Instagram Professional accounts via official Meta Graph API endpoints).
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">3</span>
              Meta Platform Policy Compliance
            </h2>
            <p>
              Users must strictly adhere to the Community Guidelines and Platform Policies of Meta Platforms, Inc. and Instagram:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1.5 text-sm">
              <li>You may not use Automation to publish spam, prohibited content, or violate intellectual property rights.</li>
              <li>You must have the proper rights and licenses for all media content uploaded to the platform.</li>
              <li>Any violation of Meta Platform Terms may result in immediate suspension of publishing capabilities.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">4</span>
              Account Ownership & Termination
            </h2>
            <p>
              You may terminate your account or disconnect your connected social media channels at any time through your dashboard settings. We reserve the right to suspend or terminate accounts that violate our terms or misuse system resources.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-sm font-semibold">5</span>
              Contact
            </h2>
            <p>
              For legal inquiries regarding these Terms, contact us at <strong>legal@automation.dev</strong>.
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