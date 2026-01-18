<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = [
        'project_id',
        'user_id',      // izvršilac
        'title',
        'description',
        'priority',
        'status',
        'due_date',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    // Task  Project (N:1).
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    // Task User (N:1) izvršilac.
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Task  Comment (1:N).
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // Task  Attachment (1:N).
    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }
}
