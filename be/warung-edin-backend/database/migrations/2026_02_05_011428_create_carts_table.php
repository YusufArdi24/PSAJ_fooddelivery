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
        Schema::create('carts', function (Blueprint $table) {
            $table->id('CartID');
            $table->unsignedBigInteger('CustomerID');
            $table->unsignedBigInteger('MenuID');
            $table->integer('quantity');
            $table->decimal('price', 10, 2);
            $table->timestamps();
            
            $table->foreign('CustomerID')->references('CustomerID')->on('customers')->onDelete('cascade');
            $table->foreign('MenuID')->references('MenuID')->on('menus')->onDelete('cascade');
            
            // Prevent duplicate items for same customer and menu
            $table->unique(['CustomerID', 'MenuID']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
