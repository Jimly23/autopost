<?php

namespace App\Services\YouTube;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class YouTubePublishingService
{
    /**
     * Publish a video or YouTube Short to a YouTube channel.
     *
     * @param string $accessToken
     * @param array{
     *     title?: ?string,
     *     caption?: ?string,
     *     description?: ?string,
     *     mediaUrl: string,
     *     mediaType?: string,
     *     privacyStatus?: string
     * } $params
     * @return array{videoId: string, videoUrl: string}
     */
    public function publishVideo(string $accessToken, array $params): array
    {
        $mediaUrl = $params['mediaUrl'] ?? '';
        if (empty($mediaUrl)) {
            throw new Exception('No media URL provided for YouTube upload.');
        }

        // Determine local file path or download external URL
        $filePath = $this->resolveLocalFilePath($mediaUrl);
        if (!file_exists($filePath)) {
            throw new Exception("Media file not found at {$filePath}. Ensure the file exists before publishing.");
        }

        $fileSize = filesize($filePath);
        if ($fileSize === 0 || $fileSize === false) {
            throw new Exception('Media file is empty (0 bytes).');
        }

        $mimeType = mime_content_type($filePath) ?: 'video/mp4';

        // Prepare title & description
        $rawTitle = $params['title'] ?? $params['caption'] ?? 'YouTube Video';
        $title = mb_substr(trim($rawTitle), 0, 100);
        if (empty($title)) {
            $title = 'Uploaded Video ' . date('Y-m-d H:i');
        }

        $description = trim($params['description'] ?? $params['caption'] ?? '');
        $mediaType = strtoupper($params['mediaType'] ?? 'VIDEO');
        $isShorts = ($mediaType === 'SHORTS' || str_contains(strtolower($title), '#shorts') || str_contains(strtolower($description), '#shorts'));

        // If it's a Short, ensure #Shorts is in the description
        if ($isShorts && !str_contains(strtolower($description), '#shorts')) {
            $description = trim($description . "\n\n#Shorts");
        }

        $allowedPrivacy = ['public', 'unlisted', 'private'];
        $privacyStatus = in_array(strtolower($params['privacyStatus'] ?? 'public'), $allowedPrivacy, true)
            ? strtolower($params['privacyStatus'])
            : 'public';

        Log::info("Starting YouTube upload: '{$title}' ({$fileSize} bytes, type: {$mediaType}, privacy: {$privacyStatus})");

        // ─── Step 1: Initialize Resumable Upload Session ───────────────────────
        $metadata = [
            'snippet' => [
                'title' => $title,
                'description' => $description,
                'categoryId' => '22', // People & Blogs (standard general category)
            ],
            'status' => [
                'privacyStatus' => $privacyStatus,
                'selfDeclaredMadeForKids' => false,
            ],
        ];

        $initUrl = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

        $initResponse = Http::withToken($accessToken)
            ->withHeaders([
                'Content-Type' => 'application/json; charset=UTF-8',
                'X-Upload-Content-Length' => (string) $fileSize,
                'X-Upload-Content-Type' => $mimeType,
            ])
            ->post($initUrl, $metadata);

        if (!$initResponse->successful() || !$initResponse->header('Location')) {
            $err = $initResponse->json();
            Log::error('YouTube resumable session initiation failed:', $err ?: ['body' => $initResponse->body()]);
            $msg = $err['error']['message'] ?? 'Failed to initiate YouTube upload session';
            throw new Exception("YouTube API Error: {$msg}");
        }

        $resumableUploadUrl = $initResponse->header('Location');

        // ─── Step 2: Upload File Binary Stream ────────────────────────────────
        $stream = fopen($filePath, 'r');
        if (!$stream) {
            throw new Exception("Could not open file stream for {$filePath}");
        }

        try {
            $uploadResponse = Http::withHeaders([
                'Content-Type' => $mimeType,
                'Content-Length' => (string) $fileSize,
            ])
            ->timeout(600) // 10 minutes timeout for larger videos
            ->withBody($stream, $mimeType)
            ->put($resumableUploadUrl);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        $uploadData = $uploadResponse->json();

        if (!$uploadResponse->successful() || empty($uploadData['id'])) {
            Log::error('YouTube video upload binary stream failed:', $uploadData ?: ['body' => $uploadResponse->body()]);
            $msg = $uploadData['error']['message'] ?? 'Failed to upload video content to YouTube';
            throw new Exception("YouTube Upload Error: {$msg}");
        }

        $videoId = $uploadData['id'];
        $videoUrl = $isShorts
            ? "https://www.youtube.com/shorts/{$videoId}"
            : "https://www.youtube.com/watch?v={$videoId}";

        Log::info("YouTube upload completed successfully. Video ID: {$videoId}, URL: {$videoUrl}");

        return [
            'videoId' => $videoId,
            'videoUrl' => $videoUrl,
        ];
    }

    /**
     * Resolve media URL to local disk path if stored in public/uploads.
     */
    protected function resolveLocalFilePath(string $mediaUrl): string
    {
        $path = parse_url($mediaUrl, PHP_URL_PATH);
        if ($path) {
            $filename = basename($path);
            $localCandidate = public_path("uploads/{$filename}");
            if (file_exists($localCandidate)) {
                return $localCandidate;
            }
        }

        // If not found locally in public/uploads, check if it's already an absolute file path
        if (file_exists($mediaUrl)) {
            return $mediaUrl;
        }

        // Otherwise, download to a temporary file
        $tempPath = storage_path('app/temp_' . uniqid() . '.mp4');
        $response = Http::timeout(120)->sink($tempPath)->get($mediaUrl);
        if ($response->successful() && file_exists($tempPath) && filesize($tempPath) > 0) {
            return $tempPath;
        }

        return $mediaUrl;
    }
}
