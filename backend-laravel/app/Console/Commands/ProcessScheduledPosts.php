<?php

namespace App\Console\Commands;

use App\Models\Post;
use App\Models\PublishingLog;
use App\Services\Instagram\InstagramPublishingService;
use App\Services\Instagram\InstagramTokenService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessScheduledPosts extends Command
{
    protected $signature = 'posts:process-scheduled {--recover : Recover stuck processing posts first}';
    protected $description = 'Process scheduled posts that are due for publishing to Instagram';

    protected const MAX_RETRY_ATTEMPTS = 3;

    protected InstagramTokenService $tokenService;
    protected InstagramPublishingService $publishingService;

    public function __construct(
        InstagramTokenService $tokenService,
        InstagramPublishingService $publishingService
    ) {
        parent::__construct();
        $this->tokenService = $tokenService;
        $this->publishingService = $publishingService;
    }

    public function handle(): int
    {
        if ($this->option('recover')) {
            $this->recoverStuckPosts();
        }

        $now = Carbon::now();

        $duePosts = Post::where('status', 'scheduled')
            ->where('scheduled_at', '<=', $now)
            ->with(['socialAccount'])
            ->orderBy('scheduled_at', 'asc')
            ->take(10)
            ->get();

        if ($duePosts->isEmpty()) {
            return Command::SUCCESS;
        }

        $this->info("Scheduler: Found {$duePosts->count()} post(s) due for publishing");
        Log::info("Scheduler: Found {$duePosts->count()} post(s) due for publishing");

        foreach ($duePosts as $post) {
            $this->processOnePost($post);
        }

        return Command::SUCCESS;
    }

    /**
     * Process a single scheduled post with optimistic locking.
     */
    protected function processOnePost(Post $post): void
    {
        // Optimistic lock
        $updated = Post::where('id', $post->id)
            ->where('status', 'scheduled')
            ->update(['status' => 'processing']);

        if ($updated === 0) {
            $this->line("Scheduler: Post {$post->id} already being processed");
            return;
        }

        PublishingLog::create([
            'post_id' => $post->id,
            'action' => 'scheduled_publish_start',
            'status' => 'processing',
            'created_at' => Carbon::now(),
        ]);

        try {
            $tokenData = $this->tokenService->getDecryptedToken($post->social_account_id);

            $result = $this->publishingService->publishContent(
                $tokenData['accessToken'],
                $post->socialAccount->platform_user_id,
                [
                    'mediaType' => $post->media_type,
                    'mediaUrl' => $post->media_url,
                    'caption' => $post->caption,
                ]
            );

            Post::where('id', $post->id)->update([
                'status' => 'published',
                'published_at' => Carbon::now(),
                'platform_post_id' => $result['mediaId'],
                'error_message' => null,
            ]);

            PublishingLog::create([
                'post_id' => $post->id,
                'action' => 'scheduled_publish_complete',
                'status' => 'success',
                'response_data' => json_encode([
                    'containerId' => $result['containerId'],
                    'mediaId' => $result['mediaId'],
                ]),
                'created_at' => Carbon::now(),
            ]);

            $this->info("Scheduler: Post {$post->id} published successfully to @{$post->socialAccount->username}");
            Log::info("Scheduler: Post {$post->id} published successfully to @{$post->socialAccount->username}");
        } catch (\Throwable $e) {
            $this->error("Scheduler: Failed to publish post {$post->id}: {$e->getMessage()}");
            Log::error("Scheduler: Failed to publish post {$post->id}: {$e->getMessage()}");

            $retryCount = PublishingLog::where('post_id', $post->id)
                ->where('action', 'scheduled_publish_retry')
                ->count();

            if ($retryCount < self::MAX_RETRY_ATTEMPTS) {
                Post::where('id', $post->id)->update([
                    'status' => 'scheduled',
                    'error_message' => "Retry " . ($retryCount + 1) . "/" . self::MAX_RETRY_ATTEMPTS . ": {$e->getMessage()}",
                ]);

                PublishingLog::create([
                    'post_id' => $post->id,
                    'action' => 'scheduled_publish_retry',
                    'status' => 'retrying',
                    'error_message' => $e->getMessage(),
                    'created_at' => Carbon::now(),
                ]);
            } else {
                Post::where('id', $post->id)->update([
                    'status' => 'failed',
                    'error_message' => "Max retries exceeded. Last error: {$e->getMessage()}",
                ]);

                PublishingLog::create([
                    'post_id' => $post->id,
                    'action' => 'scheduled_publish_failed',
                    'status' => 'failed',
                    'error_message' => "Max retries (" . self::MAX_RETRY_ATTEMPTS . ") exceeded: {$e->getMessage()}",
                    'created_at' => Carbon::now(),
                ]);
            }
        }
    }

    /**
     * Recover stuck posts.
     */
    protected function recoverStuckPosts(): void
    {
        $stuckCount = Post::where('status', 'processing')->update([
            'status' => 'scheduled',
            'error_message' => 'Recovered after server restart',
        ]);

        if ($stuckCount > 0) {
            $this->info("Scheduler: Recovered {$stuckCount} stuck post(s)");
            Log::info("Scheduler: Recovered {$stuckCount} stuck post(s)");
        }
    }
}
