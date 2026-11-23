<?php

return [
    'app_id' => env('META_APP_ID', '1477925811107025'),
    'app_secret' => env('META_APP_SECRET', '0095bbac7928f5336c261df20e208999'),
    'redirect_uri' => env('META_REDIRECT_URI', 'https://04af-2001-448a-40b0-6662-f854-b8ba-89c5-5fb6.ngrok-free.app/api/instagram/callback'),
    'api_version' => env('META_API_VERSION', null),
    'config_id' => env('CONFIGURATION_ID', '1481123037301339'),
    'encryption_key' => env('ENCRYPTION_KEY', '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
    'scopes' => [
        'instagram_business_basic',
        'instagram_business_content_publish',
    ],
];
