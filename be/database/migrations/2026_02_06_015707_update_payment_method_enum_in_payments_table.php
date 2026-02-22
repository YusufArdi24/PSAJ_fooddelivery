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
        // Update the enum column to include all payment methods
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM(
            'cash', 
            'cod', 
            'transfer', 
            'gopay', 
            'dana', 
            'ovo', 
            'linkaja', 
            'shopeepay', 
            'qris', 
            'bca', 
            'mandiri', 
            'bni', 
            'bri', 
            'e-wallet', 
            'credit_card'
        ) DEFAULT 'cash'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM(
            'cash', 
            'transfer', 
            'e-wallet', 
            'credit_card'
        ) DEFAULT 'cash'");
    }
};
