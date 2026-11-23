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
        // 1. Social Accounts
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('platform', 50)->default('instagram');
            $table->string('platform_user_id', 255);
            $table->string('username', 255);
            $table->string('account_type', 50)->nullable();
            $table->text('profile_picture')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['platform', 'platform_user_id'], 'platform_account_unique');
            $table->index('user_id');
        });

        // 2. Social Tokens
        Schema::create('social_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('social_account_id')->unique();
            $table->text('access_token');
            $table->string('token_type', 50)->default('bearer');
            $table->timestamp('expires_at')->nullable();
            $table->text('scopes')->nullable();
            $table->timestamps();

            $table->foreign('social_account_id')->references('id')->on('social_accounts')->onDelete('cascade');
        });

        // 3. Posts
        Schema::create('posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('social_account_id');
            $table->text('caption')->nullable();
            $table->string('media_type', 20); // 'IMAGE', 'VIDEO', 'REELS', 'CAROUSEL'
            $table->text('media_url');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->string('status', 20)->default('draft');
            $table->string('platform_post_id', 255)->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('social_account_id')->references('id')->on('social_accounts')->onDelete('cascade');
            $table->index('user_id');
            $table->index('social_account_id');
            $table->index(['status', 'scheduled_at']);
        });

        // 4. Publishing Logs
        Schema::create('publishing_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id');
            $table->string('action', 100);
            $table->string('status', 50);
            $table->text('response_data')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
            $table->index('post_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('publishing_logs');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('social_tokens');
        Schema::dropIfExists('social_accounts');
    }
};
