<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MediaTest extends TestCase
{
    public function test_can_list_media(): void
    {
        $response = $this->getJson('/api/media');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'filename',
                        'url',
                        'mediaType',
                        'size',
                        'createdAt',
                    ],
                ],
            ]);
    }

    public function test_can_upload_media_file(): void
    {
        $file = UploadedFile::fake()->image('test_upload.jpg', 600, 600);

        $response = $this->postJson('/api/media/upload', [
            'file' => $file,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Media uploaded successfully',
            ])
            ->assertJsonPath('data.mediaType', 'IMAGE');
    }
}
