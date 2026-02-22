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
        Schema::table('promos', function (Blueprint $table) {
            // Add MenuID for menu-specific promo
            $table->unsignedBigInteger('MenuID')->after('AdminID');
            $table->foreign('MenuID')->references('MenuID')->on('menus')->onDelete('cascade');
            
            // Drop columns that are no longer needed
            $table->dropColumn(['min_purchase', 'promo_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promos', function (Blueprint $table) {
            $table->dropForeign(['MenuID']);
            $table->dropColumn('MenuID');
            
            $table->decimal('min_purchase', 10, 2)->nullable();
            $table->string('promo_code')->nullable()->unique();
        });
    }
};
