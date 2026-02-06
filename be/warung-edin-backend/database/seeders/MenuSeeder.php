<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get first admin to assign menus
        $admin = Admin::first();
        
        if (!$admin) {
            $this->command->error('No admin found! Please run AdminSeeder first.');
            return;
        }
        
        $menus = [
            [
                'AdminID' => $admin->AdminID,
                'name' => 'Nasi Gudeg',
                'description' => 'Nasi gudeg khas Jogja dengan ayam dan telur',
                'price' => 15000,
                'category' => 'main_course',
                'image' => null,
                'image_type' => null,
                'is_available' => true,
            ],
            [
                'AdminID' => $admin->AdminID,
                'name' => 'Soto Ayam',
                'description' => 'Soto ayam dengan kuah bening dan rempah',
                'price' => 12000,
                'category' => 'main_course', 
                'image' => null,
                'image_type' => null,
                'is_available' => true,
            ],
            [
                'AdminID' => $admin->AdminID,
                'name' => 'Es Teh Manis',
                'description' => 'Teh manis dingin segar',
                'price' => 3000,
                'category' => 'beverage',
                'image' => null,
                'image_type' => null,
                'is_available' => true,
            ],
            [
                'AdminID' => $admin->AdminID,
                'name' => 'Gado-Gado',
                'description' => 'Gado-gado sayuran dengan bumbu kacang',
                'price' => 10000,
                'category' => 'appetizer',
                'image' => null,
                'image_type' => null,
                'is_available' => true,
            ],
            [
                'AdminID' => $admin->AdminID,
                'name' => 'Pisang Goreng',
                'description' => 'Pisang goreng crispy dengan tepung',
                'price' => 8000,
                'category' => 'dessert',
                'image' => null,
                'image_type' => null,
                'is_available' => true,
            ]
        ];
        
        foreach ($menus as $menu) {
            Menu::create($menu);
        }
        
        $this->command->info('Sample menus created successfully!');
    }
}