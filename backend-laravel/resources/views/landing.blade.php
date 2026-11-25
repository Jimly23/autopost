<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Foxman — Social Media Automation & Video Publishing Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-[#090a0f] text-slate-100 min-h-screen flex flex-col justify-between selection:bg-blue-600 selection:text-white">
    <!-- Navbar -->
    <header class="border-b border-white/[0.08] bg-[#0b0c12]/80 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 font-bold text-white text-base">
                    🦊
                </div>
                <div>
                    <span class="font-extrabold text-white text-lg tracking-tight">Foxman</span>
                    <span class="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Automation SaaS
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <a href="/privacy-policy" class="text-xs font-medium text-slate-400 hover:text-white transition-colors">Privacy</a>
                <a href="/terms-of-service" class="text-xs font-medium text-slate-400 hover:text-white transition-colors">Terms</a>
                <a href="{{ env('FRONTEND_URL', 'https://automation-social.netlify.app') }}/login" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/30">
                    Buka Dashboard &rarr;
                </a>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <main class="max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center flex-1 flex flex-col justify-center items-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-medium text-slate-300 mb-6">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Multi-Platform Automated Publishing Platform
        </div>

        <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl">
            Automate & Schedule Content for <span class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-purple-500">YouTube, Instagram & TikTok</span>
        </h1>

        <p class="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            <strong>Foxman</strong> is a centralized social media management SaaS designed for creators, digital marketers, and agencies to organize, schedule, and publish video and image content directly to verified social media accounts using official developer APIs.
        </p>

        <!-- CTA Buttons -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="{{ env('FRONTEND_URL', 'https://automation-social.netlify.app') }}/login" class="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all">
                Login ke Workspace
            </a>
            <a href="/privacy-policy" class="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-sm transition-all">
                Kebijakan Privasi
            </a>
        </div>

        <!-- Key Capabilities Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 text-left max-w-4xl w-full">
            <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <div class="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center font-bold text-lg mb-4">
                    ▶
                </div>
                <h3 class="text-sm font-bold text-white">YouTube Integration</h3>
                <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                    Upload long-form videos and vertical YouTube Shorts directly to your authorized channels with custom metadata, privacy controls, and scheduling.
                </p>
            </div>

            <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <div class="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center font-bold text-lg mb-4">
                    📷
                </div>
                <h3 class="text-sm font-bold text-white">Instagram Business</h3>
                <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                    Publish feed photos, carousel posts, and Reels to connected Instagram professional profiles via official Meta Graph APIs.
                </p>
            </div>

            <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg mb-4">
                    ⏱
                </div>
                <h3 class="text-sm font-bold text-white">Smart Scheduler</h3>
                <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                    Queue drafts, organize publishing calendars, and execute automated time-based deliveries around the clock without manual intervention.
                </p>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/[0.08] bg-[#07080c] py-8 text-xs text-slate-500">
        <div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2">
                <span class="font-bold text-slate-300">Foxman</span> &copy; {{ date('Y') }}. All rights reserved.
            </div>
            <div class="flex items-center gap-6">
                <a href="/privacy-policy" class="hover:text-slate-300 transition-colors">Privacy Policy</a>
                <a href="/terms-of-service" class="hover:text-slate-300 transition-colors">Terms of Service</a>
                <a href="mailto:jimlyasidqi23@gmail.com" class="hover:text-slate-300 transition-colors">Contact Support</a>
            </div>
        </div>
    </footer>
</body>
</html>