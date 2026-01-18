<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->enum('status', ['planned', 'active', 'completed', 'archived'])
                ->default('active')
                ->change();
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', ['todo', 'inprogress', 'review', 'done'])
                ->default('todo')
                ->change();

            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])
                ->default('medium')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('status')->default('active')->change();
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->string('status')->default('todo')->change();
            $table->string('priority')->default('medium')->change();
        });
    }
};
