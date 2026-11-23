<?php

namespace App\Services\YouTube;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class YouTubeOAuthService
{
    protected string $clientId;
    protected string $clientSecret;
    protected string $redirectUri;
    protected array $scopes;

    public function __construct()
    {
        $this->clientId = config('youtube.client_id') ?? '';
        $this->clientSecret = config('youtube.client_secret') ?? '';
        $this->redirectUri = config('youtube.redirect_uri') ?? '';
        $this->scopes = config('youtube.scopes', [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.readonly',
            'openid',
            'email',
            'profile',
        ]);
    }

    public function isConfigured(): bool
    {
        return !empty($this->clientId) && !empty($this->clientSecret) && !empty($this->redirectUri);
    }

    /**
     * Generate Google OAuth authorization URL.
     * access_type=offline and prompt=consent ensure a refresh_token is returned.
     */
    public function generateAuthorizationUrl(string $state): string
    {
        if (!$this->isConfigured()) {
            throw new Exception('YouTube API credentials are not configured.');
        }

        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', $this->scopes),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
            'include_granted_scopes' => 'true',
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    /**
     * Exchange authorization code for access token and refresh token.
     */
    public function exchangeCodeForTokens(string $code): array
    {
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirectUri,
        ]);

        $data = $response->json();

        if ($response->failed() || !isset($data['access_token'])) {
            Log::error('YouTube token exchange failed:', $data ?: ['body' => $response->body()]);
            $msg = $data['error_description'] ?? $data['error'] ?? 'Failed to exchange authorization code';
            throw new Exception("Google OAuth token error: {$msg}");
        }

        return [
            'accessToken' => $data['access_token'],
            'refreshToken' => $data['refresh_token'] ?? null,
            'expiresIn' => $data['expires_in'] ?? 3600,
            'tokenType' => $data['token_type'] ?? 'Bearer',
            'scope' => $data['scope'] ?? '',
        ];
    }

    /**
     * Refresh access token using refresh token.
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ]);

        $data = $response->json();

        if ($response->failed() || !isset($data['access_token'])) {
            Log::error('YouTube token refresh failed:', $data ?: ['body' => $response->body()]);
            $msg = $data['error_description'] ?? $data['error'] ?? 'Failed to refresh YouTube token';
            throw new Exception("Google token refresh error: {$msg}");
        }

        return [
            'accessToken' => $data['access_token'],
            'expiresIn' => $data['expires_in'] ?? 3600,
            'tokenType' => $data['token_type'] ?? 'Bearer',
            'scope' => $data['scope'] ?? '',
        ];
    }

    /**
     * Fetch user's YouTube Channel details.
     */
    public function getChannelProfile(string $accessToken): array
    {
        $response = Http::withToken($accessToken)
            ->get('https://www.googleapis.com/youtube/v3/channels', [
                'part' => 'snippet,contentDetails',
                'mine' => 'true',
            ]);

        $data = $response->json();

        if ($response->failed() || empty($data['items'])) {
            Log::error('YouTube channel profile fetch failed:', $data ?: ['body' => $response->body()]);
            $msg = $data['error']['message'] ?? 'No YouTube channel found for this Google account. Please create a YouTube channel first.';
            throw new Exception($msg);
        }

        $channel = $data['items'][0];
        $snippet = $channel['snippet'] ?? [];

        $profilePic = $snippet['thumbnails']['high']['url']
            ?? $snippet['thumbnails']['medium']['url']
            ?? $snippet['thumbnails']['default']['url']
            ?? null;

        return [
            'platformUserId' => $channel['id'],
            'username' => $snippet['title'] ?? 'YouTube Channel',
            'customUrl' => $snippet['customUrl'] ?? null,
            'description' => $snippet['description'] ?? '',
            'profilePicture' => $profilePic,
        ];
    }
}
