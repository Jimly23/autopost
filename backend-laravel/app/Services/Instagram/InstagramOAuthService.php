<?php

namespace App\Services\Instagram;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InstagramOAuthService
{
    protected string $appId;
    protected string $appSecret;
    protected string $redirectUri;
    protected ?string $configId;
    protected ?string $apiVersion;

    public function __construct()
    {
        $this->appId = config('instagram.app_id');
        $this->appSecret = config('instagram.app_secret');
        $this->redirectUri = config('instagram.redirect_uri');
        $this->configId = config('instagram.config_id');
        $this->apiVersion = config('instagram.api_version');
    }

    public function isConfigured(): bool
    {
        return !empty($this->appId) && !empty($this->appSecret) && !empty($this->redirectUri);
    }

    public function getAuthorizationUrl(): string
    {
        $versionPrefix = $this->apiVersion ? "/{$this->apiVersion}" : '';
        if ($this->configId) {
            return "https://www.facebook.com{$versionPrefix}/dialog/oauth";
        }
        return "https://www.instagram.com/oauth/authorize";
    }

    public function getTokenUrl(): string
    {
        $versionPrefix = $this->apiVersion ? "/{$this->apiVersion}" : '';
        if ($this->configId) {
            return "https://graph.facebook.com{$versionPrefix}/oauth/access_token";
        }
        return "https://api.instagram.com/oauth/access_token";
    }

    public function getGraphBaseUrl(?string $token = null): string
    {
        $versionPrefix = $this->apiVersion ? "/{$this->apiVersion}" : '';
        if ($token && str_starts_with($token, 'EAA')) {
            return "https://graph.facebook.com{$versionPrefix}";
        }
        return "https://graph.instagram.com{$versionPrefix}";
    }

    /**
     * Generate authorization URL with parameters matching Meta's Unified Login format.
     */
    public function generateAuthorizationUrl(string $state): array
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('Instagram API is not configured.');
        }

        if ($this->configId) {
            $params = http_build_query([
                'client_id' => $this->appId,
                'config_id' => $this->configId,
                'display' => 'popup',
                'override_default_response_type' => 'true',
                'prompt' => 'login',
                'redirect_uri' => $this->redirectUri,
                'response_type' => 'code',
                'state' => $state,
            ]);

            return [
                'url' => $this->getAuthorizationUrl() . '?' . $params,
                'state' => $state,
            ];
        }

        $params = http_build_query([
            'client_id' => $this->appId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => implode(',', config('instagram.scopes', [])),
            'state' => $state,
        ]);

        return [
            'url' => $this->getAuthorizationUrl() . '?' . $params,
            'state' => $state,
        ];
    }

    /**
     * Exchange authorization code for token.
     */
    public function exchangeCodeForToken(string $code): array
    {
        if ($this->configId) {
            $response = Http::get($this->getTokenUrl(), [
                'client_id' => $this->appId,
                'client_secret' => $this->appSecret,
                'redirect_uri' => $this->redirectUri,
                'code' => $code,
            ]);

            $data = $response->json();

            if (isset($data['error'])) {
                Log::error('Unified login token exchange failed', $data['error']);
                throw new \RuntimeException($data['error']['message'] ?? 'Token exchange failed');
            }

            return [
                'accessToken' => $data['access_token'],
                'tokenType' => $data['token_type'] ?? 'bearer',
                'expiresIn' => $data['expires_in'] ?? null,
                'userId' => isset($data['user_id']) ? (string) $data['user_id'] : null,
            ];
        }

        $response = Http::asForm()->post($this->getTokenUrl(), [
            'client_id' => $this->appId,
            'client_secret' => $this->appSecret,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirectUri,
            'code' => $code,
        ]);

        $data = $response->json();

        if (isset($data['error_type']) || isset($data['error_message']) || isset($data['error'])) {
            Log::error('Token exchange failed', $data);
            throw new \RuntimeException($data['error_message'] ?? ($data['error']['message'] ?? 'Token exchange failed'));
        }

        return [
            'accessToken' => $data['access_token'],
            'tokenType' => $data['token_type'] ?? 'bearer',
            'expiresIn' => $data['expires_in'] ?? null,
            'userId' => isset($data['user_id']) ? (string) $data['user_id'] : null,
        ];
    }

    /**
     * Exchange short-lived token for long-lived token.
     */
    public function exchangeForLongLivedToken(string $shortLivedToken): array
    {
        $isFbToken = str_starts_with($shortLivedToken, 'EAA') || !empty($this->configId);

        if ($isFbToken) {
            try {
                $versionPrefix = $this->apiVersion ? "/{$this->apiVersion}" : '';
                $response = Http::get("https://graph.facebook.com{$versionPrefix}/oauth/access_token", [
                    'grant_type' => 'fb_exchange_token',
                    'client_id' => $this->appId,
                    'client_secret' => $this->appSecret,
                    'fb_exchange_token' => $shortLivedToken,
                ]);

                $data = $response->json();

                if (isset($data['access_token'])) {
                    return [
                        'accessToken' => $data['access_token'],
                        'tokenType' => $data['token_type'] ?? 'bearer',
                        'expiresIn' => $data['expires_in'] ?? null,
                    ];
                }

                return [
                    'accessToken' => $shortLivedToken,
                    'tokenType' => 'bearer',
                    'expiresIn' => null,
                ];
            } catch (\Throwable $e) {
                Log::warning('Could not exchange FB token, using original token: ' . $e->getMessage());
                return [
                    'accessToken' => $shortLivedToken,
                    'tokenType' => 'bearer',
                    'expiresIn' => null,
                ];
            }
        }

        $versionPrefix = $this->apiVersion ? "/{$this->apiVersion}" : '';
        $response = Http::get("https://graph.instagram.com{$versionPrefix}/access_token", [
            'grant_type' => 'ig_exchange_token',
            'client_secret' => $this->appSecret,
            'access_token' => $shortLivedToken,
        ]);

        $data = $response->json();

        if (isset($data['error'])) {
            Log::error('Long-lived token exchange failed', $data);
            throw new \RuntimeException($data['error']['message'] ?? 'Failed to get long-lived token');
        }

        return [
            'accessToken' => $data['access_token'],
            'tokenType' => $data['token_type'] ?? 'bearer',
            'expiresIn' => $data['expires_in'] ?? null,
        ];
    }
}
