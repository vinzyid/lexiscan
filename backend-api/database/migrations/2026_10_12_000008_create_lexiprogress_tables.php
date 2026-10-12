<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reading_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reader_id')->constrained('readers')->cascadeOnDelete();
            $table->string('title', 200);
            $table->string('source_type', 30)->default('text');
            $table->longText('text_snapshot');
            $table->string('content_hash', 64)->index();
            $table->timestamps();
        });

        Schema::create('reading_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reader_id')->constrained('readers')->cascadeOnDelete();
            $table->foreignId('reading_document_id')->constrained()->cascadeOnDelete();
            $table->string('condition', 20);
            $table->uuid('session_group_id')->nullable()->index();
            $table->unsignedInteger('order_index')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('words_total')->nullable();
            $table->unsignedInteger('words_correct')->nullable();
            $table->unsignedInteger('comprehension_correct')->nullable();
            $table->unsignedInteger('comprehension_total')->nullable();
            $table->decimal('difficulty_rating', 3, 1)->nullable();
            $table->string('assessment_method', 40)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['reader_id', 'completed_at']);
        });

        Schema::create('session_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reading_session_id')->constrained()->cascadeOnDelete();
            $table->string('feature_key', 60);
            $table->json('settings_snapshot')->nullable();
        });

        Schema::create('reading_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reader_id')->constrained()->cascadeOnDelete();
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->string('metric_key', 50);
            $table->decimal('baseline_value', 10, 2)->nullable();
            $table->decimal('target_value', 10, 2);
            $table->string('unit', 30);
            $table->date('starts_at');
            $table->date('target_date')->nullable();
            $table->string('status', 20)->default('not_started');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_goals');
        Schema::dropIfExists('session_features');
        Schema::dropIfExists('reading_sessions');
        Schema::dropIfExists('reading_documents');
    }
};
