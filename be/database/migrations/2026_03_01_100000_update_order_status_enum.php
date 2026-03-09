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
        // Update existing statuses to simplified ones
        DB::table('orders')->where('status', 'preparing')->update(['status' => 'confirmed']);
        DB::table('orders')->where('status', 'ready')->update(['status' => 'confirmed']);
        DB::table('orders')->where('status', 'cancelled')->update(['status' => 'pending']);
        
        // Modify enum to only have 3 statuses
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'delivered') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore original 6 statuses
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending'");
    }
};
