<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Post;
use App\Models\SocialAccount;
use App\Services\EncryptionService;
use App\Services\YouTube\YouTubeOAuthService;
use App\Services\YouTube\YouTubeTokenService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Exception;

class YouTubeController extends Controller
{
    protected YouTubeOAuthService $oauthService;
    protected YouTubeTokenService $tokenService;
    protected EncryptionService $encryptionService;

    public function __construct(
        YouTubeOAuthService $oauthService,
        YouTubeTokenService $tokenService,
        EncryptionService $encryptionService
    ) {
        $this->oauthService = $oauthService;
        $this->tokenService = $tokenService;
        $this->encryptionService = $encryptionService;
    }

    /**
     * GET /api/youtube/connect or /api/auth/youtube/connect
     * Initiates Google OAuth for YouTube.
     */
    public function connect(Request $request): mixed
    {
        if (!$this->oauthService->isConfigured()) {
            return ApiResponse::error(
                'YouTube API is not configured. Please set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REDIRECT_URI in your environment.',
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
        $request->session()->put('ytOAuthState', $state);
        $request->session()->save();

        $authUrl = $this->oauthService->generateAuthorizationUrl($state);

        return redirect()->away($authUrl);
    }

    /**
     * GET /api/auth/youtube/callback
     * Google OAuth callback redirect URI.
     */
    public function callback(Request $request): RedirectResponse
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'https://automation-social.netlify.app'), '/');

        $oauthError = $request->query('error');
        if ($oauthError) {
            Log::warning('YouTube OAuth denied:', ['error' => $oauthError]);
            $msg = urlencode($request->query('error_description') ?: 'Google authorization was cancelled or denied');
            return redirect()->away("{$frontendUrl}/accounts?status=error&platform=youtube&message={$msg}");
        }

        $code = $request->query('code');
        $state = $request->query('state');

        if (!$code || !$state) {
            $msg = urlencode('No authorization code or state received from Google');
            return redirect()->away("{$frontendUrl}/accounts?status=error&platform=youtube&message={$msg}");
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
            $sessionState = $request->session()->get('ytOAuthState');
            if ($sessionState && $state === $sessionState && $targetUserId) {
                // Session match fallback
            } else {
                Log::warning('Invalid YouTube OAuth state: ' . $e->getMessage());
                $msg = urlencode('Invalid OAuth session state. Please try again.');
                return redirect()->away("{$frontendUrl}/accounts?status=error&platform=youtube&message={$msg}");
            }
        }

        if (!$targetUserId) {
            Log::warning('No userId associated with YouTube OAuth callback');
            $msg = urlencode('User session not found. Please log in again.');
            return redirect()->away("{$frontendUrl}/accounts?status=error&platform=youtube&message={$msg}");
        }

        $request->session()->forget('ytOAuthState');

        try {
            // 1. Exchange code for tokens (access_token + refresh_token)
            $tokens = $this->oauthService->exchangeCodeForTokens($code);

            // 2. Fetch YouTube Channel details
            $channel = $this->oauthService->getChannelProfile($tokens['accessToken']);

            // 3. Upsert social account
            $socialAccount = SocialAccount::updateOrCreate(
                [
                    'platform' => 'youtube',
                    'platform_user_id' => $channel['platformUserId'],
                ],
                [
                    'user_id' => $targetUserId,
                    'username' => $channel['username'],
                    'account_type' => 'channel',
                    'profile_picture' => $channel['profilePicture'],
                ]
            );

            // 4. Store encrypted tokens
            $this->tokenService->storeToken($socialAccount->id, [
                'accessToken' => $tokens['accessToken'],
                'refreshToken' => $tokens['refreshToken'],
                'expiresIn' => $tokens['expiresIn'],
                'tokenType' => $tokens['tokenType'],
                'scopes' => $tokens['scope'],
            ]);

            Log::info("YouTube channel connected: {$channel['username']} for user {$targetUserId}");

            $channelName = urlencode($channel['username']);
            return redirect()->away("{$frontendUrl}/accounts?status=success&platform=youtube&account={$channelName}");
        } catch (\Throwable $e) {
            Log::error('YouTube callback error: ' . $e->getMessage());
            $msg = urlencode($e->getMessage() ?: 'Connection failed');
            return redirect()->away("{$frontendUrl}/accounts?status=error&platform=youtube&message={$msg}");
        }
    }

    /**
     * GET /api/youtube/accounts
     * List all connected YouTube accounts for the current user.
     */
    public function listAccounts(Request $request): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $accounts = SocialAccount::where('user_id', $userId)
            ->where('platform', 'youtube')
            ->with(['tokens:social_account_id,expires_at,token_type'])
            ->get();

        $accountsData = $accounts->map(function ($acc) {
            return [
                'id' => $acc->id,
                'platform' => $acc->platform,
                'platformUserId' => $acc->platform_user_id,
                'username' => $acc->username,
                'accountType' => $acc->account_type,
                'profilePicture' => $acc->profile_picture,
                'connectedAt' => $acc->created_at?->toISOString(),
                'expiresAt' => $acc->tokens?->expires_at?->toISOString(),
            ];
        });

        return ApiResponse::success(['accounts' => $accountsData]);
    }

    /**
     * DELETE /api/youtube/accounts/{id}
     * Disconnect a YouTube account.
     */
    public function deleteAccount(Request $request, string $id): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $account = SocialAccount::where('id', $id)
            ->where('user_id', $userId)
            ->where('platform', 'youtube')
            ->first();

        if (!$account) {
            return ApiResponse::notFound('YouTube account not found');
        }

        Post::where('social_account_id', $id)
            ->whereIn('status', ['draft', 'scheduled'])
            ->delete();

        $this->tokenService->deleteToken($id);
        $account->delete();

        return ApiResponse::success(null, 'YouTube account disconnected successfully');
    }
}
