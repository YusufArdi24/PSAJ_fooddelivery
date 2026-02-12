<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admins = [
            [
                'name' => 'Admin Warung Edin',
                'email' => 'warungedin@gmail.com',
                'phone' => '081298657917',
                'password' => Hash::make('edinadmin'),
                'email_verified_at' => now(),
            ],
        ];

        foreach ($admins as $adminData) {
            Admin::create($adminData);
        }
    }
}
