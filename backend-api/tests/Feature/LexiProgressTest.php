<?php

namespace Tests\Feature;

use App\Models\Reader;
use App\Models\ReadingGoal;
use App\Models\ReadingSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LexiProgressTest extends TestCase
{
    use RefreshDatabase;

    private Reader $readerA;

    private Reader $readerB;

    private string $tokenA;

    private string $tokenB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->readerA = Reader::create([
            'name' => 'Siswa A',
            'username' => 'siswa_a',
            'password' => 'secret123',
            'reading_level' => Reader::LEVEL_MENGEJA,
        ]);
        $this->tokenA = $this->readerA->createToken('test')->plainTextToken;

        $this->readerB = Reader::create([
            'name' => 'Siswa B',
            'username' => 'siswa_b',
            'password' => 'secret123',
            'reading_level' => Reader::LEVEL_LANCAR,
        ]);
        $this->tokenB = $this->readerB->createToken('test')->plainTextToken;
    }

    public function test_it_requires_authentication_for_lexiprogress_routes(): void
    {
        $this->getJson('/api/lexiprogress/overview')->assertStatus(401);
        $this->getJson('/api/lexiprogress/sessions')->assertStatus(401);
        $this->postJson('/api/lexiprogress/sessions', [])->assertStatus(401);
    }

    /**
     * Klien tanpa header Accept (mis. curl polos) tetap harus menerima 401,
     * bukan 500 "Route [login] not defined". Tanpa ini, middleware mengira
     * ini permintaan browser dan mencoba mengalihkannya ke halaman login.
     */
    public function test_it_returns_401_not_500_when_the_accept_header_is_missing(): void
    {
        $this->get('/api/lexiprogress/overview', ['Accept' => 'text/html'])
            ->assertStatus(401);
    }

    public function test_it_stores_a_reading_document_snapshot_with_content_hash(): void
    {
        $text = 'Matahari bersinar sangat terang di pagi hari.';
        $response = $this->withToken($this->tokenA)->postJson('/api/lexiprogress/documents', [
            'title' => 'Teks Pagi',
            'text_snapshot' => $text,
            'source_type' => 'sample',
        ])->assertCreated();

        $this->assertSame('Teks Pagi', $response->json('document.title'));
        $this->assertSame(hash('sha256', $text), $response->json('document.content_hash'));
        $this->assertSame(7, $response->json('document.word_count'));
        $this->assertDatabaseHas('reading_documents', [
            'reader_id' => $this->readerA->id,
            'title' => 'Teks Pagi',
        ]);
    }

    public function test_it_creates_and_completes_a_reading_session(): void
    {
        $doc = $this->readerA->readingDocuments()->create([
            'title' => 'Cerita 1',
            'text_snapshot' => 'Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh',
            'source_type' => 'text',
        ]);

        $groupId = (string) Str::uuid();

        // 1. Buat sesi baseline
        $created = $this->withToken($this->tokenA)->postJson('/api/lexiprogress/sessions', [
            'document_id' => $doc->id,
            'condition' => ReadingSession::BASELINE,
            'session_group_id' => $groupId,
            'order_index' => 1,
            'features' => [],
        ])->assertCreated();

        $sessionId = $created->json('session.id');

        // 2. Selesaikan sesi dengan data mentah
        $completed = $this->withToken($this->tokenA)->postJson("/api/lexiprogress/sessions/{$sessionId}/complete", [
            'duration_seconds' => 60,
            'words_total' => 10,
            'words_correct' => 8,
            'comprehension_correct' => 3,
            'comprehension_total' => 4,
            'difficulty_rating' => 3.5,
            'assessment_method' => 'quiz',
            'notes' => 'Cukup lancar',
        ])->assertOk();

        // WPM: 10 kata dalam 60 detik (1 menit) = 10.0
        $this->assertEquals(10.0, $completed->json('session.wpm'));
        // CWPM: 8 kata dalam 60 detik = 8.0
        $this->assertEquals(8.0, $completed->json('session.cwpm'));
        // Akurasi: 8 / 10 = 80.0%
        $this->assertEquals(80.0, $completed->json('session.accuracy_percent'));
        // Pemahaman: 3 / 4 = 75.0%
        $this->assertEquals(75.0, $completed->json('session.comprehension_percent'));
    }

    /**
     * Skor pemahaman yang dikirim lewat kuis harus DIHITUNG dari soal, bukan
     * dipercaya dari angka yang dikirim aplikasi. Pemetaan ini yang membuat
     * persentase tidak bisa dikarang dan tiap soal tetap bisa ditinjau.
     */
    public function test_it_scores_comprehension_from_the_quiz_not_the_client(): void
    {
        $doc = $this->readerA->readingDocuments()->create([
            'title' => 'Teks Kuis',
            'text_snapshot' => 'Satu dua tiga empat lima enam tujuh delapan',
            'source_type' => 'text',
        ]);

        $session = $this->readerA->readingSessions()->create([
            'reading_document_id' => $doc->id,
            'condition' => ReadingSession::BASELINE,
            'session_group_id' => (string) Str::uuid(),
            'started_at' => now(),
        ]);

        $res = $this->withToken($this->tokenA)
            ->postJson("/api/lexiprogress/sessions/{$session->id}/complete", [
                'duration_seconds' => 90,
                // Sengaja mengirim skor palsu; server harus mengabaikannya.
                'comprehension_correct' => 3,
                'comprehension_total' => 3,
                'quiz' => [
                    [
                        'question' => 'Berapa jumlah angka pada teks?',
                        'options' => ['6', '7', '8'],
                        'correct_option' => 2,
                        'chosen_option' => 2, // benar
                    ],
                    [
                        'question' => 'Apa angka pertama?',
                        'options' => ['Satu', 'Dua'],
                        'correct_option' => 0,
                        'chosen_option' => 1, // salah
                    ],
                    [
                        'question' => 'Apa angka terakhir?',
                        'options' => ['Delapan', 'Tujuh'],
                        'correct_option' => 0,
                        'chosen_option' => null, // dilewati
                    ],
                ],
            ])
            ->assertOk();

        // 1 benar dari 3 soal yang diajukan = 33.33%
        $this->assertEquals(1, $res->json('session.comprehension_correct'));
        $this->assertEquals(3, $res->json('session.comprehension_total'));
        $this->assertEquals(33.33, $res->json('session.comprehension_percent'));
        $this->assertSame('quiz', $res->json('session.assessment_method'));
        $this->assertCount(3, $res->json('session.quiz_items'));
        $this->assertTrue($res->json('session.quiz_items.0.is_correct'));
        $this->assertFalse($res->json('session.quiz_items.1.is_correct'));
        $this->assertNull($res->json('session.quiz_items.2.is_correct'));
    }

    /**
     * Kuis boleh dilewati. Saat itu, skor pemahaman tidak boleh diam-diam
     * dianggap 0 — harus tetap null supaya terbaca "Belum diukur".
     */
    public function test_it_leaves_comprehension_unmeasured_when_the_quiz_is_skipped(): void
    {
        $doc = $this->readerA->readingDocuments()->create([
            'title' => 'Tanpa Kuis',
            'text_snapshot' => 'Sepuluh kata yang cukup untuk sebuah sesi baca singkat',
            'source_type' => 'text',
        ]);

        $session = $this->readerA->readingSessions()->create([
            'reading_document_id' => $doc->id,
            'condition' => ReadingSession::ASSISTED,
            'session_group_id' => (string) Str::uuid(),
            'started_at' => now(),
        ]);

        $res = $this->withToken($this->tokenA)
            ->postJson("/api/lexiprogress/sessions/{$session->id}/complete", [
                'duration_seconds' => 45,
                'assessment_method' => 'self_report',
            ])
            ->assertOk();

        $this->assertNull($res->json('session.comprehension_correct'));
        $this->assertNull($res->json('session.comprehension_total'));
        $this->assertNull($res->json('session.comprehension_percent'));
        $this->assertSame('self_report', $res->json('session.assessment_method'));
    }

    public function test_it_handles_division_by_zero_and_missing_metrics_safely(): void
    {
        $doc = $this->readerA->readingDocuments()->create([
            'title' => 'Teks Singkat',
            'text_snapshot' => 'Halo dunia',
            'source_type' => 'text',
        ]);

        $session = $this->readerA->readingSessions()->create([
            'reading_document_id' => $doc->id,
            'condition' => ReadingSession::BASELINE,
            'duration_seconds' => 0, // durasi 0 tidak boleh crash division by zero
            'words_total' => null,
            'words_correct' => null,
            'comprehension_correct' => null,
            'comprehension_total' => null,
        ]);

        $this->assertNull($session->wpm);
        $this->assertNull($session->cwpm);
        $this->assertNull($session->accuracy_percent);
        $this->assertNull($session->comprehension_percent);
    }

    public function test_it_compares_baseline_and_assisted_sessions_correctly(): void
    {
        $doc = $this->readerA->readingDocuments()->create([
            'title' => 'Cerita Komparasi',
            'text_snapshot' => 'Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh',
            'source_type' => 'text',
        ]);

        $groupId = (string) Str::uuid();

        // Baseline: akurasi 60%, pemahaman 60%, durasi 120s
        $this->readerA->readingSessions()->create([
            'reading_document_id' => $doc->id,
            'condition' => ReadingSession::BASELINE,
            'session_group_id' => $groupId,
            'duration_seconds' => 120,
            'words_total' => 10,
            'words_correct' => 6,
            'comprehension_correct' => 3,
            'comprehension_total' => 5,
            'completed_at' => now()->subMinute(),
        ]);

        // Assisted: akurasi 80%, pemahaman 80%, durasi 60s
        $this->readerA->readingSessions()->create([
            'reading_document_id' => $doc->id,
            'condition' => ReadingSession::ASSISTED,
            'session_group_id' => $groupId,
            'duration_seconds' => 60,
            'words_total' => 10,
            'words_correct' => 8,
            'comprehension_correct' => 4,
            'comprehension_total' => 5,
            'completed_at' => now(),
        ]);

        $res = $this->withToken($this->tokenA)
            ->getJson("/api/lexiprogress/comparisons/{$groupId}")
            ->assertOk();

        // Pemahaman: baseline 60% ke 80%
        // percentage points = +20.0
        // relative percent = (80 - 60) / 60 * 100 = +33.33%
        $this->assertEquals(20.0, $res->json('changes.comprehension_percent.percentage_points'));
        $this->assertEquals(33.33, $res->json('changes.comprehension_percent.relative_percent'));

        // Durasi: baseline 120 ke 60
        // relative percent = (60 - 120) / 120 * 100 = -50.0%
        $this->assertEquals(-50.0, $res->json('changes.duration_seconds.relative_percent'));
    }

    public function test_it_enforces_user_isolation_strictly(): void
    {
        $docB = $this->readerB->readingDocuments()->create([
            'title' => 'Teks B',
            'text_snapshot' => 'Rahasia Siswa B',
            'source_type' => 'text',
        ]);

        $sessionB = $this->readerB->readingSessions()->create([
            'reading_document_id' => $docB->id,
            'condition' => ReadingSession::BASELINE,
            'session_group_id' => (string) Str::uuid(),
            'started_at' => now(),
        ]);

        $goalB = $this->readerB->readingGoals()->create([
            'title' => 'Target Siswa B',
            'metric_key' => ReadingGoal::METRIC_SESSION_COUNT,
            'baseline_value' => 0,
            'target_value' => 5,
            'unit' => 'sesi',
            'starts_at' => now(),
            'status' => ReadingGoal::STATUS_ACTIVE,
        ]);

        // Siswa A tidak boleh melihat atau memodifikasi sesi Siswa B
        $this->withToken($this->tokenA)->getJson("/api/lexiprogress/sessions/{$sessionB->id}")->assertStatus(404);
        $this->withToken($this->tokenA)->postJson("/api/lexiprogress/sessions/{$sessionB->id}/complete", [
            'duration_seconds' => 50,
        ])->assertStatus(404);

        // Siswa A tidak boleh mengubah atau menghapus goal Siswa B
        $this->withToken($this->tokenA)->patchJson("/api/lexiprogress/goals/{$goalB->id}", [
            'title' => 'Hack title',
        ])->assertStatus(404);
        $this->withToken($this->tokenA)->deleteJson("/api/lexiprogress/goals/{$goalB->id}")->assertStatus(404);

        // Siswa A tidak boleh memakai dokumen milik Siswa B untuk membuat sesi
        $this->withToken($this->tokenA)->postJson('/api/lexiprogress/sessions', [
            'document_id' => $docB->id,
            'condition' => ReadingSession::BASELINE,
        ])->assertStatus(404);
    }

    public function test_it_calculates_goals_progress_according_to_metric_direction(): void
    {
        // 1. Goal jumlah sesi (makin tinggi makin baik)
        $goalSessions = $this->readerA->readingGoals()->create([
            'title' => 'Selesaikan 4 sesi',
            'metric_key' => ReadingGoal::METRIC_SESSION_COUNT,
            'baseline_value' => 0,
            'target_value' => 4,
            'unit' => 'sesi',
            'starts_at' => now(),
            'status' => ReadingGoal::STATUS_ACTIVE,
        ]);

        // 2. Goal kesulitan subjektif (makin rendah makin baik: dari 4.0 ke target 2.0)
        $goalDifficulty = $this->readerA->readingGoals()->create([
            'title' => 'Turunkan kesulitan',
            'metric_key' => ReadingGoal::METRIC_DIFFICULTY,
            'baseline_value' => 4.0,
            'target_value' => 2.0,
            'unit' => 'skala 1-5',
            'starts_at' => now(),
            'status' => ReadingGoal::STATUS_ACTIVE,
        ]);

        $doc = $this->readerA->readingDocuments()->create([
            'title' => 'Dokumen 1',
            'text_snapshot' => 'Teks pengujian goal',
            'source_type' => 'text',
        ]);

        // 2 sesi selesai; yang terakhir (paling baru) untuk menentukan nilai mentah goal.
        // Rating kesulitan dibuat menurun agar urutan waktu terlihat: 3.5 lebih dulu,
        // 2.5 belakangan. Nilai mentah diambil dari sesi terbaru secara waktu.
        $this->readerA->readingSessions()->create([
            'reading_document_id' => $doc->id,
            'condition' => ReadingSession::BASELINE,
            'completed_at' => now()->subDay(),
            'difficulty_rating' => 2.5,
        ]);
        $this->readerA->readingSessions()->create([
            'reading_document_id' => $doc->id,
            'condition' => ReadingSession::ASSISTED,
            'completed_at' => now(),
            'difficulty_rating' => 3.5,
        ]);

        $res = $this->withToken($this->tokenA)->getJson('/api/lexiprogress/overview')->assertOk();

        $goals = collect($res->json('goals'));
        $sessionGoalRes = $goals->firstWhere('id', $goalSessions->id);
        $diffGoalRes = $goals->firstWhere('id', $goalDifficulty->id);

        // 2 sesi dari target 4 = 50%
        $this->assertEquals(2.0, $sessionGoalRes['actual']);
        $this->assertEquals(50.0, $sessionGoalRes['percent']);
        $this->assertFalse($sessionGoalRes['achieved']);

        // Kesulitan dari 4.0 ke 3.5 menuju target 2.0 = (3.5 - 4.0)/(2.0 - 4.0) = -0.5 / -2.0 = 25%
        $this->assertEquals(3.5, $diffGoalRes['actual']);
        $this->assertEquals(25.0, $diffGoalRes['percent']);
        $this->assertFalse($diffGoalRes['achieved']);
    }
}
