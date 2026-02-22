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
        // Add discount_amount to orders
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('discount_amount', 10, 2)->nullable()->default(0)->after('total_price');
        });

        // Add original_price + discount_per_item to order_details
        Schema::table('order_details', function (Blueprint $table) {
            $table->decimal('original_price', 10, 2)->nullable()->after('price');
            $table->decimal('discount_per_item', 10, 2)->nullable()->default(0)->after('original_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('discount_amount');
        });

        Schema::table('order_details', function (Blueprint $table) {
            $table->dropColumn(['original_price', 'discount_per_item']);
        });
    }
};
