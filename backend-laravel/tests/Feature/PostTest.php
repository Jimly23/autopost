<?php

namespace Tests\Feature;

use App\Models\SocialAccount;
use App\Models\User;
use Tests\TestCase;

class PostTest extends TestCase
{
    public function test_can_list_posts(): void
    {
        $user = User::where('email', 'jimly@automation.dev')->first();

        $response = $this->actingAs($user)
            ->withSession(['userId' => $user->id])
            ->getJson('/api/posts');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'posts',
                    'pagination' => ['page', 'limit', 'total', 'totalPages'],
                ],
            ]);
    }

    public function test_can_create_draft_post(): void
    {
        $user = User::where('email', 'jimly@automation.dev')->first();
        $account = SocialAccount::where('user_id', $user->id)->first();

        $response = $this->actingAs($user)
            ->withSession(['userId' => $user->id])
            ->postJson('/api/posts', [
                'socialAccountId' => $account->id,
                'caption' => 'Testing from Laravel backend unit test',
                'mediaType' => 'IMAGE',
                'mediaUrl' => 'https://example.com/test.jpg',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Post created successfully',
            ])
            ->assertJsonPath('data.post.status', 'draft');
    }
}
