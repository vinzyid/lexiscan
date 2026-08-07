<?php

namespace Tests\Feature;

use App\Http\Middleware\IdentifyDevice;
use App\Models\Feedback;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/** POST /api/feedback — masukan pengguna dan laporan kegagalan OCR. */
class FeedbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_stores_a_report_and_links_it_to_the_sending_device(): void
    {
        $id = (string) Str::uuid();

        $this->withHeader(IdentifyDevice::HEADER, $id)
            ->postJson('/api/feedback', [
                'type' => Feedback::TYPE_OCR_FAILURE,
                'message' => 'Teks di buku cetak tipis terbaca berantakan.',
                'sample' => 'Fot0s1ntes1s ada1ah pr0ses',
                'platform' => 'android',
                'app_version' => '1.0.0',
            ])
            ->assertCreated()
            ->assertJsonPath('message', 'Terima kasih, laporanmu sudah kami terima.');

        $report = Feedback::sole();

        $this->assertSame($id, $report->device_id);
        $this->assertSame(Feedback::TYPE_OCR_FAILURE, $report->type);
        $this->assertSame('Fot0s1ntes1s ada1ah pr0ses', $report->sample);
        $this->assertNull($report->handled_at);
    }

    public function test_the_text_sample_is_optional(): void
    {
        // Memaksakannya berarti memaksa pengguna membagikan isi bacaannya.
        $this->postJson('/api/feedback', [
            'type' => Feedback::TYPE_FEEDBACK,
            'message' => 'Mode fokus sangat membantu, terima kasih.',
        ])->assertCreated();

        $this->assertNull(Feedback::sole()->sample);
    }

    public function test_it_rejects_an_unknown_report_type(): void
    {
        $this->postJson('/api/feedback', [
            'type' => 'sesuatu',
            'message' => 'Halo.',
        ])->assertStatus(422);

        $this->assertSame(0, Feedback::count());
    }

    public function test_it_rejects_an_oversized_sample(): void
    {
        // Batasnya menjaga endpoint ini tidak berubah jadi jalur penyalinan
        // seluruh isi buku ke server kami.
        $this->postJson('/api/feedback', [
            'type' => Feedback::TYPE_OCR_FAILURE,
            'message' => 'Gagal baca.',
            'sample' => str_repeat('a', 2001),
        ])->assertStatus(422);
    }

    public function test_a_blocked_device_cannot_send_reports_either(): void
    {
        $id = (string) Str::uuid();

        \App\Models\Device::create([
            'id' => $id,
            'first_seen_at' => now(),
            'last_seen_at' => now(),
            'blocked_at' => now(),
            'blocked_reason' => 'Membanjiri laporan.',
        ]);

        $this->withHeader(IdentifyDevice::HEADER, $id)
            ->postJson('/api/feedback', [
                'type' => Feedback::TYPE_FEEDBACK,
                'message' => 'Halo lagi.',
            ])
            ->assertStatus(403);

        $this->assertSame(0, Feedback::count());
    }
}
