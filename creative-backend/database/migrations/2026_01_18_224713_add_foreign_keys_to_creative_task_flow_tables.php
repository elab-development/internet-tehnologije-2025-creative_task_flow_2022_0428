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
        // tasks
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreign('project_id')
                ->references('id')->on('projects')
                ->cascadeOnDelete(); //ako obrišemo parent zapis, brišu se i child zapisi automatski

            $table->foreign('user_id')
                ->references('id')->on('users')
                ->restrictOnDelete(); //zabranjuje brisanje parent zapisa ako postoje child zapisi
        });

        // comments
        Schema::table('comments', function (Blueprint $table) {
            $table->foreign('task_id')
                ->references('id')->on('tasks')
                ->cascadeOnDelete();

            $table->foreign('user_id')
                ->references('id')->on('users')
                ->restrictOnDelete();
        });

        // attachments
        Schema::table('attachments', function (Blueprint $table) {
            $table->foreign('task_id')
                ->references('id')->on('tasks')
                ->cascadeOnDelete(); //ako obrišemo parent zapis, brišu se i child zapisi automatski

            $table->foreign('user_id')
                ->references('id')->on('users')
                ->restrictOnDelete(); //zabranjuje brisanje parent zapisa ako postoje child zapisi
        });

        // project_user (pivot)
        Schema::table('project_user', function (Blueprint $table) {
            $table->foreign('project_id')
                ->references('id')->on('projects')
                ->cascadeOnDelete(); //ako obrišemo parent zapis, brišu se i child zapisi automatski

            $table->foreign('user_id')
                ->references('id')->on('users')
                ->cascadeOnDelete();  //ako obrišemo parent zapis, brišu se i child zapisi automatski
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //u obrnutom smeru radimo
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['user_id']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['task_id']);
            $table->dropForeign(['user_id']);
        });

        Schema::table('attachments', function (Blueprint $table) {
            $table->dropForeign(['task_id']);
            $table->dropForeign(['user_id']);
        });

        Schema::table('project_user', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['user_id']);
        });
    }
};
