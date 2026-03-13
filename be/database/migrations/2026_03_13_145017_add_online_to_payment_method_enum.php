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
        // Add 'online' to the payment_method enum
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM(
            'cash', 
            'cod', 
            'online',
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
        // Revert by removing 'online' from the enum
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
};
