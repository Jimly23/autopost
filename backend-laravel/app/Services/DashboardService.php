<?php

namespace App\Services;

use App\Models\Post;
use App\Models\SocialAccount;
use Carbon\Carbon;

class DashboardService
{
    /**
     * Get dashboard overview metrics for a user.
     */
    public function getOverview(string $userId): array
    {
        $now = Carbon::now();

        $totalAccounts = SocialAccount::where('user_id', $userId)
            ->where('platform', 'instagram')
            ->count();

        $totalPosts = Post::where('user_id', $userId)->count();
        $scheduledPosts = Post::where('user_id', $userId)->where('status', 'scheduled')->count();
        $publishedPosts = Post::where('user_id', $userId)->where('status', 'published')->count();
        $failedPosts = Post::where('user_id', $userId)->where('status', 'failed')->count();

        $recentPosts = Post::where('user_id', $userId)
            ->with(['socialAccount:id,username'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get(['id', 'caption', 'media_type', 'status', 'scheduled_at', 'published_at', 'created_at', 'social_account_id']);

        $upcomingScheduled = Post::where('user_id', $userId)
            ->where('status', 'scheduled')
            ->where('scheduled_at', '>=', $now)
            ->with(['socialAccount:id,username'])
            ->orderBy('scheduled_at', 'asc')
            ->take(10)
            ->get(['id', 'caption', 'media_type', 'scheduled_at', 'social_account_id']);

        return [
            'totalAccounts' => $totalAccounts,
            'totalPosts' => $totalPosts,
            'scheduledPosts' => $scheduledPosts,
            'publishedPosts' => $publishedPosts,
            'failedPosts' => $failedPosts,
            'recentPosts' => $recentPosts,
            'upcomingScheduled' => $upcomingScheduled,
        ];
    }
}
