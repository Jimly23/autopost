<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'uploads/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://automation-social.netlify.app',
    ]),

    'allowed_origins_patterns' => [
        '#^https?://.*\.ngrok-free\.app$#',
        '#^https?://.*\.netlify\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];
