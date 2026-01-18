<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@creative.net'],
            [
                'name' => 'Admin',
                'role' => 'admin',
                'password' => Hash::make('admin'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'iva@creative.net'],
            [
                'name' => 'Iva',
                'role' => 'manager',
                'password' => Hash::make('creative'),
            ]
        );
        User::updateOrCreate(
            ['email' => 'marija@creative.net'],
            [
                'name' => 'Marija',
                'role' => 'specialist',
                'password' => Hash::make('creative'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'anja@creative.net'],
            [
                'name' => 'Anja',
                'role' => 'specialist',
                'password' => Hash::make('creative'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'nikola@creative.net'],
            [
                'name' => 'Nikola',
                'role' => 'specialist',
                'password' => Hash::make('creative'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'jelena@creative.net'],
            [
                'name' => 'Jelena',
                'role' => 'specialist',
                'password' => Hash::make('creative'),
            ]
        );
    }
}
