<?php

namespace App\Http\Controllers;

use App\Http\Resources\AttachmentResource;
use App\Http\Resources\CommentResource;
use App\Http\Resources\TaskResource;
use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;

class SpecialistController extends Controller
{
    private function specialistCheck(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Niste prijavljeni.',
                'errors'  => (object)[
                    'auth' => ['Morate biti prijavljeni.'],
                ],
            ], 401);
        }

        if ($user->role !== 'specialist') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate prava pristupa.',
                'errors'  => (object)[
                    'auth' => ['Samo specijalista može izvršiti ovu akciju.'],
                ],
            ], 403);
        }

        return null;
    }

    private function loadMyTaskOrFail(Request $request, int $taskId)
    {
        $userId = $request->user()->id;

        $task = Task::query()
            ->where('id', $taskId)
            ->where('user_id', $userId)
            ->first();

        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Zadatak nije pronađen.',
                'errors'  => (object)[
                    'task' => ['Ne postoji zadatak ili nemate pristup.'],
                ],
            ], 404);
        }

        return $task;
    }

    //moji taskovi
    public function myTasks(Request $request)
    {
        if ($resp = $this->specialistCheck($request)) return $resp;

        $tasks = Task::query()
            ->where('user_id', $request->user()->id)
            ->with(['project'])
            ->orderByRaw("
                CASE status
                    WHEN 'todo' THEN 1
                    WHEN 'inprogress' THEN 2
                    WHEN 'review' THEN 3
                    WHEN 'done' THEN 4
                    ELSE 5
                END
            ")
            ->orderBy('due_date')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Dodeljeni zadaci su uspešno učitani.',
            'data' => [
                'tasks' => TaskResource::collection($tasks),
            ],
        ]);
    }

    //detalji taska
    public function taskDetails(Request $request, int $id)
    {
        if ($resp = $this->specialistCheck($request)) return $resp;

        $task = $this->loadMyTaskOrFail($request, $id);
        if ($task instanceof \Illuminate\Http\JsonResponse) return $task;

        $task->load([
            'project',
            'comments' => fn ($q) => $q->orderBy('id', 'desc'),
            'comments.user',
            'attachments' => fn ($q) => $q->orderBy('id', 'desc'),
            'attachments.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detalji zadatka su uspešno učitani.',
            'data' => [
                'task' => new TaskResource($task),
                'comments' => CommentResource::collection($task->comments),
                'attachments' => AttachmentResource::collection($task->attachments),
            ],
        ]);
    }

    //azuriranje statusa taska
    public function updateTaskStatus(Request $request, int $id)
    {
        if ($resp = $this->specialistCheck($request)) return $resp;

        $task = $this->loadMyTaskOrFail($request, $id);
        if ($task instanceof \Illuminate\Http\JsonResponse) return $task;

        $validated = $request->validate([
            'status' => ['required', 'in:todo,inprogress,review,done'],
        ]);

        $task->status = $validated['status'];
        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Status zadatka je uspešno ažuriran.',
            'data' => [
                'task' => new TaskResource($task->fresh()),
            ],
        ]);
    }

    //dodavanje komentara
    public function addComment(Request $request, int $taskId)
    {
        if ($resp = $this->specialistCheck($request)) return $resp;

        $task = $this->loadMyTaskOrFail($request, $taskId);
        if ($task instanceof \Illuminate\Http\JsonResponse) return $task;

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
        ]);

        $comment = Comment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        $comment->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Komentar je uspešno dodat.',
            'data' => [
                'comment' => new CommentResource($comment),
            ],
        ], 201);
    }

    //brisanje komentara
    public function deleteComment(Request $request, int $commentId)
    {
        if ($resp = $this->specialistCheck($request)) return $resp;

        $comment = Comment::find($commentId);
        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'Komentar nije pronađen.',
                'errors'  => (object)[
                    'comment' => ['Ne postoji komentar sa prosleđenim ID.'],
                ],
            ], 404);
        }

        // briše samo autor
        if ($comment->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate prava pristupa.',
                'errors'  => (object)[
                    'comment' => ['Možete obrisati samo svoj komentar.'],
                ],
            ], 403);
        }

        // dodatna zaštita: komentar mora biti na zadatku dodeljenom ovom korisniku
        $isMyTask = Task::where('id', $comment->task_id)
            ->where('user_id', $request->user()->id)
            ->exists();

        if (!$isMyTask) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate prava pristupa.',
                'errors'  => (object)[
                    'comment' => ['Ovaj komentar nije na vašem zadatku.'],
                ],
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Komentar je uspešno obrisan.',
            'data' => (object)[],
        ]);
    }

    //dodavanje fajla
    public function addAttachment(Request $request, int $taskId)
    {
        if ($resp = $this->specialistCheck($request)) return $resp;

        $task = $this->loadMyTaskOrFail($request, $taskId);
        if ($task instanceof \Illuminate\Http\JsonResponse) return $task;

        $validated = $request->validate([
            'file_name' => ['required', 'string', 'max:255'],
            // file.io link (ili bilo koji validan url). 
            'file_path' => ['required', 'string', 'url', 'max:2048'],
            'file_size' => ['nullable', 'integer', 'min:0'],
            'mime_type' => ['nullable', 'string', 'max:120'],
        ]);

        $attachment = Attachment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'file_name' => $validated['file_name'],
            'file_path' => $validated['file_path'],
            'file_size' => $validated['file_size'] ?? 0,
            'mime_type' => $validated['mime_type'] ?? 'application/octet-stream',
        ]);

        $attachment->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Prilog je uspešno dodat.',
            'data' => [
                'attachment' => new AttachmentResource($attachment),
            ],
        ], 201);
    }

    //brisanje fajla
    public function deleteAttachment(Request $request, int $attachmentId)
    {
        if ($resp = $this->specialistCheck($request)) return $resp;

        $attachment = Attachment::find($attachmentId);
        if (!$attachment) {
            return response()->json([
                'success' => false,
                'message' => 'Prilog nije pronađen.',
                'errors'  => (object)[
                    'attachment' => ['Ne postoji prilog sa prosleđenim ID.'],
                ],
            ], 404);
        }

        if ($attachment->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate prava pristupa.',
                'errors'  => (object)[
                    'attachment' => ['Možete obrisati samo svoj prilog.'],
                ],
            ], 403);
        }

        $isMyTask = Task::where('id', $attachment->task_id)
            ->where('user_id', $request->user()->id)
            ->exists();

        if (!$isMyTask) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate prava pristupa.',
                'errors'  => (object)[
                    'attachment' => ['Ovaj prilog nije na vašem zadatku.'],
                ],
            ], 403);
        }

        $attachment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Prilog je uspešno obrisan.',
            'data' => (object)[],
        ]);
    }
}
