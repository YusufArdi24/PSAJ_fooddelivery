<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class OrderDetail extends Model
{
    use HasFactory;

    protected $primaryKey = 'OrderDetailID';
    
    protected $fillable = [
        'OrderID',
        'MenuID',
        'menu_name',
        'quantity',
        'price',
        'original_price',
        'discount_per_item',
        'selected_variant',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'discount_per_item' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(Order::class, 'OrderID', 'OrderID');
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'MenuID', 'MenuID');
    }

    // Calculated attributes
    protected function subtotal(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->quantity * $this->price
        );
    }

    protected function formattedSubtotal(): Attribute
    {
        return Attribute::make(
            get: fn () => 'Rp ' . number_format($this->subtotal, 0, ',', '.')
        );
    }
}
