<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Attachment;
use App\Models\Task;
use App\Models\User;

class AttachmentSeeder extends Seeder
{
    public function run(): void
    {
        // Da ne duplira podatke pri ponovnom seed-ovanju.
        Attachment::query()->delete();

        $manager = User::where('email', 'iva@creative.net')->first();

        $files = [
            [
                'file_name' => 'brief.pdf',
                'file_path' => 'uploads/briefs/brief.pdf',
                'file_size' => 245760,
                'mime_type' => 'application/pdf',
            ],
            [
                'file_name' => 'vizual_1.png',
                'file_path' => 'uploads/visuals/vizual_1.png',
                'file_size' => 512000,
                'mime_type' => 'image/png',
            ],
            [
                'file_name' => 'copy_draft.docx',
                'file_path' => 'uploads/copy/copy_draft.docx',
                'file_size' => 102400,
                'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
            [
                'file_name' => 'ads_plan.xlsx',
                'file_path' => 'uploads/plans/ads_plan.xlsx',
                'file_size' => 204800,
                'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
            [
                'file_name' => 'brand_guidelines.pdf',
                'file_path' => 'uploads/brand/brand_guidelines.pdf',
                'file_size' => 734003,
                'mime_type' => 'application/pdf',
            ],
        ];

        $tasks = Task::all();

        foreach ($tasks as $task) {
            // ~40% taskova dobije prilog
            if (random_int(1, 100) > 40) {
                continue;
            }

            // 1 ili 2 priloga
            $count = random_int(1, 2);

            for ($i = 0; $i < $count; $i++) {
                $f = $files[array_rand($files)];

                // uploader: ili izvršilac ili menadžerka 
                $uploaderId = $task->user_id;
                if ($manager && random_int(1, 100) <= 30) {
                    $uploaderId = $manager->id;
                }

                Attachment::create([
                    'task_id' => $task->id,
                    'user_id' => $uploaderId,
                    'file_name' => $f['file_name'],
                    'file_path' => $f['file_path'],
                    'file_size' => $f['file_size'],
                    'mime_type' => $f['mime_type'],
                ]);
            }
        }
    }
}
