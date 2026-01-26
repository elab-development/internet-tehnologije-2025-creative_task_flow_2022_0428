<?php

use App\Http\Controllers\UserAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [UserAuthController::class, 'register']);
Route::post('/login', [UserAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [UserAuthController::class, 'logout']);
    Route::put('/profile', [UserAuthController::class, 'updateProfile']);
});
