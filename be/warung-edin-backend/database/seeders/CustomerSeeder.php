<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'address' => 'Jl. Malioboro No. 123, Yogyakarta',
                'phone' => '+628123456789',
                'password' => Hash::make('password123'),
                'is_verified' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Siti Rahayu',
                'email' => 'siti@example.com', 
                'address' => 'Jl. Sudirman No. 456, Jakarta',
                'phone' => '+628987654321',
                'password' => Hash::make('password123'),
                'is_verified' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Ahmad Wijaya',
                'email' => 'ahmad@example.com',
                'address' => 'Jl. Diponegoro No. 789, Bandung', 
                'phone' => '+628555666777',
                'password' => Hash::make('password123'),
                'is_verified' => false,
                'email_verified_at' => null,
            ],
            [
                'name' => 'Maya Sari',
                'email' => 'maya@example.com',
                'address' => 'Jl. Pemuda No. 321, Semarang',
                'phone' => '+628444333222', 
                'password' => Hash::make('password123'),
                'is_verified' => true,
                'email_verified_at' => now()->subDays(3),
            ],
            [
                'name' => 'Rizki Pratama',
                'email' => 'rizki@example.com',
                'address' => 'Jl. Gatot Subroto No. 654, Surabaya',
                'phone' => '+628777888999',
                'password' => Hash::make('password123'),
                'is_verified' => false,
                'email_verified_at' => null,
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }
    }
}