<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cart extends Model
{
    protected $primaryKey = 'CartID';
    
    protected $fillable = [
        'CustomerID',
        'MenuID',
        'quantity',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    // Relationships
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'CustomerID', 'CustomerID');
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'MenuID', 'MenuID');
    }

    // Calculate subtotal
    public function getSubtotalAttribute()
    {
        return $this->price * $this->quantity;
    }
}
