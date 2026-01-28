<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Http\Resources\UserResource;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ManagerController extends Controller
{

//privatna metoda provere uloge
    private function managerCheck(Request $request)
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

        if ($user->role !== 'manager') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate prava pristupa.',
                'errors'  => (object)[
                    'auth' => ['Samo menadžer može izvršiti ovu akciju.'],
                ],
            ], 403);
        }

        return null;
    }

    private function loadProjectForManagerOrFail(Request $request, int $projectId): Project|\Illuminate\Http\JsonResponse
    {
        $manager = $request->user();

        $project = Project::query()
            ->where('id', $projectId)
            ->whereHas('users', fn ($q) => $q->where('users.id', $manager->id))
            ->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Projekat nije pronađen.',
                'errors'  => (object)[
                    'project' => ['Ne postoji projekat ili nemate pristup.'],
                ],
            ], 404);
        }

        return $project;
    }

    //vracamo niz projekta na kom je korisnik
    public function projects(Request $request)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $managerId = $request->user()->id;

        $projects = Project::query()
            ->whereHas('users', fn ($q) => $q->where('users.id', $managerId))
            ->withCount('tasks')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Projekti su uspešno učitani.',
            'data' => [
                'projects' => ProjectResource::collection($projects),
            ],
        ]);
    }

    //detalji jednog projekta
    public function projectDetails(Request $request, int $id)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $project = $this->loadProjectForManagerOrFail($request, $id);
        if ($project instanceof \Illuminate\Http\JsonResponse) return $project;

        $project->load([
            'users',
            'tasks' => fn ($q) => $q->orderByRaw("
                CASE status
                    WHEN 'todo' THEN 1
                    WHEN 'inprogress' THEN 2
                    WHEN 'review' THEN 3
                    WHEN 'done' THEN 4
                    ELSE 5
                END
            ")->orderBy('due_date')->orderBy('id', 'desc'),
            'tasks.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detalji projekta su uspešno učitani.',
            'data' => [
                'project' => new ProjectResource($project),
            ],
        ]);
    }

    //kreiranje novog projekta
    public function createProject(Request $request)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:planned,active,completed,archived'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            // opcionalno odmah dodajemo članove
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $managerId = $request->user()->id;

        return DB::transaction(function () use ($validated, $managerId) {

            $project = Project::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
            ]);

            // menadžer mora biti član projekta.
            $project->users()->syncWithoutDetaching([$managerId]);

            // opcionalno dodaš specijaliste/članove.
            if (!empty($validated['member_ids'])) {
                $ids = collect($validated['member_ids'])
                    ->unique()
                    ->reject(fn ($id) => $id === $managerId)
                    ->values()
                    ->all();

                if (!empty($ids)) {
                    $project->users()->syncWithoutDetaching($ids);
                }
            }

            //prebrojava se koliko taskova imamo
            $project->loadCount('tasks');

            return response()->json([
                'success' => true,
                'message' => 'Projekat je uspešno kreiran.',
                'data' => [
                    'project' => new ProjectResource($project),
                ],
            ], 201);
        });
    }

    //azuriranje projekta
    public function updateProject(Request $request, int $id)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $project = $this->loadProjectForManagerOrFail($request, $id);
        if ($project instanceof \Illuminate\Http\JsonResponse) return $project;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:planned,active,completed,archived'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $project->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Projekat je uspešno ažuriran.',
            'data' => [
                'project' => new ProjectResource($project->fresh()),
            ],
        ]);
    }

    //ko su clanovi tog projekta
    public function projectMembers(Request $request, int $id)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $project = $this->loadProjectForManagerOrFail($request, $id);
        if ($project instanceof \Illuminate\Http\JsonResponse) return $project;

        $project->load('users');

        return response()->json([
            'success' => true,
            'message' => 'Članovi projekta su uspešno učitani.',
            'data' => [
                'users' => UserResource::collection($project->users),
            ],
        ]);
    }

    //dodavanje clanova na projekte
    public function addMembers(Request $request, int $id)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $project = $this->loadProjectForManagerOrFail($request, $id);
        if ($project instanceof \Illuminate\Http\JsonResponse) return $project;

        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $managerId = $request->user()->id;

        //  admini ne mogu na projekte
        $users = User::whereIn('id', $validated['user_ids'])->get(['id', 'role']);
        $invalid = $users->filter(fn ($u) => $u->role === 'admin')->pluck('id')->values()->all();

        if (!empty($invalid)) {
            return response()->json([
                'success' => false,
                'message' => 'Nije moguće dodati neke korisnike.',
                'errors' => (object)[
                    'users' => ['Administratori ne mogu biti članovi projekta.'],
                ],
            ], 422);
        }

        $ids = collect($validated['user_ids'])
            ->unique()
            ->reject(fn ($uid) => $uid === $managerId)
            ->values()
            ->all();

        $project->users()->syncWithoutDetaching($ids);
        $project->load('users');

        return response()->json([
            'success' => true,
            'message' => 'Članovi su uspešno dodati.',
            'data' => [
                'users' => UserResource::collection($project->users),
            ],
        ]);
    }

    // Uklanjanje člana sa projekta
    public function removeMember(Request $request, int $id, int $userId)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $project = $this->loadProjectForManagerOrFail($request, $id);
        if ($project instanceof \Illuminate\Http\JsonResponse) return $project;

        $managerId = $request->user()->id;

        // Menadžer ne može ukloniti sebe sa projekta
        if ($userId === $managerId) {
            return response()->json([
                'success' => false,
                'message' => 'Uklanjanje nije dozvoljeno.',
                'errors'  => (object)[
                    'user' => ['Ne možete ukloniti sebe sa projekta.'],
                ],
            ], 409);
        }

        // Provera da li je user uopšte član projekta
        $exists = $project->users()->where('users.id', $userId)->exists();
        if (!$exists) {
            return response()->json([
                'success' => false,
                'message' => 'Korisnik nije član projekta.',
                'errors'  => (object)[
                    'user' => ['Korisnik sa prosleđenim ID nije član projekta.'],
                ],
            ], 404);
        }

        // Uklanjanje iz pivot tabele (project_user)
        $project->users()->detach($userId);

        // Po želji: vrati osveženu listu članova
        $project->load('users');

        return response()->json([
            'success' => true,
            'message' => 'Član je uspešno uklonjen sa projekta.',
            'data' => [
                'users' => UserResource::collection($project->users),
            ],
        ]);
    }




    //kreiranje taska za clana na projektu
    public function createTask(Request $request, int $projectId)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $project = $this->loadProjectForManagerOrFail($request, $projectId);
        if ($project instanceof \Illuminate\Http\JsonResponse) return $project;

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'status' => ['required', 'in:todo,inprogress,review,done'],
            'due_date' => ['nullable', 'date'],
        ]);

        // proveri da je dodeljeni user član projekta
        $isMember = $project->users()->where('users.id', $validated['user_id'])->exists();
        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => 'Nije moguće dodeliti zadatak.',
                'errors' => (object)[
                    'user_id' => ['Korisnik mora biti član projekta.'],
                ],
            ], 422);
        }

        //dodela samo specijalistima
        $assignee = User::find($validated['user_id']);
        if ($assignee && $assignee->role !== 'specialist') {
            return response()->json([
                'success' => false,
                'message' => 'Nije moguće dodeliti zadatak.',
                'errors' => (object)[
                    'user_id' => ['Zadatak se može dodeliti samo specijalisti.'],
                ],
            ], 422);
        }

        $task = Task::create([
            'project_id' => $project->id,
            'user_id' => $validated['user_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        $task->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Zadatak je uspešno kreiran.',
            'data' => [
                'task' => new TaskResource($task),
            ],
        ], 201);
    }

    //azuriranje taska
    public function updateTask(Request $request, int $projectId, int $taskId)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $project = $this->loadProjectForManagerOrFail($request, $projectId);
        if ($project instanceof \Illuminate\Http\JsonResponse) return $project;

        $task = Task::where('project_id', $project->id)->where('id', $taskId)->first();
        if (!$task) {
            return response()->json([
                'success' => false,
                'message' => 'Zadatak nije pronađen.',
                'errors' => (object)[
                    'task' => ['Ne postoji zadatak ili nemate pristup.'],
                ],
            ], 404);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'status' => ['required', 'in:todo,inprogress,review,done'],
            'due_date' => ['nullable', 'date'],
        ]);

        $isMember = $project->users()->where('users.id', $validated['user_id'])->exists();
        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => 'Nije moguće ažurirati zadatak.',
                'errors' => (object)[
                    'user_id' => ['Korisnik mora biti član projekta.'],
                ],
            ], 422);
        }

        $assignee = User::find($validated['user_id']);
        if ($assignee && $assignee->role !== 'specialist') {
            return response()->json([
                'success' => false,
                'message' => 'Nije moguće dodeliti zadatak.',
                'errors' => (object)[
                    'user_id' => ['Zadatak se može dodeliti samo specijalisti.'],
                ],
            ], 422);
        }

        $task->update([
            'user_id' => $validated['user_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        $task->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Zadatak je uspešno ažuriran.',
            'data' => [
                'task' => new TaskResource($task),
            ],
        ]);
    }


    //metrike projekta
    public function projectMetrics(Request $request, int $id)
    {
        if ($resp = $this->managerCheck($request)) return $resp;

        $project = $this->loadProjectForManagerOrFail($request, $id);
        if ($project instanceof \Illuminate\Http\JsonResponse) return $project;

        $today = Carbon::today();

        $total = Task::where('project_id', $project->id)->count();

        $byStatus = Task::select('status', DB::raw('COUNT(*) as cnt'))
            ->where('project_id', $project->id)
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $byPriority = Task::select('priority', DB::raw('COUNT(*) as cnt'))
            ->where('project_id', $project->id)
            ->groupBy('priority')
            ->pluck('cnt', 'priority');

        $overdue = Task::where('project_id', $project->id)
            ->whereNotNull('due_date')
            ->where('due_date', '<', $today)
            ->where('status', '!=', 'done')
            ->count();

        $dueNext7 = Task::where('project_id', $project->id)
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$today, $today->copy()->addDays(7)])
            ->where('status', '!=', 'done')
            ->count();

        $done = (int)($byStatus['done'] ?? 0);
        $completionRate = $total > 0 ? round(($done / $total) * 100, 1) : 0.0;

        return response()->json([
            'success' => true,
            'message' => 'Metrike projekta su uspešno učitane.',
            'data' => [
                'metrics' => [
                    'total_tasks' => $total,
                    'completion_rate' => $completionRate,
                    'overdue_tasks' => $overdue,
                    'due_next_7_days' => $dueNext7,
                    'tasks_by_status' => [
                        'todo' => (int)($byStatus['todo'] ?? 0),
                        'inprogress' => (int)($byStatus['inprogress'] ?? 0),
                        'review' => (int)($byStatus['review'] ?? 0),
                        'done' => (int)($byStatus['done'] ?? 0),
                    ],
                    'tasks_by_priority' => [
                        'low' => (int)($byPriority['low'] ?? 0),
                        'medium' => (int)($byPriority['medium'] ?? 0),
                        'high' => (int)($byPriority['high'] ?? 0),
                        'urgent' => (int)($byPriority['urgent'] ?? 0),
                    ],
                ],
            ],
        ]);
    }
}
