<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    private function authCheck(Request $request)
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

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Nemate prava pristupa.',
                'errors'  => (object)[
                    'auth' => ['Samo administrator može izvršiti ovu akciju.'],
                ],
            ], 403);
        }

        return null;
    }

    // SK5: Pregled korisnika sistema
    public function index(Request $request)
    {
        if ($resp = $this->authCheck($request)) return $resp;

        $users = User::query()->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Lista korisnika je uspešno učitana.',
            'data' => [
                'users' => UserResource::collection($users),
            ],
        ]);
    }

    // SK6: Kreiranje novog korisnika i dodela uloge
    public function store(Request $request)
    {
        if ($resp = $this->authCheck($request)) return $resp;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:specialist,manager,admin'],
            'profile_photo' => ['nullable', 'string', 'url', 'max:2048'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'profile_photo' => $validated['profile_photo'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Korisnik je uspešno kreiran.',
            'data' => [
                'user' => new UserResource($user),
            ],
        ], 201);
    }

    // Ažuriranje podataka i uloge korisnika
    public function update(Request $request, $id)
    {
        if ($resp = $this->authCheck($request)) return $resp;

        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Korisnik nije pronađen.',
                'errors'  => (object)[
                    'user' => ['Ne postoji korisnik sa prosleđenim ID.'],
                ],
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role' => ['required', 'in:specialist,manager,admin'],
            // opciono resetovanje lozinke
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Korisnik je uspešno ažuriran.',
            'data' => [
                'user' => new UserResource($user),
            ],
        ]);
    }

    // Brisanje korisnika totalno
    public function destroy(Request $request, $id)
    {
        if ($resp = $this->authCheck($request)) return $resp;

        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Korisnik nije pronađen.',
                'errors'  => (object)[
                    'user' => ['Ne postoji korisnik sa prosleđenim ID.'],
                ],
            ], 404);
        }

        // preporuka: admin ne može obrisati sam sebe
        if ($request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Brisanje nije dozvoljeno.',
                'errors'  => (object)[
                    'user' => ['Ne možete obrisati sopstveni nalog.'],
                ],
            ], 409);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Korisnik je uspešno obrisan.',
            'data' => (object)[],
        ]);
    }
}
