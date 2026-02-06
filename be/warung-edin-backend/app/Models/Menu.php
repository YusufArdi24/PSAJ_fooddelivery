<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Menu extends Model
{
    use HasFactory;

    protected $primaryKey = 'MenuID';
    
    protected $fillable = [
        'AdminID',
        'name',
        'description',
        'price',
        'category',
        'image',
        'image_type',
        'is_available',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function admin()
    {
        return $this->belongsTo(Admin::class, 'AdminID', 'AdminID');
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class, 'MenuID', 'MenuID');
    }

    // Accessor for formatted price
    protected function formattedPrice(): Attribute
    {
        return Attribute::make(
            get: fn () => 'Rp ' . number_format($this->price, 0, ',', '.')
        );
    }
}
