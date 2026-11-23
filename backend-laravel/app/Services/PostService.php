<?php

namespace App\Services;

use App\Models\Post;
use App\Models\PublishingLog;
use App\Models\SocialAccount;
use App\Services\Instagram\InstagramPublishingService;
use App\Services\Instagram\InstagramTokenService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class PostService
{
    protected InstagramTokenService $tokenService;
    protected InstagramPublishingService $publishingService;

    public function __construct(
        InstagramTokenService $tokenService,
        InstagramPublishingService $publishingService
    ) {
        $this->tokenService = $tokenService;
        $this->publishingService = $publishingService;
    }

    /**
     * Create a new post.
     */
    public function createPost(string $userId, array $data): Post
    {
        $account = SocialAccount::where('id', $data['socialAccountId'])
            ->where('user_id', $userId)
            ->first();

        if (!$account) {
            $error = new Exception('Social account not found or does not belong to you');
            $error->status = 404;
            throw $error;
        }

        $scheduledAt = !empty($data['scheduledAt']) ? Carbon::parse($data['scheduledAt']) : null;
        $status = $scheduledAt ? 'scheduled' : 'draft';

        $post = Post::create([
            'user_id' => $userId,
            'social_account_id' => $data['socialAccountId'],
            'caption' => $data['caption'] ?? null,
            'media_type' => $data['mediaType'],
            'media_url' => $data['mediaUrl'],
            'scheduled_at' => $scheduledAt,
            'status' => $status,
        ]);

        return $post->load(['socialAccount:id,username,platform']);
    }

    /**
     * Get all posts for a user with optional filters and pagination.
     */
    public function getUserPosts(string $userId, array $params = []): array
    {
        $status = $params['status'] ?? null;
        $page = isset($params['page']) ? max((int) $params['page'], 1) : 1;
        $limit = isset($params['limit']) ? min(max((int) $params['limit'], 1), 100) : 20;

        $query = Post::where('user_id', $userId);

        if ($status) {
            $query->where('status', $status);
        }

        $total = $query->count();
        $skip = ($page - 1) * $limit;

        $posts = $query->with(['socialAccount:id,username,platform'])
            ->orderBy('created_at', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        return [
            'posts' => $posts,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ];
    }

    /**
     * Get a single post by ID ensuring ownership.
     */
    public function getPostById(string $userId, string $postId): Post
    {
        $post = Post::where('id', $postId)
            ->where('user_id', $userId)
            ->with([
                'socialAccount:id,username,platform',
                'publishingLogs' => function ($query) {
                    $query->orderBy('created_at', 'desc')->take(10);
                },
            ])
            ->first();

        if (!$post) {
            $error = new Exception('Post not found');
            $error->status = 404;
            throw $error;
        }

        return $post;
    }

    /**
     * Update a post. Only draft and scheduled posts can be edited.
     */
    public function updatePost(string $userId, string $postId, array $data): Post
    {
        $post = Post::where('id', $postId)
            ->where('user_id', $userId)
            ->first();

        if (!$post) {
            $error = new Exception('Post not found');
            $error->status = 404;
            throw $error;
        }

        if (!in_array($post->status, ['draft', 'scheduled'])) {
            $error = new Exception("Cannot edit a post with status \"{$post->status}\"");
            $error->status = 400;
            throw $error;
        }

        if (array_key_exists('caption', $data)) {
            $post->caption = $data['caption'];
        }
        if (array_key_exists('mediaType', $data)) {
            $post->media_type = $data['mediaType'];
        }
        if (array_key_exists('mediaUrl', $data)) {
            $post->media_url = $data['mediaUrl'];
        }
        if (array_key_exists('scheduledAt', $data)) {
            $scheduledAt = !empty($data['scheduledAt']) ? Carbon::parse($data['scheduledAt']) : null;
            $post->scheduled_at = $scheduledAt;
            $post->status = $scheduledAt ? 'scheduled' : 'draft';
        }

        if (!empty($data['socialAccountId'])) {
            $account = SocialAccount::where('id', $data['socialAccountId'])
                ->where('user_id', $userId)
                ->first();
            if (!$account) {
                $error = new Exception('Social account not found');
                $error->status = 404;
                throw $error;
            }
            $post->social_account_id = $data['socialAccountId'];
        }

        $post->save();

        return $post->load(['socialAccount:id,username,platform']);
    }

    /**
     * Delete a post. Only draft, scheduled, failed, and cancelled posts can be deleted.
     */
    public function deletePost(string $userId, string $postId): bool
    {
        $post = Post::where('id', $postId)
            ->where('user_id', $userId)
            ->first();

        if (!$post) {
            $error = new Exception('Post not found');
            $error->status = 404;
            throw $error;
        }

        if ($post->status === 'processing') {
            $error = new Exception('Cannot delete a post that is currently being processed');
            $error->status = 400;
            throw $error;
        }

        $post->delete();

        return true;
    }

    /**
     * Publish a post immediately.
     */
    public function publishPost(string $userId, string $postId): Post
    {
        // Step 1: Atomic status transition via transaction
        $post = DB::transaction(function () use ($userId, $postId) {
            $p = Post::where('id', $postId)
                ->where('user_id', $userId)
                ->with(['socialAccount'])
                ->lockForUpdate()
                ->first();

            if (!$p) {
                $error = new Exception('Post not found');
                $error->status = 404;
                throw $error;
            }

            if ($p->status === 'published') {
                $error = new Exception('Post is already published');
                $error->status = 400;
                throw $error;
            }

            if ($p->status === 'processing') {
                $error = new Exception('Post is currently being processed');
                $error->status = 400;
                throw $error;
            }

            if (!in_array($p->status, ['draft', 'scheduled', 'failed'])) {
                $error = new Exception("Cannot publish a post with status \"{$p->status}\"");
                $error->status = 400;
                throw $error;
            }

            $p->status = 'processing';
            $p->save();

            PublishingLog::create([
                'post_id' => $postId,
                'action' => 'publish_start',
                'status' => 'processing',
                'created_at' => Carbon::now(),
            ]);

            return $p;
        });

        // Step 2: Publish to Instagram outside the transaction
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

            $post->status = 'published';
            $post->published_at = Carbon::now();
            $post->platform_post_id = $result['mediaId'];
            $post->error_message = null;
            $post->save();

            PublishingLog::create([
                'post_id' => $postId,
                'action' => 'publish_complete',
                'status' => 'success',
                'response_data' => json_encode([
                    'containerId' => $result['containerId'],
                    'mediaId' => $result['mediaId'],
                ]),
                'created_at' => Carbon::now(),
            ]);

            return $post->load(['socialAccount:id,username,platform']);
        } catch (\Throwable $e) {
            Log::error("Publishing failed for post {$postId}: " . $e->getMessage());

            $post->status = 'failed';
            $post->error_message = $e->getMessage();
            $post->save();

            $igError = property_exists($e, 'igError') ? json_encode($e->igError) : null;

            PublishingLog::create([
                'post_id' => $postId,
                'action' => 'publish_failed',
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'response_data' => $igError,
                'created_at' => Carbon::now(),
            ]);

            throw $e;
        }
    }

    /**
     * Get the publishing status of a post.
     */
    public function getPostStatus(string $userId, string $postId): Post
    {
        $post = Post::where('id', $postId)
            ->where('user_id', $userId)
            ->select(['id', 'status', 'published_at', 'platform_post_id', 'error_message', 'scheduled_at'])
            ->with([
                'publishingLogs' => function ($query) {
                    $query->select(['id', 'post_id', 'action', 'status', 'error_message', 'created_at'])
                        ->orderBy('created_at', 'desc')
                        ->take(5);
                },
            ])
            ->first();

        if (!$post) {
            $error = new Exception('Post not found');
            $error->status = 404;
            throw $error;
        }

        return $post;
    }

    /**
     * Cancel a scheduled post.
     */
    public function cancelPost(string $userId, string $postId): Post
    {
        $post = Post::where('id', $postId)
            ->where('user_id', $userId)
            ->first();

        if (!$post) {
            $error = new Exception('Post not found');
            $error->status = 404;
            throw $error;
        }

        if ($post->status !== 'scheduled') {
            $error = new Exception('Only scheduled posts can be cancelled');
            $error->status = 400;
            throw $error;
        }

        $post->status = 'cancelled';
        $post->save();

        return $post;
    }
}
