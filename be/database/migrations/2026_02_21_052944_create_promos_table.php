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
        Schema::create('promos', function (Blueprint $table) {
            $table->id('PromoID');
            $table->unsignedBigInteger('AdminID');
            $table->string('title'); // Judul promo
            $table->text('description'); // Deskripsi promo
            $table->enum('promo_type', ['percentage', 'fixed']); // Tipe diskon: persentase atau fixed amount
            $table->decimal('discount_value', 10, 2); // Nilai diskon (% atau Rp)
            $table->decimal('min_purchase', 10, 2)->nullable(); // Minimal pembelian untuk promo
            $table->decimal('max_discount', 10, 2)->nullable(); // Maksimal diskon (untuk percentage)
            $table->date('start_date'); // Tanggal mulai
            $table->date('end_date'); // Tanggal berakhir
            $table->boolean('is_active')->default(true); // Status aktif
            $table->string('promo_code')->nullable()->unique(); // Kode promo (opsional)
            $table->string('image')->nullable(); // Banner promo
            $table->timestamps();
            
            $table->foreign('AdminID')->references('AdminID')->on('admins')->onDelete('cascade');
            $table->index(['is_active', 'start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promos');
    }
};
