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
        if (!Schema::hasColumn('order_details', 'menu_name')) {
            Schema::table('order_details', function (Blueprint $table) {
                $table->string('menu_name')->nullable()->after('MenuID');
            });
        }

        // Backfill existing rows from the menu relationship
        DB::table('order_details')
            ->join('menus', 'order_details.MenuID', '=', 'menus.MenuID')
            ->whereNull('order_details.menu_name')
            ->update(['order_details.menu_name' => DB::raw('menus.name')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_details', function (Blueprint $table) {
            $table->dropColumn('menu_name');
        });
    }
};
