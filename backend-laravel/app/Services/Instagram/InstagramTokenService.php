<?php

namespace App\Services\Instagram;

use App\Models\SocialToken;
use App\Services\EncryptionService;
use Carbon\Carbon;
use Exception;

class InstagramTokenService
{
    protected EncryptionService $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    /**
     * Store or update encrypted access token for a social account.
     */
    public function storeToken(string $socialAccountId, array $data): SocialToken
    {
        $encryptedToken = $this->encryptionService->encrypt($data['accessToken']);

        $expiresAt = !empty($data['expiresIn'])
            ? Carbon::now()->addSeconds((int) $data['expiresIn'])
            : null;

        return SocialToken::updateOrCreate(
            ['social_account_id' => $socialAccountId],
            [
                'access_token' => $encryptedToken,
                'token_type' => $data['tokenType'] ?? 'bearer',
                'expires_at' => $expiresAt,
                'scopes' => $data['scopes'] ?? null,
            ]
        );
    }

    /**
     * Get the decrypted access token for a social account.
     */
    public function getDecryptedToken(string $socialAccountId): array
    {
        $token = SocialToken::where('social_account_id', $socialAccountId)->first();

        if (!$token) {
            $error = new Exception('No token found for this account');
            $error->status = 404;
            throw $error;
        }

        if ($token->expires_at && Carbon::now()->gt($token->expires_at)) {
            $error = new Exception('Access token has expired. Please reconnect your Instagram account.');
            $error->status = 401;
            throw $error;
        }

        return [
            'accessToken' => $this->encryptionService->decrypt($token->access_token),
            'tokenType' => $token->token_type,
            'expiresAt' => $token->expires_at,
            'scopes' => $token->scopes,
        ];
    }

    /**
     * Delete token for a social account.
     */
    public function deleteToken(string $socialAccountId): void
    {
        SocialToken::where('social_account_id', $socialAccountId)->delete();
    }

    /**
     * Check if a token is nearing expiry (within 7 days).
     */
    public function isTokenNearExpiry($expiresAt): bool
    {
        if (!$expiresAt) {
            return false;
        }

        $expiresDate = Carbon::parse($expiresAt);
        return $expiresDate->diffInDays(Carbon::now()) <= 7 && $expiresDate->isFuture();
    }
}
