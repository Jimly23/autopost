<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * GET /api/dashboard/overview
     */
    public function overview(Request $request): JsonResponse
    {
        $userId = $request->session()->get('userId') ?? Auth::id();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $overview = $this->dashboardService->getOverview($userId);
            return ApiResponse::success(['overview' => $overview]);
        } catch (\Throwable $e) {
            return ApiResponse::error($e->getMessage(), 500);
        }
    }
}
