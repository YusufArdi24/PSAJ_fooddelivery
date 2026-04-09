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
            // Check if admin already exists (prevents duplicates on redeploy)
            $existingAdmin = Admin::where('email', $adminData['email'])->first();
            
            if ($existingAdmin) {
                echo "✅ Admin account already exists: {$adminData['email']}\n";
                continue;
            }

            Admin::create($adminData);
            echo "✅ Admin account created: {$adminData['email']}\n";
        }
    }
}
