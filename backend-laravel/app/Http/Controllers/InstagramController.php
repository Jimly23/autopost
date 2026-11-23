<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Post;
use App\Models\SocialAccount;
use App\Services\EncryptionService;
use App\Services\Instagram\InstagramOAuthService;
use App\Services\Instagram\InstagramProfileService;
use App\Services\Instagram\InstagramTokenService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Exception;

class InstagramController extends Controller
{
    protected InstagramOAuthService $oauthService;
    protected InstagramTokenService $tokenService;
    protected InstagramProfileService $profileService;
    protected EncryptionService $encryptionService;

    public function __construct(
        InstagramOAuthService $oauthService,
        InstagramTokenService $tokenService,
        InstagramProfileService $profileService,
        EncryptionService $encryptionService
    ) {
        $this->oauthService = $oauthService;
        $this->tokenService = $tokenService;
        $this->profileService = $profileService;
        $this->encryptionService = $encryptionService;
    }

    /**
     * GET /api/instagram/connect
     */
    public function connect(Request $request): mixed
    {
        if (!$this->oauthService->isConfigured()) {
            return ApiResponse::error(
                'Instagram API is not configured. Please set META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI in your environment.',
                503
            );
        }

        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized('Authentication required to connect social account');
        }

        $statePayload = json_encode([
            'userId' => $userId,
            'nonce' => bin2hex(random_bytes(16)),
            'timestamp' => Carbon::now()->timestamp * 1000,
        ]);

        $state = bin2hex($this->encryptionService->encrypt($statePayload));
        $request->session()->put('oauthState', $state);
        $request->session()->save();

        $authData = $this->oauthService->generateAuthorizationUrl($state);

        return redirect()->away($authData['url']);
    }

    /**
     * GET /api/instagram/callback
     */
    public function callback(Request $request): RedirectResponse
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        $oauthError = $request->query('error');
        $errorReason = $request->query('error_reason');
        $errorDescription = $request->query('error_description');

        if ($oauthError) {
            Log::warning('Instagram OAuth denied:', [
                'oauthError' => $oauthError,
                'reason' => $errorReason,
                'description' => $errorDescription,
            ]);
            $msg = urlencode($errorDescription ?: 'Access denied');
            return redirect()->away("{$frontendUrl}/instagram/connect?status=error&message={$msg}");
        }

        $code = $request->query('code');
        $state = $request->query('state');

        if (!$code || !$state) {
            $msg = urlencode('No authorization code or state received');
            return redirect()->away("{$frontendUrl}/instagram/connect?status=error&message={$msg}");
        }

        $targetUserId = $request->session()->get('userId') ?? Auth::id();

        try {
            $rawCipher = hex2bin($state);
            $decryptedJson = $this->encryptionService->decrypt($rawCipher);
            $parsed = json_decode($decryptedJson, true);

            if (empty($parsed['userId']) || empty($parsed['timestamp']) || (Carbon::now()->timestamp * 1000 - $parsed['timestamp']) > 15 * 60 * 1000) {
                throw new Exception('OAuth state expired');
            }

            $targetUserId = $parsed['userId'];
        } catch (\Throwable $e) {
            $sessionState = $request->session()->get('oauthState');
            if ($sessionState && $state === $sessionState && $targetUserId) {
                // Session match fallback
            } else {
                Log::warning('Invalid OAuth state validation failed: ' . $e->getMessage());
                $msg = urlencode('Invalid OAuth state. Please try again.');
                return redirect()->away("{$frontendUrl}/instagram/connect?status=error&message={$msg}");
            }
        }

        if (!$targetUserId) {
            Log::warning('No userId associated with OAuth callback');
            $msg = urlencode('User session not found. Please log in again.');
            return redirect()->away("{$frontendUrl}/instagram/connect?status=error&message={$msg}");
        }

        $request->session()->forget('oauthState');

        try {
            // Step 1: Exchange code for token
            $tokenResult = $this->oauthService->exchangeCodeForToken($code);

            // Step 2: Exchange for long-lived token
            $longLived = $this->oauthService->exchangeForLongLivedToken($tokenResult['accessToken']);

            // Step 3: Fetch profile
            $profile = $this->profileService->getUserProfile($longLived['accessToken'], $tokenResult['userId']);

            // Step 4: Upsert social account
            $socialAccount = SocialAccount::updateOrCreate(
                [
                    'platform' => 'instagram',
                    'platform_user_id' => $profile['platformUserId'],
                ],
                [
                    'user_id' => $targetUserId,
                    'username' => $profile['username'],
                    'account_type' => $profile['accountType'],
                    'profile_picture' => $profile['profilePicture'],
                ]
            );

            // Step 5: Store encrypted token
            $scopes = config('instagram.scopes', []);
            $this->tokenService->storeToken($socialAccount->id, [
                'accessToken' => $longLived['accessToken'],
                'tokenType' => $longLived['tokenType'],
                'expiresIn' => $longLived['expiresIn'],
                'scopes' => is_array($scopes) ? implode(',', $scopes) : $scopes,
            ]);

            Log::info("Instagram account connected: @{$profile['username']} for user {$targetUserId}");

            $accountName = urlencode($profile['username']);
            return redirect()->away("{$frontendUrl}/instagram/connect?status=success&account={$accountName}");
        } catch (\Throwable $e) {
            Log::error('Instagram callback error: ' . $e->getMessage());
            $msg = urlencode($e->getMessage() ?: 'Connection failed');
            return redirect()->away("{$frontendUrl}/instagram/connect?status=error&message={$msg}");
        }
    }

    /**
     * GET /api/instagram/accounts
     */
    public function listAccounts(Request $request): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $accounts = SocialAccount::where('user_id', $userId)
            ->where('platform', 'instagram')
            ->with(['token'])
            ->orderBy('created_at', 'desc')
            ->get();

        $accountsWithStatus = $accounts->map(function ($account) {
            $token = $account->token;
            $tokenStatus = null;

            if ($token) {
                $isExpired = $token->expires_at ? Carbon::now()->gt($token->expires_at) : false;
                $isNearExpiry = $token->expires_at ? $this->tokenService->isTokenNearExpiry($token->expires_at) : false;
                $tokenStatus = [
                    'isExpired' => $isExpired,
                    'isNearExpiry' => $isNearExpiry,
                    'expiresAt' => $token->expires_at,
                ];
            }

            return [
                'id' => $account->id,
                'platform' => $account->platform,
                'platformUserId' => $account->platform_user_id,
                'username' => $account->username,
                'accountType' => $account->account_type,
                'profilePicture' => $account->profile_picture,
                'createdAt' => $account->created_at,
                'updatedAt' => $account->updated_at,
                'tokenStatus' => $tokenStatus,
            ];
        });

        return ApiResponse::success(['accounts' => $accountsWithStatus]);
    }

    /**
     * GET /api/instagram/accounts/:id
     */
    public function getAccount(Request $request, string $id): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $account = SocialAccount::where('id', $id)
            ->where('user_id', $userId)
            ->where('platform', 'instagram')
            ->with(['token'])
            ->first();

        if (!$account) {
            return ApiResponse::notFound('Instagram account not found');
        }

        $token = $account->token;
        $tokenStatus = null;
        if ($token) {
            $isExpired = $token->expires_at ? Carbon::now()->gt($token->expires_at) : false;
            $isNearExpiry = $token->expires_at ? $this->tokenService->isTokenNearExpiry($token->expires_at) : false;
            $tokenStatus = [
                'isExpired' => $isExpired,
                'isNearExpiry' => $isNearExpiry,
                'expiresAt' => $token->expires_at,
            ];
        }

        return ApiResponse::success([
            'account' => [
                'id' => $account->id,
                'platform' => $account->platform,
                'platformUserId' => $account->platform_user_id,
                'username' => $account->username,
                'accountType' => $account->account_type,
                'profilePicture' => $account->profile_picture,
                'createdAt' => $account->created_at,
                'updatedAt' => $account->updated_at,
                'tokenStatus' => $tokenStatus,
            ],
        ]);
    }

    /**
     * DELETE /api/instagram/accounts/:id
     */
    public function deleteAccount(Request $request, string $id): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $account = SocialAccount::where('id', $id)
            ->where('user_id', $userId)
            ->where('platform', 'instagram')
            ->first();

        if (!$account) {
            return ApiResponse::notFound('Instagram account not found');
        }

        $pendingPosts = Post::where('social_account_id', $account->id)
            ->whereIn('status', ['scheduled', 'processing'])
            ->count();

        if ($pendingPosts > 0) {
            return ApiResponse::error(
                "Cannot disconnect account with {$pendingPosts} pending post(s). Cancel or publish them first.",
                400
            );
        }

        $account->delete();

        Log::info("Instagram account disconnected: @{$account->username} by user {$userId}");

        return ApiResponse::success(null, 'Instagram account disconnected successfully');
    }

    /**
     * GET /api/instagram/accounts/:id/profile
     */
    public function getProfile(Request $request, string $id): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $account = SocialAccount::where('id', $id)
            ->where('user_id', $userId)
            ->where('platform', 'instagram')
            ->first();

        if (!$account) {
            return ApiResponse::notFound('Instagram account not found');
        }

        try {
            $tokenData = $this->tokenService->getDecryptedToken($account->id);
            $profile = $this->profileService->getUserProfile($tokenData['accessToken'], $account->platform_user_id);

            $account->username = $profile['username'];
            $account->account_type = $profile['accountType'];
            $account->profile_picture = $profile['profilePicture'];
            $account->save();

            return ApiResponse::success(['profile' => $profile]);
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
