<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy — Foxman</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between selection:bg-blue-600 selection:text-white">
    <!-- Navbar -->
    <header class="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" class="flex items-center gap-2">
                <span class="text-xl font-black text-slate-900 tracking-tight">🦊 Foxman</span>
            </a>
            <div class="flex items-center gap-4 text-xs font-semibold">
                <a href="/" class="text-slate-600 hover:text-blue-600 transition-colors">&larr; Home</a>
                <a href="/terms-of-service" class="text-slate-600 hover:text-blue-600 transition-colors">Terms of Service</a>
                <a href="{{ env('FRONTEND_URL', 'https://automation-social.netlify.app') }}/login" class="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    Dashboard
                </a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div class="mb-10 text-center">
            <span class="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
                Legal & Security Compliance
            </span>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-2">Last updated: November 25, 2026 • Effective immediately</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8 leading-relaxed text-sm text-slate-700">
            <!-- 1. Introduction -->
            <section>
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">1. Introduction</h2>
                <p>
                    Welcome to <strong>Foxman</strong> ("we", "our", or "us"). Foxman is a multi-platform social media management and scheduling application designed to help creators and businesses manage, schedule, and publish video and image content to supported social networks, including YouTube, Meta Instagram, and TikTok.
                </p>
                <p class="mt-2">
                    We value your privacy and are committed to protecting the information you share with us. This Privacy Policy details how we collect, store, protect, and utilize your personal information and third-party social media data.
                </p>
            </section>

            <!-- 2. Information We Collect -->
            <section>
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">2. Information We Collect</h2>
                <p>To enable automated content scheduling and publication, Foxman collects:</p>
                <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                    <li><strong>Account Credentials:</strong> Name, work email address, and encrypted authentication credentials for your Foxman workspace.</li>
                    <li><strong>Third-Party Platform OAuth Data:</strong>
                        <ul class="list-circle pl-5 mt-1 space-y-1">
                            <li><strong>Google / YouTube:</strong> YouTube Channel ID, channel title, channel avatar thumbnail, and publication status obtained via Google OAuth 2.0.</li>
                            <li><strong>Meta (Instagram Business):</strong> Professional account ID, username, and account profile image.</li>
                            <li><strong>TikTok:</strong> Open ID, profile handle, and authorized video publishing scopes.</li>
                        </ul>
                    </li>
                    <li><strong>Encrypted OAuth Tokens:</strong> Access tokens and refresh tokens necessary to interact with third-party APIs on your behalf. These tokens are encrypted at rest using industry-standard AES-256-GCM encryption.</li>
                    <li><strong>User-Uploaded Content:</strong> Video files (MP4, MOV), image assets (JPEG, PNG, WEBP), descriptions, captions, tags, and scheduled publication times.</li>
                </ul>
            </section>

            <!-- 3. Purpose & Use of Data -->
            <section>
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">3. How We Use Your Data</h2>
                <p>Foxman uses the collected information strictly for:</p>
                <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                    <li>Publishing and uploading your selected video and photo media directly to your authorized YouTube channels or Instagram profiles according to your scheduled timeline.</li>
                    <li>Refreshing expired session tokens automatically via refresh tokens so scheduled tasks execute reliably.</li>
                    <li>Displaying publishing analytics and connection status inside your private workspace dashboard.</li>
                </ul>
                <div class="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                    <strong>Zero Monetization Policy:</strong> Foxman does not sell, rent, lease, or trade your personal data, uploaded media files, or Google/YouTube user information to any third parties, advertisers, or AI model training databases.
                </div>
            </section>

            <!-- 4. Google API Services & YouTube Compliance -->
            <section class="border-t border-slate-100 pt-6">
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-red-600"></span>
                    4. Google API Services & YouTube Limited Use Disclosure
                </h2>
                <p>
                    Foxman's integration with YouTube relies on the official <strong>YouTube Data API v3</strong>. By connecting your Google account to Foxman, you acknowledge and agree that:
                </p>
                <ul class="list-disc pl-5 mt-2 space-y-2 text-slate-600">
                    <li>
                        Your use of YouTube features is subject to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-semibold underline">YouTube Terms of Service</a> and the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-semibold underline">Google Privacy Policy</a>.
                    </li>
                    <li>
                        <strong>Limited Use Compliance:</strong> Foxman's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-semibold underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
                    </li>
                    <li>
                        We strictly request only the minimum necessary Google scopes required to perform the intended actions:
                        <code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-red-600">https://www.googleapis.com/auth/youtube.upload</code> and <code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-red-600">https://www.googleapis.com/auth/youtube.readonly</code>.
                    </li>
                </ul>
            </section>

            <!-- 5. User Control & Data Deletion -->
            <section class="border-t border-slate-100 pt-6">
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">5. User Control, Revocation & Data Deletion</h2>
                <p>You maintain full sovereignty over your data and linked accounts:</p>
                <ul class="list-disc pl-5 mt-2 space-y-1.5 text-slate-600">
                    <li>
                        <strong>In-App Disconnect:</strong> You can disconnect your YouTube or social media accounts at any moment from the "Koneksi Akun" dashboard settings. Upon disconnection, stored tokens are permanently purged from our database immediately.
                    </li>
                    <li>
                        <strong>Revoking via Google:</strong> In addition to our in-app disconnect option, you can independently inspect or revoke Foxman's access at any time via the official Google Security Permissions page at: <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold">https://security.google.com/settings/security/permissions</a>.
                    </li>
                    <li>
                        <strong>Full Account Deletion:</strong> Users may request complete deletion of their account and all associated data by contacting support at <a href="mailto:jimlyasidqi23@gmail.com" class="text-blue-600 underline">jimlyasidqi23@gmail.com</a>.
                    </li>
                </ul>
            </section>

            <!-- 6. Contact Information -->
            <section class="border-t border-slate-100 pt-6">
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">6. Contact Information</h2>
                <p>For questions, privacy inquiries, or data compliance concerns regarding Foxman, please contact:</p>
                <div class="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <p><strong>Application Name:</strong> Foxman</p>
                    <p><strong>Developer / Operator:</strong> Jimly Assidqi Hardiansyah</p>
                    <p><strong>Developer Email:</strong> <a href="mailto:jimlyasidqi23@gmail.com" class="text-blue-600 underline">jimlyasidqi23@gmail.com</a></p>
                    <p><strong>Official Web Domain:</strong> https://automation.bikinkafe.id</p>
                </div>
            </section>
        </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 text-center">
        <p>&copy; {{ date('Y') }} Foxman. All rights reserved. | <a href="/terms-of-service" class="hover:underline">Terms of Service</a></p>
    </footer>
</body>
</html>