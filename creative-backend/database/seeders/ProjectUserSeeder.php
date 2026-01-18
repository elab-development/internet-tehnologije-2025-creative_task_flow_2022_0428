<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;

class ProjectUserSeeder extends Seeder
{
    public function run(): void
    {
        //menadzerka
        $manager = User::where('email', 'iva@creative.net')->firstOrFail();

        $specialists = User::whereIn('email', [
            'marija@creative.net',
            'anja@creative.net',
            'nikola@creative.net',
            'jelena@creative.net',
        ])->get()->keyBy('email');

        $projects = Project::whereIn('name', [
            'Instagram Launch',
            'Website Redesign Promo',
            'Email Campaign Q1',
            'Google Ads Basics',
            'Brand Guidelines Update',
        ])->get()->keyBy('name');

        // Iva (manager) je na svim projektima
        foreach ($projects as $project) {
            $project->users()->syncWithoutDetaching([$manager->id]);
        }

        // Raspodela specijalista 
        $assignments = [
            'Instagram Launch' => ['marija@creative.net', 'anja@creative.net'],
            'Website Redesign Promo' => ['anja@creative.net', 'nikola@creative.net'],
            'Email Campaign Q1' => ['marija@creative.net', 'jelena@creative.net'],
            'Google Ads Basics' => ['nikola@creative.net'],
            'Brand Guidelines Update' => ['jelena@creative.net', 'anja@creative.net'],
        ];

        foreach ($assignments as $projectName => $emails) {
            $project = $projects[$projectName];

            $userIds = [];
            foreach ($emails as $email) {
                if (isset($specialists[$email])) {
                    $userIds[] = $specialists[$email]->id;
                }
            }

            $project->users()->syncWithoutDetaching($userIds);
        }
    }
}
