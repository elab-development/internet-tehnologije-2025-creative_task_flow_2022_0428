<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Comment;
use App\Models\Task;
use App\Models\User;

class CommentSeeder extends Seeder
{
    public function run(): void
    {
        // Da ne duplira podatke pri ponovnom seed-ovanju
        Comment::query()->delete();

        $manager = User::where('email', 'iva@creative.net')->first();

        $tasks = Task::with(['user'])->get();

        foreach ($tasks as $i => $task) {
            // 1 komentar od izvršioca taska
            Comment::create([
                'task_id' => $task->id,
                'user_id' => $task->user_id,
                'content' => 'Krećem sa radom na zadatku. Ažuriraću status kad završim sledeći korak.',
            ]);

            // Opcioni komentar od menadžerke - svaki drugi task
            if ($manager && $i % 2 === 0) {
                Comment::create([
                    'task_id' => $task->id,
                    'user_id' => $manager->id,
                    'content' => 'Super. Obrati pažnju na rok i pošalji mi kratko ažuriranje kad budeš na 50%.',
                ]);
            }
        }
    }
}
