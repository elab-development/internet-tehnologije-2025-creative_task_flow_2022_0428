<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $projects = [
            [
                'name' => 'Instagram Launch',
                'description' => 'Plan objava, vizuali i copy za lansiranje na Instagramu.',
                'status' => 'active',
                'start_date' => '2026-01-10',
                'end_date' => '2026-02-10',
            ],
            [
                'name' => 'Website Redesign Promo',
                'description' => 'Promocija redizajna sajta kroz kanale i kampanje.',
                'status' => 'active',
                'start_date' => '2026-01-15',
                'end_date' => '2026-03-01',
            ],
            [
                'name' => 'Email Campaign Q1',
                'description' => 'Newsletter serija i automatizacije za Q1.',
                'status' => 'planned',
                'start_date' => '2026-02-01',
                'end_date' => '2026-03-31',
            ],
            [
                'name' => 'Google Ads Basics',
                'description' => 'Osnovna kampanja za pretragu sa malim budžetom.',
                'status' => 'planned',
                'start_date' => '2026-02-05',
                'end_date' => '2026-02-28',
            ],
            [
                'name' => 'Brand Guidelines Update',
                'description' => 'Ažuriranje smernica brenda i šablona.',
                'status' => 'completed',
                'start_date' => '2025-12-01',
                'end_date' => '2025-12-20',
            ],
        ];

        foreach ($projects as $p) {
            Project::updateOrCreate(
                ['name' => $p['name']],
                $p
            );
        }
    }
}
