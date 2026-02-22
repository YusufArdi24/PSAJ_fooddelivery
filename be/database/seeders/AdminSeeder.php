<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * NOTE: Pass plain-text passwords — the Admin model's 'hashed' cast
     * handles Hash::make() automatically. Do NOT pre-hash with Hash::make().
     */
    public function run(): void
    {
        $admins = [
            [
                'name' => 'Admin Warung Edin',
                'email' => 'warungedin@gmail.com',
                'phone' => '081298657917',
                'password' => 'edinadmin',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($admins as $adminData) {
            Admin::create($adminData);
        }
    }
}
