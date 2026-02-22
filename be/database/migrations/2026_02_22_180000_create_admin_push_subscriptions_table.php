<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('AdminID');
            $table->string('endpoint', 500);
            $table->text('public_key');
            $table->text('auth_token');
            $table->timestamps();

            $table->foreign('AdminID')->references('AdminID')->on('admins')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_push_subscriptions');
    }
};
