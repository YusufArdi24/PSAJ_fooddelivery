<?php

namespace Database\Seeders;


use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seeder dikosongkan - menu akan dimasukkan melalui admin panel
        $this->command->info('MenuSeeder skipped - please add menus via admin panel');
    }
}