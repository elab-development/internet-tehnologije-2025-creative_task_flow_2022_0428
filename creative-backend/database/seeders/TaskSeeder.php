<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\Task;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        // Da ne dupliramo podatke pri ponovnom seed-ovanju.
        Task::query()->delete();

        $taskTemplates = [
            [
                'title' => 'Priprema brief-a',
                'description' => 'Napraviti kratak brief i definisati cilj kampanje.',
                'priority' => 'high',
                'status' => 'todo',
            ],
            [
                'title' => 'Copy za objave',
                'description' => 'Napisati copy varijante za objave i oglase.',
                'priority' => 'medium',
                'status' => 'inprogress',
            ],
            [
                'title' => 'Vizuali i dizajn',
                'description' => 'Pripremiti osnovne vizuale i formatirati za kanale.',
                'priority' => 'high',
                'status' => 'todo',
            ],
            [
                'title' => 'QA i finalni pregled',
                'description' => 'Proveriti linkove, tekstove, formate i spremiti za objavu.',
                'priority' => 'low',
                'status' => 'review',
            ],
        ];

        $projects = Project::with(['users' => function ($q) {
            $q->where('role', 'specialist');
        }])->get();

        foreach ($projects as $project) {
            $specialists = $project->users;

            // Ako projekat nema specijaliste, preskoči
            if ($specialists->isEmpty()) {
                continue;
            }

            foreach ($taskTemplates as $index => $tpl) {
                $assignee = $specialists[$index % $specialists->count()];

                Task::create([
                    'project_id' => $project->id,
                    'user_id' => $assignee->id,
                    'title' => $tpl['title'] . ' - ' . $project->name,
                    'description' => $tpl['description'],
                    'priority' => $tpl['priority'],
                    'status' => $tpl['status'],
                    'due_date' => now()->addDays(7 + ($index * 3))->toDateString(),
                ]);
            }
        }
    }
}
