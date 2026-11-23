<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_can_register_new_user(): void
    {
        $uniqueEmail = 'register_' . Str::random(8) . '@example.com';

        $response = $this->postJson('/api/auth/register', [
            'name' => 'New User',
            'email' => $uniqueEmail,
            'password' => 'SecurePass123!',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Registration successful',
            ])
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'createdAt'],
                ],
            ]);
    }

    public function test_cannot_register_duplicate_email(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jimly Duplicate',
            'email' => 'jimly@automation.dev',
            'password' => 'SecurePass123!',
        ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'A user with this email already exists',
            ]);
    }

    public function test_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'jimly@automation.dev',
            'password' => 'Automation123!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login successful',
            ])
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'createdAt'],
                ],
            ]);
    }

    public function test_cannot_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'jimly@automation.dev',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid email or password',
            ]);
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::where('email', 'jimly@automation.dev')->first();

        $response = $this->actingAs($user)
            ->withSession(['userId' => $user->id])
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => 'jimly@automation.dev',
                    ],
                ],
            ]);
    }

    public function test_unauthenticated_user_gets_401(): void
    {
        $response = $this->getJson('/api/auth/me');
        $response->assertStatus(401);
    }
}
