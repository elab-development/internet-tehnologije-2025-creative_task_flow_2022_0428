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
                 'profile_photo' => 'https://cdn.prod.website-files.com/6600e1eab90de089c2d9c9cd/6697274132daf24911799669_6635609f1211ec0f632803d6_fatzFxYM_ad86_raw.jpeg',
            ]
        );

        User::updateOrCreate(
            ['email' => 'iva@creative.net'],
            [
                'name' => 'Iva',
                'role' => 'manager',
                'password' => Hash::make('creative'),
                'profile_photo' => 'https://cdn.prod.website-files.com/6600e1eab90de089c2d9c9cd/662c0927dc614ac9adfac27b_661a4b0ac0cb1ebd35610aa9_Woman.webp',
            ]
        );
        User::updateOrCreate(
            ['email' => 'marija@creative.net'],
            [
                'name' => 'Marija',
                'role' => 'specialist',
                'password' => Hash::make('creative'),
                'profile_photo' => 'https://cdn.pixabay.com/photo/2025/01/21/20/39/ai-generated-9350464_1280.png',
            ]
        );

        User::updateOrCreate(
            ['email' => 'anja@creative.net'],
            [
                'name' => 'Anja',
                'role' => 'specialist',
                'password' => Hash::make('creative'),
                'profile_photo' => 'https://petapixel.com/assets/uploads/2023/09/375727520_10161373112792533_7376944103131811808_n-646x800.jpg',
            ]
        );

        User::updateOrCreate(
            ['email' => 'nikola@creative.net'],
            [
                'name' => 'Nikola',
                'role' => 'specialist',
                'password' => Hash::make('creative'),
                'profile_photo' => 'https://i.pinimg.com/474x/60/5b/9b/605b9b86a82dd0147ed8aa612381326f.jpg',
            ]
        );

        User::updateOrCreate(
            ['email' => 'jelena@creative.net'],
            [
                'name' => 'Jelena',
                'role' => 'specialist',
                'password' => Hash::make('creative'),
                'profile_photo' => 'https://d2v5dzhdg4zhx3.cloudfront.net/web-assets/images/storypages/short/ai_person_generator/ai_person_generator/webp/thumb_image/001.webp',
            ]
        );
    }
}
