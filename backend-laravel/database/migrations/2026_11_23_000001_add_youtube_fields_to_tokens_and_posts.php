<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('social_tokens', function (Blueprint $table) {
            if (!Schema::hasColumn('social_tokens', 'refresh_token')) {
                $table->text('refresh_token')->nullable()->after('access_token');
            }
        });

        Schema::table('posts', function (Blueprint $table) {
            if (!Schema::hasColumn('posts', 'title')) {
                $table->string('title', 100)->nullable()->after('caption');
            }
            if (!Schema::hasColumn('posts', 'privacy_status')) {
                $table->string('privacy_status', 20)->default('public')->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_tokens', function (Blueprint $table) {
            if (Schema::hasColumn('social_tokens', 'refresh_token')) {
                $table->dropColumn('refresh_token');
            }
        });

        Schema::table('posts', function (Blueprint $table) {
            if (Schema::hasColumn('posts', 'title')) {
                $table->dropColumn('title');
            }
            if (Schema::hasColumn('posts', 'privacy_status')) {
                $table->dropColumn('privacy_status');
            }
        });
    }
};
