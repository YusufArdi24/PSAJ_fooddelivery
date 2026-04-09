<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Support\Facades\Log;

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
     * Send the email verification notification asynchronously via queue.
     * 
     * @return void
     */
    public function sendEmailVerificationNotification()
    {
        try {
            // Use the notify method which respects queue configuration
            // With failover queue driver, will attempt: database → deferred → sync
            $this->notify(new \App\Notifications\CustomerVerifyEmail);
            
            Log::info('Verification email queued for customer', [
                'customer_id' => $this->id,
                'email' => $this->email,
            ]);
        } catch (\Exception $e) {
            // Log the error but don't fail the registration/auth process
            Log::warning('Failed to queue verification email for customer', [
                'customer_id' => $this->id,
                'email' => $this->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Registration/login succeeds regardless - user can later request email resend
        }
    }

    /**
     * Alternative method to send verification email with explicit queue fallback.
     * Uses database queue by default, falls back to sync if queue fails.
     *
     * @return bool
     */
    public function sendVerificationEmailQueued(): bool
    {
        try {
            // Attempt to dispatch a queued notification
            \Illuminate\Support\Facades\Notification::queue(
                new \App\Notifications\CustomerVerifyEmail
            )->send($this);
            
            return true;
        } catch (\Exception $e) {
            Log::warning('Failed to queue verification email, attempting immediate send', [
                'customer_id' => $this->id,
                'email' => $this->email,
                'error' => $e->getMessage(),
            ]);
            
            try {
                // Fallback: send immediately (single attempt)
                $this->notify(new \App\Notifications\CustomerVerifyEmail);
                return true;
            } catch (\Exception $e2) {
                Log::error('Failed to send verification email immediately', [
                    'customer_id' => $this->id,
                    'email' => $this->email,
                    'error' => $e2->getMessage(),
                ]);
                return false;
            }
        }
    }

    public function sendPasswordResetNotification($token)
    {
        try {
            $this->notify(new \App\Notifications\CustomerResetPassword($token));
        } catch (\Exception $e) {
            Log::warning('Failed to send password reset email for customer: ' . $this->email, [
                'customer_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
        }
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
