<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserAuthController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ManagerController;

Route::post('/register', [UserAuthController::class, 'register']);
Route::post('/login', [UserAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Auth (logged-in user)
    Route::post('/logout', [UserAuthController::class, 'logout']);
    Route::put('/profile', [UserAuthController::class, 'updateProfile']);

    // Admin
    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::put('/users/{id}', [AdminUserController::class, 'update']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    });

    // Manager
    Route::prefix('manager')->group(function () {
        // Projects
        Route::get('/projects', [ManagerController::class, 'projects']);
        Route::post('/projects', [ManagerController::class, 'createProject']);
        Route::put('/projects/{id}', [ManagerController::class, 'updateProject']);
        Route::get('/projects/{id}', [ManagerController::class, 'projectDetails']);

        // Members
        Route::get('/projects/{id}/members', [ManagerController::class, 'projectMembers']);
        Route::post('/projects/{id}/members', [ManagerController::class, 'addMembers']);
        Route::delete('/projects/{id}/members/{userId}', [ManagerController::class, 'removeMember']);

        // Tasks
        Route::post('/projects/{projectId}/tasks', [ManagerController::class, 'createTask']);
        Route::put('/projects/{projectId}/tasks/{taskId}', [ManagerController::class, 'updateTask']);

        // Metrics
        Route::get('/projects/{id}/metrics', [ManagerController::class, 'projectMetrics']);
    });
});
