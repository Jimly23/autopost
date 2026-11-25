<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service — Foxman</title>
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
                <a href="/privacy-policy" class="text-slate-600 hover:text-blue-600 transition-colors">Privacy Policy</a>
                <a href="{{ env('FRONTEND_URL', 'https://automation-social.netlify.app') }}/login" class="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    Dashboard
                </a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div class="mb-10 text-center">
            <span class="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold uppercase tracking-wider mb-3">
                Terms of Use
            </span>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-2">Last updated: November 25, 2026</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8 leading-relaxed text-sm text-slate-700">
            <section>
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">1. Acceptance of Terms</h2>
                <p>
                    By accessing or using <strong>Foxman</strong> ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the services.
                </p>
            </section>

            <section>
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">2. Description of Service</h2>
                <p>
                    Foxman provides software tools for content creators and businesses to compose, schedule, and automate the distribution of media files (photos, videos, Shorts, and Reels) to authorized third-party platforms including YouTube, Instagram, and TikTok via official developer APIs.
                </p>
            </section>

            <section>
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">3. Third-Party Platform Terms</h2>
                <p>
                    When using Foxman to interact with supported third-party services, you explicitly agree to comply with the respective platform rules and policies:
                </p>
                <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                    <li>YouTube: Users are bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium underline">YouTube Terms of Service</a>.</li>
                    <li>Meta / Instagram: Users must comply with the <a href="https://www.facebook.com/terms.php" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium underline">Meta Terms of Service</a> and Community Standards.</li>
                    <li>TikTok: Users must comply with the <a href="https://www.tiktok.com/legal/page/row/terms-of-service/en" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium underline">TikTok Terms of Service</a>.</li>
                </ul>
            </section>

            <section>
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">4. User Responsibilities & Content Standards</h2>
                <p>You represent and warrant that:</p>
                <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                    <li>You own or hold valid licenses and rights for all media, audio, images, and text uploaded through Foxman.</li>
                    <li>Your content does not violate any copyright, intellectual property, defamation, or privacy laws.</li>
                    <li>You will not use the service to disseminate malware, spam, deceptive marketing, or harmful content.</li>
                </ul>
            </section>

            <section>
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">5. Disclaimer & Limitation of Liability</h2>
                <p>
                    Foxman is provided on an "as is" and "as available" basis without warranties of any kind. We are not liable for any third-party API rate limits, temporary account restrictions imposed by social media platforms, or interruptions caused by external API outages.
                </p>
            </section>

            <section class="border-t border-slate-100 pt-6">
                <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">6. Contact</h2>
                <p>Inquiries regarding these Terms of Service may be addressed to <a href="mailto:jimlyasidqi23@gmail.com" class="text-blue-600 underline">jimlyasidqi23@gmail.com</a>.</p>
            </section>
        </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 text-center">
        <p>&copy; {{ date('Y') }} Foxman. All rights reserved. | <a href="/privacy-policy" class="hover:underline">Privacy Policy</a></p>
    </footer>
</body>
</html>