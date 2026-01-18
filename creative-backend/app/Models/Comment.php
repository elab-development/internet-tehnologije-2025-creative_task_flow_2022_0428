<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    protected $fillable = [
        'task_id',
        'user_id',
        'content',
    ];

    // Comment i Task (N:1).
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    // Comment i User (N:1) autor.
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
