<?php

namespace App\Services\Instagram;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InstagramProfileService
{
    protected InstagramOAuthService $oauthService;

    public function __construct(InstagramOAuthService $oauthService)
    {
        $this->oauthService = $oauthService;
    }

    public function getUserProfile(string $accessToken, ?string $igUserId = null): array
    {
        $isFbToken = str_starts_with($accessToken, 'EAA') || !empty(config('instagram.config_id'));

        if ($isFbToken) {
            $baseUrl = $this->oauthService->getGraphBaseUrl($accessToken);

            // 1. Direct node query if igUserId is given
            if (!empty($igUserId)) {
                $response = Http::get("{$baseUrl}/{$igUserId}", [
                    'fields' => 'id,username,name,profile_picture_url',
                    'access_token' => $accessToken,
                ]);
                $data = $response->json();

                if (!empty($data['id'])) {
                    return [
                        'platformUserId' => (string) $data['id'],
                        'username' => $data['username'],
                        'name' => $data['name'] ?? null,
                        'accountType' => 'BUSINESS',
                        'profilePicture' => $data['profile_picture_url'] ?? null,
                    ];
                }
            }

            // 2. Unified Login Discovery: /me/assigned_instagram_accounts
            try {
                $response = Http::get("{$baseUrl}/me/assigned_instagram_accounts", [
                    'fields' => 'id,username,name,profile_picture_url',
                    'access_token' => $accessToken,
                ]);
                $data = $response->json();

                if (!empty($data['data']) && count($data['data']) > 0) {
                    $account = $data['data'][0];
                    return [
                        'platformUserId' => (string) $account['id'],
                        'username' => $account['username'],
                        'name' => $account['name'] ?? null,
                        'accountType' => 'BUSINESS',
                        'profilePicture' => $account['profile_picture_url'] ?? null,
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to query assigned_instagram_accounts: ' . $e->getMessage());
            }

            // 3. Fallback Discovery: /me/accounts (Pages with linked IG)
            try {
                $response = Http::get("{$baseUrl}/me/accounts", [
                    'fields' => 'id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}',
                    'access_token' => $accessToken,
                ]);
                $data = $response->json();

                if (!empty($data['data'])) {
                    foreach ($data['data'] as $page) {
                        if (!empty($page['instagram_business_account'])) {
                            $ig = $page['instagram_business_account'];
                            return [
                                'platformUserId' => (string) $ig['id'],
                                'username' => $ig['username'],
                                'name' => $ig['name'] ?? ($page['name'] ?? null),
                                'accountType' => 'BUSINESS',
                                'profilePicture' => $ig['profile_picture_url'] ?? null,
                            ];
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to query me/accounts: ' . $e->getMessage());
            }

            // 4. Fallback to /me
            try {
                $response = Http::get("{$baseUrl}/me", [
                    'fields' => 'id,name,username',
                    'access_token' => $accessToken,
                ]);
                $data = $response->json();

                if (!empty($data['id'])) {
                    return [
                        'platformUserId' => (string) $data['id'],
                        'username' => $data['username'] ?? ($data['name'] ?? 'instagram_user'),
                        'name' => $data['name'] ?? null,
                        'accountType' => 'BUSINESS',
                        'profilePicture' => null,
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to query /me: ' . $e->getMessage());
            }

            throw new \RuntimeException('No Instagram Professional accounts found for this authenticated user.');
        }

        // Legacy IG Basic Display
        $response = Http::get('https://graph.instagram.com/me', [
            'fields' => 'user_id,username,account_type,profile_picture_url',
            'access_token' => $accessToken,
        ]);
        $data = $response->json();

        if (isset($data['error'])) {
            throw new \RuntimeException($data['error']['message'] ?? 'Failed to fetch Instagram profile');
        }

        return [
            'platformUserId' => (string) ($data['user_id'] ?? $data['id']),
            'username' => $data['username'],
            'accountType' => $data['account_type'] ?? null,
            'profilePicture' => $data['profile_picture_url'] ?? null,
        ];
    }
}
