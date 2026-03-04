<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify enum to include 'promo'
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM('order_status', 'price_change', 'new_menu', 'promo') NOT NULL DEFAULT 'order_status'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM('order_status', 'price_change', 'new_menu') NOT NULL DEFAULT 'order_status'");
    }
};
