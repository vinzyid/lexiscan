<?php

namespace Tests\Feature;

use App\Http\Middleware\IdentifyDevice;
use App\Models\AiUsageLog;
use App\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\FakesGemini;
use Tests\TestCase;

/**
 * Identitas perangkat anonim dan pencatatan pemakaian AI.
 *
 * Keduanya diuji bersama karena memang satu alur: perangkat dikenali di
 * middleware, lalu dipakai controller saat menulis riwayat pemakaian.
 */
class DeviceTrackingTest extends TestCase
{
    use FakesGemini;
    use RefreshDatabase;

    private const TEXT = 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau yang memerlukan cahaya matahari.';

    public function test_an_unknown_device_is_registered_on_its_first_request(): void
    {
        $this->fakeGeminiParagraphs(['Hasil.']);
        $id = (string) Str::uuid();

        $this->simplify($id)->assertOk();

        $device = Device::find($id);

        $this->assertNotNull($device);
        $this->assertNull($device->blocked_at);
        $this->assertNotNull($device->first_seen_at);
    }

    public function test_a_returning_device_is_not_duplicated_and_its_last_seen_moves(): void
    {
        $this->fakeGeminiParagraphs(['Hasil.']);
        $id = (string) Str::uuid();

        Carbon::setTestNow('2026-08-07 10:00:00');
        $this->simplify($id)->assertOk();

        Carbon::setTestNow('2026-08-07 15:30:00');
        $this->simplify($id, 'L4')->assertOk();

        Carbon::setTestNow();

        $this->assertSame(1, Device::count());
        $this->assertSame(
            '2026-08-07 10:00:00',
            Device::find($id)->first_seen_at->format('Y-m-d H:i:s'),
        );
        $this->assertSame(
            '2026-08-07 15:30:00',
            Device::find($id)->last_seen_at->format('Y-m-d H:i:s'),
        );
    }

    public function test_a_blocked_device_is_refused_before_any_quota_is_spent(): void
    {
        // Inti poin (a) kebutuhan admin: pemblokiran harus menghentikan
        // permintaan SEBELUM penyedia dipanggil, kalau tidak kuotanya tetap
        // terbakar oleh perangkat yang justru sedang ditindak.
        $id = (string) Str::uuid();

        Device::create([
            'id' => $id,
            'first_seen_at' => now(),
            'last_seen_at' => now(),
            'blocked_at' => now(),
            'blocked_reason' => 'Permintaan otomatis beruntun.',
        ]);

        $this->simplify($id)
            ->assertStatus(403)
            ->assertJsonPath('message', 'Perangkat ini dihentikan sementara karena pemakaian yang tidak wajar. Hubungi pengelola aplikasi.');

        // Http::preventStrayRequests() di TestCase yang menjaga janji ini:
        // tidak ada fake yang dipasang, jadi panggilan apa pun akan meledak.
        $this->assertSame(0, AiUsageLog::count());
    }

    public function test_a_served_request_is_written_to_the_usage_log(): void
    {
        $this->fakeGeminiParagraphs(['Hasil.']);
        $id = (string) Str::uuid();

        $this->simplify($id, 'L3')->assertOk();

        $log = AiUsageLog::sole();

        $this->assertSame($id, $log->device_id);
        $this->assertSame(AiUsageLog::FEATURE_SIMPLIFY, $log->feature);
        $this->assertSame('L3', $log->variant);
        $this->assertSame('id', $log->language);
        $this->assertSame('gemini', $log->provider);
        $this->assertFalse($log->cached);
        $this->assertSame(self::FAKE_PROMPT_TOKENS, $log->input_tokens);
        $this->assertSame(self::FAKE_OUTPUT_TOKENS, $log->output_tokens);
        $this->assertGreaterThan(0, (float) $log->co2e_g);
        $this->assertSame(0.0, (float) $log->avoided_co2e_g);
    }

    public function test_a_cached_request_is_logged_as_avoided_not_as_spent(): void
    {
        /*
         * Yang membuat laporan admin berguna: dua permintaan identik hanya
         * menagih kuota sekali, dan penghematannya harus terlihat sebagai
         * angka tersendiri — bukan hilang menjadi nol.
         */
        $this->fakeGeminiParagraphs(['Hasil.']);
        $id = (string) Str::uuid();

        $this->simplify($id)->assertOk();
        $this->simplify($id)->assertOk();

        $logs = AiUsageLog::orderBy('id')->get();

        $this->assertCount(2, $logs);
        $this->assertFalse($logs[0]->cached);
        $this->assertTrue($logs[1]->cached);

        $this->assertSame(0.0, (float) $logs[1]->co2e_g);
        $this->assertSame((float) $logs[0]->co2e_g, (float) $logs[1]->avoided_co2e_g);

        // Hanya satu permintaan yang benar-benar menagih kuota.
        $this->assertSame(1, AiUsageLog::billed()->count());
    }

    public function test_a_request_without_a_device_header_still_works(): void
    {
        // Aplikasi versi lama belum mengirim penanda ini. Kuotanya tetap
        // terpakai, jadi pemakaiannya tetap harus tercatat.
        $this->fakeGeminiParagraphs(['Hasil.']);

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L3'])->assertOk();

        $this->assertSame(0, Device::count());
        $this->assertNull(AiUsageLog::sole()->device_id);
    }

    public function test_a_malformed_device_id_is_ignored_rather_than_stored(): void
    {
        // Kalau nilai sembarang ikut tersimpan, tabel perangkat jadi penuh
        // sampah dan pemblokiran kehilangan artinya.
        $this->fakeGeminiParagraphs(['Hasil.']);

        $this->simplify('bukan-uuid')->assertOk();

        $this->assertSame(0, Device::count());
        $this->assertNull(AiUsageLog::sole()->device_id);
    }

    public function test_explain_records_its_style_as_the_variant(): void
    {
        $this->fakeGeminiParagraphs(['Penjelasan.']);

        $this->withHeader(IdentifyDevice::HEADER, (string) Str::uuid())
            ->postJson('/api/explain-word', ['term' => 'anabolisme', 'style' => 'analogi'])
            ->assertOk();

        $log = AiUsageLog::sole();

        $this->assertSame(AiUsageLog::FEATURE_EXPLAIN, $log->feature);
        $this->assertSame('analogi', $log->variant);
    }

    /** @return TestResponse<JsonResponse> */
    private function simplify(string $deviceId, string $level = 'L3')
    {
        return $this->withHeader(IdentifyDevice::HEADER, $deviceId)
            ->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => $level]);
    }
}
