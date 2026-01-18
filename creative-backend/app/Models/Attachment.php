<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    protected $fillable = [
        'task_id',
        'user_id',     // uploader
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
    ];

    // Attachment  Task (N:1).
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    // Attachment  User (N:1) uploader.
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
