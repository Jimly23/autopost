<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    public function test_can_get_overview(): void
    {
        $user = User::where('email', 'jimly@automation.dev')->first();

        $response = $this->actingAs($user)
            ->withSession(['userId' => $user->id])
            ->getJson('/api/dashboard/overview');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'overview' => [
                        'totalAccounts',
                        'totalPosts',
                        'scheduledPosts',
                        'publishedPosts',
                        'failedPosts',
                        'recentPosts',
                        'upcomingScheduled',
                    ],
                ],
            ]);
    }
}
