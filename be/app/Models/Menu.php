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
        'variants',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
        'variants' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['image_url', 'formatted_price'];

    // Relationships
    public function admin()
    {
        return $this->belongsTo(Admin::class, 'AdminID', 'AdminID');
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class, 'MenuID', 'MenuID');
    }

    public function promos()
    {
        return $this->hasMany(Promo::class, 'MenuID', 'MenuID');
    }

    public function activePromo()
    {
        return $this->hasOne(Promo::class, 'MenuID', 'MenuID')
            ->where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->orderBy('created_at', 'desc');
    }

    // Accessor for image URL
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->image) {
                    // If image starts with http, it's already a full URL
                    if (str_starts_with($this->image, 'http')) {
                        return $this->image;
                    }
                    // If image contains 'menu-images/', it's a storage path
                    if (str_contains($this->image, 'menu-images/')) {
                        return url('storage/' . $this->image);
                    }
                    // Otherwise assume it's just the filename in menu-images directory
                    return url('storage/menu-images/' . $this->image);
                }
                // Return placeholder SVG if no image
                return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzliOWNhMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';
            }
        );
    }

    // Accessor for formatted price
    protected function formattedPrice(): Attribute
    {
        return Attribute::make(
            get: fn () => 'Rp ' . number_format($this->price, 0, ',', '.')
        );
    }
}
