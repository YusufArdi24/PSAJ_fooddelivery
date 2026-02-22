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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_reference')->nullable()->after('payment_method');
            $table->json('payment_details')->nullable()->after('payment_reference');
            $table->timestamp('paid_at')->nullable()->after('payment_details');
            $table->decimal('amount', 10, 2)->nullable()->after('paid_at');
            $table->text('notes')->nullable()->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_reference', 'payment_details', 'paid_at', 'amount', 'notes']);
        });
    }
};
