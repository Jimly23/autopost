<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Exception;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * POST /api/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:8|max:128',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors()->toArray());
        }

        try {
            $user = $this->authService->registerUser($validator->validated());

            $request->session()->regenerate();
            $request->session()->put('userId', $user->id);
            Auth::login($user);

            return ApiResponse::created([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'createdAt' => $user->created_at,
                ],
            ], 'Registration successful');
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors()->toArray());
        }

        try {
            $user = $this->authService->loginUser($validator->validated());

            $request->session()->regenerate();
            $request->session()->put('userId', $user->id);
            Auth::login($user);

            return ApiResponse::success([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'createdAt' => $user->created_at,
                ],
            ], 'Login successful');
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::success(null, 'Logged out successfully');
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized('Authentication required');
        }

        try {
            $user = $this->authService->getUserById($userId);
            return ApiResponse::success([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'createdAt' => $user->created_at,
                    'updatedAt' => $user->updated_at,
                ],
            ]);
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }

    /**
     * PUT /api/auth/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized('Authentication required');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|min:2|max:255',
            'email' => 'nullable|string|email|max:255',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors()->toArray());
        }

        $validated = $validator->validated();
        if (empty($validated['name']) && empty($validated['email'])) {
            return ApiResponse::error('At least one field (name or email) must be provided', 400);
        }

        try {
            $user = $this->authService->updateProfile($userId, $validated);
            return ApiResponse::success([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'createdAt' => $user->created_at,
                    'updatedAt' => $user->updated_at,
                ],
            ], 'Profile updated successfully');
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }

    /**
     * PUT /api/auth/password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized('Authentication required');
        }

        $validator = Validator::make($request->all(), [
            'currentPassword' => 'required|string',
            'newPassword' => 'required|string|min:8|max:128',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors()->toArray());
        }

        try {
            $this->authService->changePassword($userId, $validator->validated());
            return ApiResponse::success(null, 'Password changed successfully');
        } catch (\Throwable $e) {
            $status = 500;
            if ($e instanceof \App\Exceptions\ApiException) {
                $status = $e->getStatusCode();
            } elseif ($e->getCode() >= 400 && $e->getCode() < 600) {
                $status = $e->getCode();
            } elseif (isset($e->status)) {
                $status = $e->status;
            }
            return ApiResponse::error($e->getMessage(), $status);
        }
    }
}
