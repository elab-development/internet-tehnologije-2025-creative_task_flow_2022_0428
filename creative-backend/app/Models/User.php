<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profile_photo'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

     // User ↔ Project (M:N) preko project_user.
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user')
            ->using(ProjectUser::class)
            ->withTimestamps();
    }

    // User → Task (1:N) kao izvršilac zadatka.
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    // User → Comment (1:N) kao autor komentara.
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // User → Attachment (1:N) kao uploader fajla.
    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }
}
