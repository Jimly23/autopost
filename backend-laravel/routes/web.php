<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Route;

$frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

Route::get('/', function () {
    return view('landing');
});

Route::get('/privacy', function () {
    return view('privacy');
});

Route::get('/privacy-policy', function () {
    return view('privacy');
});

Route::get('/terms', function () {
    return view('terms');
});

Route::get('/terms-of-service', function () {
    return view('terms');
});

Route::get('/uploads/{filename}', function (string $filename) {
    $path = public_path("uploads/{$filename}");
    if (!File::exists($path)) {
        abort(404);
    }

    $mime = File::mimeType($path);
    return Response::file($path, [
        'Content-Type' => $mime,
        'Access-Control-Allow-Origin' => '*',
    ]);
})->where('filename', '.*');
