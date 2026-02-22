<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingRegistration extends Model
{
    protected $table = 'pending_registrations';

    protected $fillable = [
        'type',
        'name',
        'email',
        'password_encrypted',
        'google_id',
        'google_avatar',
        'pending_token',
        'otp',
        'otp_expires_at',
        'email_verified',
        'expires_at',
    ];

    protected $casts = [
        'email_verified'  => 'boolean',
        'otp_expires_at'  => 'datetime',
        'expires_at'      => 'datetime',
    ];
}
