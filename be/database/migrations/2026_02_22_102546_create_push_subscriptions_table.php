<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('CustomerID');
            $table->string('endpoint', 500);
            $table->text('public_key');
            $table->text('auth_token');
            $table->timestamps();

            $table->foreign('CustomerID')->references('CustomerID')->on('customers')->onDelete('cascade');
            // Note: endpoint is varchar(500), unique index enforced at application level
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};

