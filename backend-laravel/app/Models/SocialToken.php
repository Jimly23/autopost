<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialToken extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'social_tokens';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'social_account_id',
        'access_token',
        'refresh_token',
        'token_type',
        'expires_at',
        'scopes',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class, 'social_account_id');
    }
}
