<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pending_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('email'); // 'email' or 'google'
            $table->string('name');
            $table->string('email')->unique();
            // Reversibly encrypted plain password so the Customer model can hash it properly on account creation
            $table->text('password_encrypted')->nullable();
            $table->string('google_id')->nullable();
            $table->string('google_avatar')->nullable();
            $table->string('pending_token', 128)->unique();
            $table->string('otp', 6)->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->boolean('email_verified')->default(false);
            $table->timestamp('expires_at'); // whole session expiry (24h)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_registrations');
    }
};
