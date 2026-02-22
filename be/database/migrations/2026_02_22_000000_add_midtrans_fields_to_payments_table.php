<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add Midtrans-specific columns
        Schema::table('payments', function (Blueprint $table) {
            $table->string('snap_token')->nullable()->after('notes');
            $table->string('midtrans_order_id')->nullable()->after('snap_token');
            $table->string('redirect_url')->nullable()->after('midtrans_order_id');
        });

        // Update payment_status enum to include expired & cancelled
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_status ENUM(
            'pending',
            'waiting_payment',
            'paid',
            'failed',
            'cancelled',
            'expired',
            'refunded'
        ) DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_status ENUM(
            'pending',
            'waiting_payment',
            'paid',
            'failed',
            'refunded'
        ) DEFAULT 'pending'");

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['snap_token', 'midtrans_order_id', 'redirect_url']);
        });
    }
};
