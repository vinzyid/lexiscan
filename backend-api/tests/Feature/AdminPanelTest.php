<?php

namespace Tests\Feature;

use App\Models\AiUsageLog;
use App\Models\Device;
use App\Models\Feedback;
use App\Models\Setting;
use App\Models\User;
use App\Services\SystemSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Uji asap dashboard admin.
 *
 * Setiap halaman benar-benar dirender dengan data di dalamnya, bukan sekadar
 * dicek rutenya terdaftar: kesalahan pemakaian API Filament — kolom yang tidak
 * ada, closure dengan tipe salah, komponen yang keliru — baru meledak saat
 * halamannya digambar.
 */
class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_panel_is_closed_to_guests(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->get('/admin/devices')->assertRedirect('/admin/login');
        $this->get('/admin/ai-usage-logs')->assertRedirect('/admin/login');
        $this->get('/admin/feedback')->assertRedirect('/admin/login');
        $this->get('/admin/manage-settings')->assertRedirect('/admin/login');
    }

    public function test_the_dashboard_renders_with_real_data(): void
    {
        $this->seedSample();

        $this->actingAs($this->admin())
            ->get('/admin')
            ->assertOk();
    }

    public function test_the_dashboard_renders_when_nothing_has_happened_yet(): void
    {
        // Hari pertama deploy: semua agregatnya nol atau null, dan pembagian
        // rasio cache tidak boleh membaginya dengan nol.
        $this->actingAs($this->admin())
            ->get('/admin')
            ->assertOk();
    }

    public function test_the_device_list_renders(): void
    {
        $this->seedSample();

        $this->actingAs($this->admin())
            ->get('/admin/devices')
            ->assertOk();
    }

    public function test_the_usage_log_renders(): void
    {
        $this->seedSample();

        $this->actingAs($this->admin())
            ->get('/admin/ai-usage-logs')
            ->assertOk();
    }

    public function test_the_feedback_list_renders(): void
    {
        $this->seedSample();

        $this->actingAs($this->admin())
            ->get('/admin/feedback')
            ->assertOk();
    }

    public function test_the_settings_page_renders_with_the_default_prompts_filled_in(): void
    {
        $this->actingAs($this->admin())
            ->get('/admin/manage-settings')
            ->assertOk()
            // Aturan bawaan L5 bahasa Indonesia harus muncul di formulirnya;
            // kalau kosong, admin akan menyimpan prompt kosong tanpa sadar.
            ->assertSee('anak sekolah dasar');
    }

    public function test_an_edited_rule_is_what_the_settings_page_shows(): void
    {
        Setting::create([
            'key' => SystemSettings::KEY_SIMPLIFY_RULES,
            'value' => ['id' => ['L5' => 'Aturan hasil suntingan admin.']],
        ]);

        $this->actingAs($this->admin())
            ->get('/admin/manage-settings')
            ->assertOk()
            ->assertSee('Aturan hasil suntingan admin.')
            // Level lain tetap memakai bawaannya, tidak ikut terhapus.
            ->assertSee('Pertahankan semua istilah teknis');
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin',
            'email' => 'admin@lexiscan.test',
            'password' => 'rahasia-sekali',
        ]);
    }

    /** Satu perangkat, satu riwayat pemakaian, dua laporan. */
    private function seedSample(): void
    {
        $device = Device::create([
            'id' => (string) Str::uuid(),
            'first_seen_at' => now()->subDays(3),
            'last_seen_at' => now(),
        ]);

        AiUsageLog::create([
            'device_id' => $device->id,
            'feature' => AiUsageLog::FEATURE_SIMPLIFY,
            'variant' => 'L3',
            'language' => 'id',
            'provider' => 'gemini',
            'model' => 'gemini-3.6-flash',
            'cached' => false,
            'input_tokens' => 500,
            'output_tokens' => 400,
            'energy_wh' => 0.2398,
            'co2e_g' => 0.029975,
            'avoided_energy_wh' => 0,
            'avoided_co2e_g' => 0,
            'duration_ms' => 1840,
        ]);

        // Satu tanpa perangkat, untuk memastikan kolomnya tahan nilai null.
        AiUsageLog::create([
            'device_id' => null,
            'feature' => AiUsageLog::FEATURE_CORRECT_TYPO,
            'variant' => null,
            'language' => 'id',
            'provider' => 'gemini',
            'model' => 'gemini-3.6-flash',
            'cached' => true,
            'input_tokens' => 500,
            'output_tokens' => 400,
            'energy_wh' => 0,
            'co2e_g' => 0,
            'avoided_energy_wh' => 0.2398,
            'avoided_co2e_g' => 0.029975,
            'duration_ms' => null,
        ]);

        Feedback::create([
            'device_id' => $device->id,
            'type' => Feedback::TYPE_OCR_FAILURE,
            'message' => 'Buku cetak tipis terbaca berantakan.',
            'sample' => 'Fot0s1ntes1s',
            'platform' => 'android',
            'app_version' => '1.0.0',
        ]);

        Feedback::create([
            'device_id' => null,
            'type' => Feedback::TYPE_FEEDBACK,
            'message' => 'Mode fokus membantu sekali.',
            'handled_at' => now(),
            'handled_note' => 'Sudah diteruskan ke tim desain.',
        ]);
    }
}
