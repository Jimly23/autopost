<?php

namespace App\Services\Instagram;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class InstagramPublishingService
{
    protected InstagramOAuthService $oauthService;

    public function __construct(InstagramOAuthService $oauthService)
    {
        $this->oauthService = $oauthService;
    }

    /**
     * Create a media container for a single image or video/reel.
     *
     * @param string $accessToken
     * @param string $igUserId
     * @param array{mediaType: string, mediaUrl: string, caption?: ?string} $params
     * @return array{containerId: string}
     */
    public function createMediaContainer(string $accessToken, string $igUserId, array $params): array
    {
        $mediaType = strtoupper($params['mediaType'] ?? '');
        $mediaUrl = $params['mediaUrl'] ?? '';
        $caption = $params['caption'] ?? null;

        $body = [
            'access_token' => $accessToken,
        ];

        if ($mediaType === 'IMAGE') {
            $body['image_url'] = $mediaUrl;
        } elseif ($mediaType === 'VIDEO' || $mediaType === 'REELS') {
            $body['video_url'] = $mediaUrl;
            $body['media_type'] = 'REELS';
            $body['share_to_feed'] = 'true';
        } else {
            throw new Exception("Unsupported media type: {$mediaType}");
        }

        if (!empty($caption)) {
            $body['caption'] = $caption;
        }

        $baseUrl = $this->oauthService->getGraphBaseUrl($accessToken);
        $url = "{$baseUrl}/{$igUserId}/media";

        $response = Http::asForm()->post($url, $body);
        $data = $response->json();

        if (isset($data['error'])) {
            Log::error('Failed to create media container:', $data['error']);
            $error = new Exception($data['error']['message'] ?? 'Failed to create media container');
            $error->status = $response->status();
            $error->igError = $data['error'];
            throw $error;
        }

        return ['containerId' => $data['id']];
    }

    /**
     * Check the status of a media container.
     *
     * @param string $accessToken
     * @param string $containerId
     * @return array{id: string, statusCode: string, status: ?string}
     */
    public function checkContainerStatus(string $accessToken, string $containerId): array
    {
        $baseUrl = $this->oauthService->getGraphBaseUrl($accessToken);
        $url = "{$baseUrl}/{$containerId}";

        $response = Http::get($url, [
            'fields' => 'status_code,status',
            'access_token' => $accessToken,
        ]);

        $data = $response->json();

        if (isset($data['error'])) {
            Log::error('Failed to check container status:', $data['error']);
            $error = new Exception($data['error']['message'] ?? 'Failed to check container status');
            $error->status = $response->status();
            throw $error;
        }

        return [
            'id' => $containerId,
            'statusCode' => $data['status_code'] ?? 'UNKNOWN',
            'status' => $data['status'] ?? null,
        ];
    }

    /**
     * Wait for a media container to finish processing.
     *
     * @param string $accessToken
     * @param string $containerId
     * @param int $maxAttempts
     * @param int $intervalSec
     * @return array
     */
    public function waitForContainerReady(
        string $accessToken,
        string $containerId,
        int $maxAttempts = 30,
        int $intervalSec = 5
    ): array {
        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            $result = $this->checkContainerStatus($accessToken, $containerId);

            if ($result['statusCode'] === 'FINISHED') {
                return $result;
            }

            if ($result['statusCode'] === 'ERROR' || $result['statusCode'] === 'EXPIRED') {
                $statusDetail = $result['status'] ?? 'Unknown error';
                $error = new Exception("Media container {$result['statusCode']}: {$statusDetail}");
                $error->status = 400;
                throw $error;
            }

            Log::debug("Container {$containerId} status: {$result['statusCode']} (attempt " . ($attempt + 1) . "/{$maxAttempts})");
            sleep($intervalSec);
        }

        throw new Exception('Media container processing timed out');
    }

    /**
     * Publish a media container.
     *
     * @param string $accessToken
     * @param string $igUserId
     * @param string $containerId
     * @return array{mediaId: string}
     */
    public function publishMedia(string $accessToken, string $igUserId, string $containerId): array
    {
        $baseUrl = $this->oauthService->getGraphBaseUrl($accessToken);
        $url = "{$baseUrl}/{$igUserId}/media_publish";

        $response = Http::asForm()->post($url, [
            'creation_id' => $containerId,
            'access_token' => $accessToken,
        ]);

        $data = $response->json();

        if (isset($data['error'])) {
            Log::error('Failed to publish media:', $data['error']);
            $error = new Exception($data['error']['message'] ?? 'Failed to publish media');
            $error->status = $response->status();
            $error->igError = $data['error'];
            throw $error;
        }

        return ['mediaId' => $data['id']];
    }

    /**
     * Full publish flow: create container → wait → publish.
     *
     * @param string $accessToken
     * @param string $igUserId
     * @param array $params
     * @return array{containerId: string, mediaId: string}
     */
    public function publishContent(string $accessToken, string $igUserId, array $params): array
    {
        // Step 1: Create container
        $containerResult = $this->createMediaContainer($accessToken, $igUserId, $params);
        $containerId = $containerResult['containerId'];

        $mediaType = strtoupper($params['mediaType'] ?? '');

        // Step 2: For video/reels or if needed for images, wait for processing
        if ($mediaType === 'VIDEO' || $mediaType === 'REELS') {
            $this->waitForContainerReady($accessToken, $containerId);
        } else {
            $status = $this->checkContainerStatus($accessToken, $containerId);
            if ($status['statusCode'] !== 'FINISHED') {
                $this->waitForContainerReady($accessToken, $containerId, 10, 3);
            }
        }

        // Step 3: Publish
        $publishResult = $this->publishMedia($accessToken, $igUserId, $containerId);

        return [
            'containerId' => $containerId,
            'mediaId' => $publishResult['mediaId'],
        ];
    }
}
