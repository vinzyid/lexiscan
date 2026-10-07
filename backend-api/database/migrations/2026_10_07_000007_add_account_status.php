<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['users', 'readers'] as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->boolean('is_active')->default(true)->index();
            });
        }
    }

    public function down(): void
    {
        foreach (['users', 'readers'] as $table) {
            Schema::table($table, fn (Blueprint $table) => $table->dropColumn('is_active'));
        }
    }
};
