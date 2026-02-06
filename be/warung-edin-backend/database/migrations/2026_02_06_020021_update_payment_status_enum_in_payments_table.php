<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update the enum column to include waiting_payment status
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_status ENUM(
            'pending', 
            'waiting_payment',
            'paid', 
            'failed', 
            'refunded'
        ) DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_status ENUM(
            'pending', 
            'paid', 
            'failed', 
            'refunded'
        ) DEFAULT 'pending'");
    }
};
