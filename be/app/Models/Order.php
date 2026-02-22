<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Order extends Model
{
    use HasFactory;

    protected $primaryKey = 'OrderID';
    
    protected $fillable = [
        'CustomerID',
        'order_date',
        'total_price',
        'discount_amount',
        'status',
        'notes'
    ];

    protected $casts = [
        'order_date' => 'datetime',
        'total_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PREPARING = 'preparing';
    const STATUS_READY = 'ready';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'CustomerID', 'CustomerID');
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class, 'OrderID', 'OrderID');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'OrderID', 'OrderID');
    }

    // Accessor for formatted total price
    protected function formattedTotalPrice(): Attribute
    {
        return Attribute::make(
            get: fn () => 'Rp ' . number_format($this->total_price, 0, ',', '.')
        );
    }

    // Status badge color for Filament
    public function getStatusColor(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'confirmed' => 'info', 
            'preparing' => 'primary',
            'ready' => 'success',
            'delivered' => 'success',
            'cancelled' => 'danger',
            default => 'secondary'
        };
    }
}
