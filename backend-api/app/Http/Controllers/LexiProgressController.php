<?php

namespace App\Http\Controllers;

use App\Models\ReadingDocument;
use App\Models\ReadingGoal;
use App\Models\ReadingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class LexiProgressController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $reader = $request->user();
        $sessions = ReadingSession::where('reader_id', $reader->id)
            ->whereNotNull('completed_at')->latest('completed_at')->with(['document', 'features', 'quizItems'])->get();
        $goals = ReadingGoal::where('reader_id', $reader->id)->latest()->get();

        return response()->json([
            'sessions_completed' => $sessions->count(),
            'latest_session' => $sessions->first()?->toSummary(),
            'goals' => $goals->map(fn (ReadingGoal $goal) => $goal->toSummary($this->goalActual($goal, $sessions)))->values(),
            'sessions' => $sessions->take(10)->map->toSummary()->values(),
        ]);
    }

    public function documents(Request $request): JsonResponse
    {
        $documents = ReadingDocument::where('reader_id', $request->user()->id)->latest()->paginate(20);
        $documents->getCollection()->transform(fn (ReadingDocument $document) => $document->toSummary());

        return response()->json($documents);
    }

    public function storeDocument(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:1', 'max:200'],
            'text_snapshot' => ['required', 'string', 'min:1', 'max:100000'],
            'source_type' => ['nullable', Rule::in(['text', 'scan', 'sample'])],
        ]);
        $document = $request->user()->readingDocuments()->create($data + ['source_type' => $data['source_type'] ?? 'text']);

        return response()->json(['document' => $document->toSummary()], 201);
    }

    public function storeSession(Request $request): JsonResponse
    {
        $data = $request->validate([
            'document_id' => ['required', 'integer', 'exists:reading_documents,id'],
            'condition' => ['required', Rule::in([ReadingSession::BASELINE, ReadingSession::ASSISTED])],
            'session_group_id' => ['nullable', 'uuid'],
            'order_index' => ['nullable', 'integer', 'min:1'],
            'started_at' => ['nullable', 'date'],
            'features' => ['nullable', 'array', 'max:20'],
            'features.*' => ['string', 'max:60'],
        ]);
        $document = ReadingDocument::where('reader_id', $request->user()->id)->findOrFail($data['document_id']);
        $session = DB::transaction(function () use ($request, $data, $document) {
            $session = $request->user()->readingSessions()->create([
                'reading_document_id' => $document->id,
                'condition' => $data['condition'],
                'session_group_id' => $data['session_group_id'] ?? (string) Str::uuid(),
                'order_index' => $data['order_index'] ?? null,
                'started_at' => $data['started_at'] ?? now(),
            ]);
            foreach ($data['features'] ?? [] as $feature) {
                $session->features()->create(['feature_key' => $feature]);
            }

            return $session->load(['document', 'features']);
        });

        return response()->json(['session' => $session->toSummary()], 201);
    }

    public function sessions(Request $request): JsonResponse
    {
        $sessions = ReadingSession::where('reader_id', $request->user()->id)->with(['document', 'features', 'quizItems'])->latest()->paginate(20);
        $sessions->getCollection()->transform(fn (ReadingSession $session) => $session->toSummary());

        return response()->json($sessions);
    }

    public function showSession(Request $request, ReadingSession $session): JsonResponse
    {
        abort_unless($session->reader_id === $request->user()->id, 404);

        return response()->json(['session' => $session->load(['document', 'features', 'quizItems'])->toSummary()]);
    }

    public function completeSession(Request $request, ReadingSession $session): JsonResponse
    {
        abort_unless($session->reader_id === $request->user()->id, 404);
        $data = $request->validate([
            'duration_seconds' => ['required', 'integer', 'min:1', 'max:86400'],
            'words_total' => ['nullable', 'integer', 'min:0'],
            'words_correct' => ['nullable', 'integer', 'min:0', 'lte:words_total'],
            /*
             * Skor pemahaman manual dikirim hanya kalau TIDAK ada blok `quiz`.
             * Kalau kuis dikirim, kedua kolom ini diabaikan dan dihitung dari
             * soal — jadi angka yang ditolak validasinya di sini pun tidak
             * akan berpengaruh, dan mengabaikannya lebih ramah daripada gagal.
             */
            'comprehension_correct' => ['nullable', 'integer', 'min:0', 'lte:comprehension_total'],
            'comprehension_total' => ['nullable', 'integer', 'min:1', 'max:100'],
            'difficulty_rating' => ['nullable', 'numeric', 'min:1', 'max:5'],
            'assessment_method' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:2000'],
            /*
             * Kuis pemahaman, opsional. Kalau dikirim, skornya DIHITUNG dari
             * soal-soal ini — bukan dari angka yang dikirim aplikasi — supaya
             * persentase tidak bisa dikarang dan selalu bisa ditelusuri.
             */
            'quiz' => ['nullable', 'array', 'max:20'],
            'quiz.*.question' => ['required', 'string', 'min:3', 'max:500'],
            'quiz.*.options' => ['required', 'array', 'min:2', 'max:6'],
            'quiz.*.options.*' => ['required', 'string', 'max:300'],
            'quiz.*.correct_option' => ['required', 'integer', 'min:0'],
            'quiz.*.chosen_option' => ['nullable', 'integer', 'min:0'],
        ]);
        if (isset($data['words_total']) && $data['words_correct'] !== null && $data['words_correct'] > $data['words_total']) {
            abort(422, 'Jumlah kata benar tidak boleh melebihi total kata.');
        }

        $quiz = $data['quiz'] ?? null;
        unset($data['quiz']);

        DB::transaction(function () use ($session, $data, $quiz): void {
            if ($quiz !== null) {
                $session->quizItems()->delete();

                $correctCount = 0;

                foreach (array_values($quiz) as $index => $item) {
                    $chosen = $item['chosen_option'] ?? null;
                    // Belum dijawab (null) berbeda dari dijawab salah: yang
                    // pertama tidak punya penilaian sama sekali.
                    $isCorrect = $chosen === null ? null : (int) $chosen === (int) $item['correct_option'];
                    if ($isCorrect === true) {
                        $correctCount += 1;
                    }

                    $session->quizItems()->create([
                        'order_index' => $index + 1,
                        'question' => $item['question'],
                        'options' => $item['options'],
                        'correct_option' => (int) $item['correct_option'],
                        'chosen_option' => $chosen,
                        'is_correct' => $isCorrect,
                    ]);
                }

                /*
                 * Skor = jawaban benar / jumlah soal yang benar-benar dinilai.
                 * Soal yang dilewati (chosen_option null) tetap dihitung sebagai
                 * bagian dari total pertanyaan yang DIAJUKAN, karena ditampilkan
                 * ke pembaca sebagai bagian kuis ini.
                 */
                $data['comprehension_correct'] = $correctCount;
                $data['comprehension_total'] = count($quiz);
                $data['assessment_method'] = $data['assessment_method'] ?? 'quiz';
            }

            $session->fill($data + ['completed_at' => now()])->save();
        });

        return response()->json(['session' => $session->load(['document', 'features', 'quizItems'])->toSummary()]);
    }

    public function goals(Request $request): JsonResponse
    {
        $sessions = ReadingSession::where('reader_id', $request->user()->id)->whereNotNull('completed_at')->get();
        $goals = ReadingGoal::where('reader_id', $request->user()->id)->latest()->get();

        return response()->json(['goals' => $goals->map(fn (ReadingGoal $goal) => $goal->toSummary($this->goalActual($goal, $sessions)))->values()]);
    }

    public function storeGoal(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:1', 'max:160'], 'description' => ['nullable', 'string', 'max:2000'],
            'metric_key' => ['required', Rule::in(['session_count', 'comprehension_percent', 'difficulty_rating', 'wpm', 'cwpm', 'duration_seconds', 'accuracy_percent'])],
            'baseline_value' => ['nullable', 'numeric', 'min:0'], 'target_value' => ['required', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:30'], 'starts_at' => ['required', 'date'], 'target_date' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'status' => ['nullable', Rule::in(['not_started', 'active', 'achieved', 'stopped'])], 'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $goal = $request->user()->readingGoals()->create($data + ['status' => $data['status'] ?? ReadingGoal::STATUS_NOT_STARTED]);

        return response()->json(['goal' => $goal->toSummary()], 201);
    }

    public function updateGoal(Request $request, ReadingGoal $goal): JsonResponse
    {
        abort_unless($goal->reader_id === $request->user()->id, 404);
        $data = $request->validate(['title' => ['sometimes', 'string', 'min:1', 'max:160'], 'status' => [Rule::in(['not_started', 'active', 'achieved', 'stopped'])], 'notes' => ['nullable', 'string', 'max:2000']]);
        $goal->update($data);

        return response()->json(['goal' => $goal->toSummary()]);
    }

    public function deleteGoal(Request $request, ReadingGoal $goal): JsonResponse
    {
        abort_unless($goal->reader_id === $request->user()->id, 404);
        $goal->delete();

        return response()->json(['message' => 'Goal dihapus.']);
    }

    public function comparison(Request $request, string $sessionGroupId): JsonResponse
    {
        $sessions = ReadingSession::where('reader_id', $request->user()->id)->where('session_group_id', $sessionGroupId)->with(['document', 'features', 'quizItems'])->get();
        abort_if($sessions->isEmpty(), 404);
        $baseline = $sessions->firstWhere('condition', ReadingSession::BASELINE);
        $assisted = $sessions->firstWhere('condition', ReadingSession::ASSISTED);

        return response()->json(['baseline' => $baseline?->toSummary(), 'assisted' => $assisted?->toSummary(), 'changes' => $this->changes($baseline, $assisted)]);
    }

    private function goalActual(ReadingGoal $goal, $sessions): ?float
    {
        if ($goal->metric_key === ReadingGoal::METRIC_SESSION_COUNT) {
            return (float) $sessions->count();
        }
        // $sessions diurutkan latest('completed_at'), jadi sesi paling baru ada di elemen pertama (first)
        $values = $sessions->map(fn (ReadingSession $session) => $session->{$goal->metric_key})->filter(fn ($value) => $value !== null);

        return $values->isEmpty() ? null : (float) $values->first();
    }

    private function changes(?ReadingSession $baseline, ?ReadingSession $assisted): array
    {
        if (! $baseline || ! $assisted) {
            return [];
        }
        $result = [];
        foreach (['duration_seconds', 'wpm', 'cwpm', 'accuracy_percent', 'comprehension_percent', 'difficulty_rating'] as $metric) {
            $from = $baseline->{$metric};
            $to = $assisted->{$metric};
            $result[$metric] = ['baseline' => $from, 'assisted' => $to, 'percentage_points' => $metric === 'accuracy_percent' || $metric === 'comprehension_percent' ? ($from !== null && $to !== null ? round($to - $from, 2) : null) : null, 'relative_percent' => $from !== null && $to !== null && $from != 0 ? round(($to - $from) / abs($from) * 100, 2) : null];
        }

        return $result;
    }
}
