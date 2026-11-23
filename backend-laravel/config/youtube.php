<?php

return [
    'client_id' => env('YOUTUBE_CLIENT_ID'),
    'client_secret' => env('YOUTUBE_CLIENT_SECRET'),
    'redirect_uri' => env('YOUTUBE_REDIRECT_URI', 'https://automation.bikinkafe.id/api/auth/youtube/callback'),
    'scopes' => [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'openid',
        'email',
        'profile',
    ],
];
