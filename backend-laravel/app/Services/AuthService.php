<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * Register a new user.
     */
    public function registerUser(array $data): User
    {
        $existing = User::where('email', $data['email'])->first();
        if ($existing) {
            throw new ApiException('A user with this email already exists', 409);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password_hash' => Hash::make($data['password']),
        ]);

        return $user;
    }

    /**
     * Authenticate a user by email and password.
     */
    public function loginUser(array $data): User
    {
        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            throw new ApiException('Invalid email or password', 401);
        }

        $hash = $user->password_hash;
        if (str_starts_with($hash, '$2b$') || str_starts_with($hash, '$2a$')) {
            $hash = '$2y$' . substr($hash, 4);
        }

        if (!Hash::check($data['password'], $hash) && !password_verify($data['password'], $hash)) {
            throw new ApiException('Invalid email or password', 401);
        }

        return $user;
    }

    /**
     * Get user by ID (safe fields only).
     */
    public function getUserById(string $userId): User
    {
        $user = User::select(['id', 'name', 'email', 'created_at', 'updated_at'])
            ->find($userId);

        if (!$user) {
            throw new ApiException('User not found', 404);
        }

        return $user;
    }

    /**
     * Update user profile.
     */
    public function updateProfile(string $userId, array $data): User
    {
        $user = User::find($userId);
        if (!$user) {
            throw new ApiException('User not found', 404);
        }

        if (!empty($data['email']) && $data['email'] !== $user->email) {
            $existing = User::where('email', $data['email'])
                ->where('id', '!=', $userId)
                ->first();
            if ($existing) {
                throw new ApiException('Email is already in use', 409);
            }
            $user->email = $data['email'];
        }

        if (!empty($data['name'])) {
            $user->name = $data['name'];
        }

        $user->save();

        return User::select(['id', 'name', 'email', 'created_at', 'updated_at'])->find($userId);
    }

    /**
     * Change user password.
     */
    public function changePassword(string $userId, array $data): bool
    {
        $user = User::find($userId);
        if (!$user) {
            throw new ApiException('User not found', 404);
        }

        $hash = $user->password_hash;
        if (str_starts_with($hash, '$2b$') || str_starts_with($hash, '$2a$')) {
            $hash = '$2y$' . substr($hash, 4);
        }

        if (!Hash::check($data['currentPassword'], $hash) && !password_verify($data['currentPassword'], $hash)) {
            throw new ApiException('Current password is incorrect', 400);
        }

        $user->password_hash = Hash::make($data['newPassword']);
        $user->save();

        return true;
    }
}
