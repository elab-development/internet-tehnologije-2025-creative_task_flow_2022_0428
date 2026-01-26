<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'user_id' => $this->user_id,

            'file_name' => $this->file_name,
            'file_path' => $this->file_path, // ovde je URL (file.io link)
            'file_size' => (int) $this->file_size,
            'mime_type' => $this->mime_type,

            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
        ];
    }
}
