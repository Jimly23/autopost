<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Exception;

class PostController extends Controller
{
    protected PostService $postService;

    public function __construct(PostService $postService)
    {
        $this->postService = $postService;
    }

    /**
     * POST /api/posts
     */
    public function createPost(Request $request): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'socialAccountId' => 'required|uuid',
            'title' => 'nullable|string|max:100',
            'caption' => 'nullable|string|max:5000',
            'mediaType' => 'required|string|in:IMAGE,VIDEO,REELS,SHORTS',
            'mediaUrl' => 'required|url',
            'privacyStatus' => 'nullable|string|in:public,unlisted,private',
            'scheduledAt' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors()->toArray());
        }

        try {
            $post = $this->postService->createPost($userId, $validator->validated());
            return ApiResponse::created(['post' => $post], 'Post created successfully');
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }

    /**
     * GET /api/posts
     */
    public function listPosts(Request $request): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $status = $request->query('status');
        $page = $request->query('page', 1);
        $limit = $request->query('limit', 20);

        try {
            $result = $this->postService->getUserPosts($userId, [
                'status' => $status,
                'page' => $page,
                'limit' => $limit,
            ]);
            return ApiResponse::success($result);
        } catch (\Throwable $e) {
            return ApiResponse::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/posts/:id
     */
    public function getPost(Request $request, string $id): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $post = $this->postService->getPostById($userId, $id);
            return ApiResponse::success(['post' => $post]);
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }

    /**
     * PUT /api/posts/:id
     */
    public function updatePost(Request $request, string $id): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'socialAccountId' => 'nullable|uuid',
            'title' => 'nullable|string|max:100',
            'caption' => 'nullable|string|max:5000',
            'mediaType' => 'nullable|string|in:IMAGE,VIDEO,REELS,SHORTS',
            'mediaUrl' => 'nullable|url',
            'privacyStatus' => 'nullable|string|in:public,unlisted,private',
            'scheduledAt' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors()->toArray());
        }

        try {
            $post = $this->postService->updatePost($userId, $id, $validator->validated());
            return ApiResponse::success(['post' => $post], 'Post updated successfully');
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }

    /**
     * DELETE /api/posts/:id
     */
    public function deletePost(Request $request, string $id): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $this->postService->deletePost($userId, $id);
            return ApiResponse::success(null, 'Post deleted successfully');
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }

    /**
     * POST /api/posts/:id/publish
     */
    public function publishPost(Request $request, string $id): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $post = $this->postService->publishPost($userId, $id);
            return ApiResponse::success(['post' => $post], 'Post published successfully');
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }

    /**
     * GET /api/posts/:id/status
     */
    public function getPostStatus(Request $request, string $id): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $status = $this->postService->getPostStatus($userId, $id);
            return ApiResponse::success(['status' => $status]);
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }
}
