<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),

            'users' => $this->whenLoaded('users', fn () => UserResource::collection($this->users)),
            'tasks' => $this->whenLoaded('tasks', fn () => TaskResource::collection($this->tasks)),

            // korisno za kartice na homepage-u menadžera
            'tasks_count' => $this->when(isset($this->tasks_count), $this->tasks_count),
        ];
    }
}
