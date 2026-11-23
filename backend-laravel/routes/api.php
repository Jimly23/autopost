<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstagramController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\PostController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ─── Health & CSRF Endpoints ──────────────────────────────────────────────
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'Automation API is running',
        'data' => [
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'environment' => config('app.env'),
        ],
    ]);
});

Route::get('/csrf-token', function (Request $request) {
    return response()->json([
        'success' => true,
        'data' => [
            'csrfToken' => csrf_token(),
        ],
    ]);
});

// ─── Auth Routes ──────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'changePassword']);
});

// ─── Instagram Routes ─────────────────────────────────────────────────────
Route::prefix('instagram')->group(function () {
    Route::get('/connect', [InstagramController::class, 'connect']);
    Route::get('/callback', [InstagramController::class, 'callback']);
    Route::get('/accounts', [InstagramController::class, 'listAccounts']);
    Route::get('/accounts/{id}', [InstagramController::class, 'getAccount']);
    Route::delete('/accounts/{id}', [InstagramController::class, 'deleteAccount']);
    Route::get('/accounts/{id}/profile', [InstagramController::class, 'getProfile']);
});

// ─── Post Routes ──────────────────────────────────────────────────────────
Route::prefix('posts')->group(function () {
    Route::get('/', [PostController::class, 'listPosts']);
    Route::post('/', [PostController::class, 'createPost']);
    Route::get('/{id}', [PostController::class, 'getPost']);
    Route::put('/{id}', [PostController::class, 'updatePost']);
    Route::delete('/{id}', [PostController::class, 'deletePost']);
    Route::post('/{id}/publish', [PostController::class, 'publishPost']);
    Route::get('/{id}/status', [PostController::class, 'getPostStatus']);
});

// ─── Dashboard Routes ─────────────────────────────────────────────────────
Route::prefix('dashboard')->group(function () {
    Route::get('/overview', [DashboardController::class, 'overview']);
});

// ─── Media Routes ─────────────────────────────────────────────────────────
Route::prefix('media')->group(function () {
    Route::post('/upload', [MediaController::class, 'uploadMediaFile']);
    Route::get('/', [MediaController::class, 'listUploadedMedia']);
});
