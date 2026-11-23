<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class InstagramTest extends TestCase
{
    public function test_connect_redirects_to_meta_oauth(): void
    {
        $user = User::where('email', 'jimly@automation.dev')->first();

        $response = $this->actingAs($user)
            ->withSession(['userId' => $user->id])
            ->get('/api/instagram/connect');

        $response->assertRedirect();
        $targetUrl = $response->headers->get('Location');

        $this->assertStringContainsString('facebook.com', $targetUrl);
        $this->assertStringContainsString('client_id=1477925811107025', $targetUrl);
        $this->assertStringContainsString('config_id=1481123037301339', $targetUrl);
    }

    public function test_can_list_connected_accounts(): void
    {
        $user = User::where('email', 'jimly@automation.dev')->first();

        $response = $this->actingAs($user)
            ->withSession(['userId' => $user->id])
            ->getJson('/api/instagram/accounts');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'accounts' => [
                        '*' => [
                            'id',
                            'platform',
                            'username',
                            'accountType',
                            'tokenStatus',
                        ],
                    ],
                ],
            ]);
    }
}
