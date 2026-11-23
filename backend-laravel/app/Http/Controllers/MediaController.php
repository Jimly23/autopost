<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use GdImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    /**
     * Maximum accepted upload size for images (bytes).
     */
    private const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB

    /**
     * Maximum accepted upload size for videos (bytes).
     * Supports up to 100 MB for YouTube standard videos and Shorts.
     */
    private const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

    /**
     * Instagram only accepts images up to 8 MB, so the converted JPEG must stay below this.
     */
    private const INSTAGRAM_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

    /**
     * JPEG quality used for the first conversion attempt.
     */
    private const JPEG_QUALITY = 90;

    /**
     * Instagram downscales images wider than this.
     */
    private const INSTAGRAM_MAX_WIDTH = 1440;

    /**
     * POST /api/media/upload
     */
    public function uploadMediaFile(Request $request): JsonResponse
    {
        $file = $request->file('file');

        if (!$file) {
            return ApiResponse::error('No media file provided', 400);
        }

        if (!$file->isValid()) {
            return ApiResponse::error($this->uploadErrorMessage($file->getError()), 422);
        }

        $mimeType = $file->getMimeType() ?: $file->getClientMimeType();
        $isVideo = Str::startsWith($mimeType, 'video/');
        $isImage = Str::startsWith($mimeType, 'image/');

        if (!$isImage && !$isVideo) {
            return ApiResponse::error(
                'Unsupported file type. Upload an image (JPG, PNG, WEBP) or a video (MP4, MOV).',
                422
            );
        }

        $size = (int) $file->getSize();

        if ($isImage && $size > self::MAX_IMAGE_BYTES) {
            return ApiResponse::error('Image is too large. Maximum image size is 25 MB.', 422);
        }

        if ($isVideo && $size > self::MAX_VIDEO_BYTES) {
            return ApiResponse::error('Video is too large. Maximum video size is 100 MB.', 422);
        }

        if ($isVideo && !in_array($mimeType, ['video/mp4', 'video/quicktime'], true)) {
            return ApiResponse::error('Unsupported video format. Use MP4 or MOV.', 422);
        }

        $uploadPath = public_path('uploads');
        if (!File::exists($uploadPath)) {
            try {
                File::makeDirectory($uploadPath, 0775, true, true);
            } catch (\Throwable $e) {
                return ApiResponse::error(
                    'Upload directory could not be created. Please check folder permissions for public/uploads on VPS.',
                    500
                );
            }
        }

        if (!is_writable($uploadPath)) {
            return ApiResponse::error(
                'Upload directory is not writable. Please ensure the web server user (e.g. www-data) has write permission on public/uploads.',
                500
            );
        }

        $timestamp = (int) (microtime(true) * 1000);
        $randomHex = bin2hex(random_bytes(6));

        try {
            if ($isVideo) {
                // Videos are stored as-is; Meta only accepts MP4/MOV with the right codecs.
                $extension = $mimeType === 'video/quicktime' ? 'mov' : 'mp4';
                $filename = "{$timestamp}-{$randomHex}.{$extension}";
                $file->move($uploadPath, $filename);
                $finalMime = $mimeType;
            } else {
                $origExt = strtolower($file->getClientOriginalExtension());
                $allowedImageExts = ['jpg', 'jpeg', 'png', 'webp'];
                $extension = in_array($origExt, $allowedImageExts, true) ? $origExt : 'jpg';

                $converted = false;
                $filename = "{$timestamp}-{$randomHex}.jpg";
                $destination = "{$uploadPath}/{$filename}";

                // Attempt JPEG conversion if GD extension is available
                if (extension_loaded('gd') && function_exists('imagecreatefromstring')) {
                    try {
                        $converted = $this->convertImageToJpeg($file->getRealPath(), $destination);
                    } catch (\Throwable $t) {
                        $converted = false;
                    }
                }

                // If conversion was skipped or failed, fallback to storing as-is (matching Express behavior)
                if (!$converted) {
                    $filename = "{$timestamp}-{$randomHex}.{$extension}";
                    $file->move($uploadPath, $filename);
                    $finalMime = $mimeType;
                } else {
                    $finalMime = 'image/jpeg';
                }
            }
        } catch (\Throwable $e) {
            return ApiResponse::error('Failed to save file: ' . $e->getMessage(), 500);
        }

        $backendUrl = env('BACKEND_URL');
        $baseUrl = !empty($backendUrl)
            ? rtrim($backendUrl, '/')
            : $request->getSchemeAndHttpHost();

        $fileUrl = "{$baseUrl}/uploads/{$filename}";

        return response()->json([
            'success' => true,
            'message' => 'Media uploaded successfully',
            'data' => [
                'url' => $fileUrl,
                'filename' => $filename,
                'originalName' => $file->getClientOriginalName(),
                'mimetype' => $finalMime,
                'mediaType' => $isVideo ? 'VIDEO' : 'IMAGE',
                'size' => File::size("{$uploadPath}/{$filename}"),
            ],
        ], 201);
    }

    /**
     * Decode any GD-supported image, flatten transparency onto white, correct EXIF
     * orientation, cap the width at Instagram's maximum and save it as JPEG.
     */
    private function convertImageToJpeg(string $sourcePath, string $destinationPath): bool
    {
        $contents = @file_get_contents($sourcePath);
        if ($contents === false) {
            return false;
        }

        $image = @imagecreatefromstring($contents);
        if ($image === false) {
            return false;
        }

        $image = $this->applyExifOrientation($image, $sourcePath);

        $width = imagesx($image);
        $height = imagesy($image);

        if ($width < 1 || $height < 1) {
            imagedestroy($image);

            return false;
        }

        // Instagram downscales anything wider than 1440 px; doing it here keeps the JPEG small.
        if ($width > self::INSTAGRAM_MAX_WIDTH) {
            $targetWidth = self::INSTAGRAM_MAX_WIDTH;
            $targetHeight = max(1, (int) round($height * ($targetWidth / $width)));

            $resized = $this->createWhiteCanvas($targetWidth, $targetHeight);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

            imagedestroy($image);
            $image = $resized;
            $width = $targetWidth;
            $height = $targetHeight;
        }

        // Flatten transparency onto white because JPEG has no alpha channel.
        $canvas = $this->createWhiteCanvas($width, $height);
        imagealphablending($canvas, true);
        imagecopy($canvas, $image, 0, 0, 0, 0, $width, $height);
        imagedestroy($image);

        $quality = self::JPEG_QUALITY;
        $current = $canvas;

        while (true) {
            if (!@imagejpeg($current, $destinationPath, $quality)) {
                imagedestroy($current);

                return false;
            }

            clearstatcache(true, $destinationPath);
            $outputSize = (int) @filesize($destinationPath);

            if ($outputSize > 0 && $outputSize <= self::INSTAGRAM_IMAGE_MAX_BYTES) {
                break;
            }

            if ($quality > 60) {
                $quality -= 10;
                continue;
            }

            // Still above 8 MB: shrink by 20% and try again.
            if ($width <= 640) {
                break;
            }

            $newWidth = max(320, (int) round($width * 0.8));
            $newHeight = max(1, (int) round($height * ($newWidth / $width)));

            $smaller = $this->createWhiteCanvas($newWidth, $newHeight);
            imagecopyresampled($smaller, $current, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

            imagedestroy($current);
            $current = $smaller;
            $width = $newWidth;
            $height = $newHeight;
            $quality = 85;
        }

        imagedestroy($current);

        return true;
    }

    private function createWhiteCanvas(int $width, int $height): GdImage
    {
        $canvas = imagecreatetruecolor($width, $height);
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefilledrectangle($canvas, 0, 0, $width, $height, $white);

        return $canvas;
    }

    /**
     * Rotate the image according to its EXIF orientation (JPEG/TIFF only).
     */
    private function applyExifOrientation(GdImage $image, string $path): GdImage
    {
        if (!function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($path);
        if (!$exif || empty($exif['Orientation'])) {
            return $image;
        }

        $angle = match ((int) $exif['Orientation']) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($angle === 0) {
            return $image;
        }

        $background = imagecolorallocate($image, 255, 255, 255);
        $rotated = @imagerotate($image, $angle, $background);

        if ($rotated === false) {
            return $image;
        }

        imagedestroy($image);

        return $rotated;
    }

    private function uploadErrorMessage(int $errorCode): string
    {
        return match ($errorCode) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'The file is larger than the server upload limit (40 MB).',
            UPLOAD_ERR_PARTIAL => 'The file was only partially uploaded.',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'The server upload directory is missing.',
            UPLOAD_ERR_CANT_WRITE => 'The server could not write the uploaded file.',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the upload.',
            default => 'The file upload failed.',
        };
    }

    /**
     * GET /api/media
     */
    public function listUploadedMedia(Request $request): JsonResponse
    {
        $uploadPath = public_path('uploads');
        if (!File::exists($uploadPath)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $files = File::files($uploadPath);

        $backendUrl = env('BACKEND_URL');
        $baseUrl = !empty($backendUrl)
            ? rtrim($backendUrl, '/')
            : $request->getSchemeAndHttpHost();

        $mediaList = [];
        foreach ($files as $file) {
            $filename = $file->getFilename();
            $ext = strtolower($file->getExtension());
            $isVideo = in_array($ext, ['mp4', 'mov', 'webm']);

            $mediaList[] = [
                'filename' => $filename,
                'url' => "{$baseUrl}/uploads/{$filename}",
                'mediaType' => $isVideo ? 'VIDEO' : 'IMAGE',
                'size' => $file->getSize(),
                'createdAt' => date('c', $file->getMTime()),
            ];
        }

        usort($mediaList, function ($a, $b) {
            return strtotime($b['createdAt']) <=> strtotime($a['createdAt']);
        });

        return response()->json([
            'success' => true,
            'data' => $mediaList,
        ]);
    }
}
