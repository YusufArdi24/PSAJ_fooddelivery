<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\MustVerifyEmail;

class Customer extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'CustomerID';
    
    protected $fillable = [
        'name',
        'email',
        'google_id',
        'address', 
        'address_label',
        'address_notes',
        'address_label',
        'address_notes',
        'phone',
        'password',
        'is_verified',
        'avatar',
        'latitude',
        'longitude',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_verified' => 'boolean',
    ];

    /**
     * Send the email verification notification.
     *
     * @return void
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new \App\Notifications\CustomerVerifyEmail);
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new \App\Notifications\CustomerResetPassword($token));
    }

    // Relationships
    public function orders()
    {
        return $this->hasMany(Order::class, 'CustomerID', 'CustomerID');
    }

    public function cartItems()
    {
        return $this->hasMany(Cart::class, 'CustomerID', 'CustomerID');
    }
}
