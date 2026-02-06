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
        'quantity',
        'price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
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
