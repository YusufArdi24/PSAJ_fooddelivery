<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Promo extends Model
{
    protected $primaryKey = 'PromoID';
    
    protected $fillable = [
        'AdminID',
        'MenuID',
        'title',
        'description',
        'promo_type',
        'discount_value',
        'max_discount',
        'start_date',
        'end_date',
        'is_active',
        'image',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['image_url', 'formatted_discount', 'is_valid', 'discounted_price'];

    // Relationships
    public function admin()
    {
        return $this->belongsTo(Admin::class, 'AdminID', 'AdminID');
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'MenuID', 'MenuID');
    }

    // Accessor for image URL
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->image) {
                    if (str_starts_with($this->image, 'http')) {
                        return $this->image;
                    }
                    if (str_contains($this->image, 'promo-images/')) {
                        return url('storage/' . $this->image);
                    }
                    return url('storage/promo-images/' . $this->image);
                }
                return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzliOWNhMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb21vPC90ZXh0Pgo8L3N2Zz4=';
            }
        );
    }

    // Accessor for formatted discount
    protected function formattedDiscount(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->promo_type === 'percentage') {
                    return $this->discount_value . '%';
                }
                return 'Rp ' . number_format($this->discount_value, 0, ',', '.');
            }
        );
    }

    // Accessor to check if promo is currently valid
    protected function isValid(): Attribute
    {
        return Attribute::make(
            get: function () {
                $now = now();
                return $this->is_active 
                    && $this->start_date <= $now 
                    && $this->end_date >= $now;
            }
        );
    }

    // Scope for active promos
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now());
    }

    // Helper to calculate discount for menu price
    public function calculateDiscount($menuPrice = null)
    {
        $price = $menuPrice ?? ($this->menu ? $this->menu->price : 0);
        
        if ($price <= 0) {
            return 0;
        }

        if ($this->promo_type === 'percentage') {
            $discount = $price * ($this->discount_value / 100);
            if ($this->max_discount) {
                $discount = min($discount, $this->max_discount);
            }
            return $discount;
        }

        // Fixed amount - make sure discount doesn't exceed price
        return min($this->discount_value, $price);
    }

    // Accessor for discounted price
    protected function discountedPrice(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->menu) {
                    return 0;
                }
                $originalPrice = $this->menu->price;
                $discount = $this->calculateDiscount($originalPrice);
                return max(0, $originalPrice - $discount);
            }
        );
    }
}
