<?php

namespace App\Services\YouTube;

use App\Models\SocialToken;
use App\Services\EncryptionService;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;

class YouTubeTokenService
{
    protected EncryptionService $encryptionService;
    protected YouTubeOAuthService $oauthService;

    public function __construct(
        EncryptionService $encryptionService,
        YouTubeOAuthService $oauthService
    ) {
        $this->encryptionService = $encryptionService;
        $this->oauthService = $oauthService;
    }

    /**
     * Store or update encrypted access token and refresh token.
     */
    public function storeToken(string $socialAccountId, array $data): SocialToken
    {
        $encryptedAccessToken = $this->encryptionService->encrypt($data['accessToken']);

        $expiresAt = !empty($data['expiresIn'])
            ? Carbon::now()->addSeconds((int) $data['expiresIn'])
            : Carbon::now()->addHour();

        $attributes = [
            'access_token' => $encryptedAccessToken,
            'token_type' => $data['tokenType'] ?? 'bearer',
            'expires_at' => $expiresAt,
            'scopes' => $data['scopes'] ?? null,
        ];

        if (!empty($data['refreshToken'])) {
            $attributes['refresh_token'] = $this->encryptionService->encrypt($data['refreshToken']);
        }

        return SocialToken::updateOrCreate(
            ['social_account_id' => $socialAccountId],
            $attributes
        );
    }

    /**
     * Get a guaranteed valid (auto-refreshed) access token for YouTube.
     */
    public function getValidAccessToken(string $socialAccountId): string
    {
        $token = SocialToken::where('social_account_id', $socialAccountId)->first();

        if (!$token) {
            $error = new Exception('No YouTube token found for this account.');
            $error->status = 404;
            throw $error;
        }

        // Check if access token is expired or expiring within 5 minutes
        $needsRefresh = !$token->expires_at || Carbon::now()->addMinutes(5)->gte($token->expires_at);

        if ($needsRefresh && $token->refresh_token) {
            try {
                $decryptedRefreshToken = $this->encryptionService->decrypt($token->refresh_token);
                $refreshed = $this->oauthService->refreshAccessToken($decryptedRefreshToken);

                // Update in database
                $this->storeToken($socialAccountId, [
                    'accessToken' => $refreshed['accessToken'],
                    'expiresIn' => $refreshed['expiresIn'],
                    'tokenType' => $refreshed['tokenType'],
                    'scopes' => $refreshed['scope'] ?: $token->scopes,
                ]);

                Log::info("YouTube token auto-refreshed successfully for account {$socialAccountId}");
                return $refreshed['accessToken'];
            } catch (\Throwable $e) {
                Log::error("Failed to auto-refresh YouTube token: {$e->getMessage()}");
                // If refresh fails, fall back to current token if not strictly expired
                if ($token->expires_at && Carbon::now()->lt($token->expires_at)) {
                    return $this->encryptionService->decrypt($token->access_token);
                }
                throw new Exception('YouTube session expired. Please reconnect your YouTube channel.');
            }
        }

        return $this->encryptionService->decrypt($token->access_token);
    }

    /**
     * Delete token.
     */
    public function deleteToken(string $socialAccountId): void
    {
        SocialToken::where('social_account_id', $socialAccountId)->delete();
    }
}
