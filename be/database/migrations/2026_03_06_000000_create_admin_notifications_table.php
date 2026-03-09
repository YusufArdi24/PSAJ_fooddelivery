<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('AdminID')->nullable(); // null = broadcast to all admins
            $table->string('type', 50); // 'new_order', 'order_status_change', etc.
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable(); // Additional data (OrderID, etc.)
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->foreign('AdminID')->references('AdminID')->on('admins')->onDelete('cascade');
            $table->index(['AdminID', 'read_at', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
