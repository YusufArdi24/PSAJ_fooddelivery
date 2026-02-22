<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_details', function (Blueprint $table) {
            // Store the variant chosen by the customer (e.g. "Goreng" / "Kuah")
            $table->string('selected_variant')->nullable()->after('discount_per_item');
        });
    }

    public function down(): void
    {
        Schema::table('order_details', function (Blueprint $table) {
            $table->dropColumn('selected_variant');
        });
    }
};
