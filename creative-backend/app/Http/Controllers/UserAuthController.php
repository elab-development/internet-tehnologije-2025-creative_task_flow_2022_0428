<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserAuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'profile_photo' => ['nullable', 'string', 'url', 'max:2048'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => 'specialist',
            'profile_photo' => $validated['profile_photo'],
            'password' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registracija uspešna.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Neuspešna prijava.',
                'errors' => (object)[
                    'auth' => ['Pogrešan email ili lozinka.'],
                ],
            ], 401);
        }

        // opciono: obriši stare tokene da bude “jedna sesija”.
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Prijava uspešna.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Uspešno ste se odjavili.',
            'data' => (object)[],
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'profile_photo' => ['nullable', 'string', 'url', 'max:2048'],
        ]);

        $user = $request->user();
        $user->name = $validated['name'];

        // slika je opciona: menja se samo ako je poslata u request-u
        if (array_key_exists('profile_photo', $validated)) {
            $user->profile_photo = $validated['profile_photo'];
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil je uspešno ažuriran.',
            'data' => [
                'user' => new UserResource($user),
            ],
        ]);
    }
}
