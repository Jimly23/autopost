<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_check_endpoint(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Automation API is running',
                'data' => [
                    'status' => 'healthy',
                ],
            ]);
    }

    public function test_csrf_token_endpoint(): void
    {
        $response = $this->getJson('/api/csrf-token');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['csrfToken'],
            ]);
    }

    public function test_legal_redirects(): void
    {
        $responsePrivacy = $this->get('/privacy');
        $responsePrivacy->assertRedirect();

        $responseTerms = $this->get('/terms');
        $responseTerms->assertRedirect();
    }
}
