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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('CustomerID')->nullable();
            $table->enum('type', ['order_status', 'price_change', 'new_menu'])->default('order_status');
            $table->string('title');
            $table->text('message');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('menu_id')->nullable();
            $table->boolean('read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->foreign('CustomerID')->references('CustomerID')->on('customers')->onDelete('cascade');
            $table->foreign('order_id')->references('OrderID')->on('orders')->onDelete('cascade');
            $table->foreign('menu_id')->references('MenuID')->on('menus')->onDelete('cascade');
            
            $table->index(['CustomerID', 'read', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
