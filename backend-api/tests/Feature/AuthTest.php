<?php

namespace Tests\Feature;

use App\Models\Reader;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Pendaftaran, masuk, dan penyimpanan preferensi pengguna aplikasi.
 *
 * Yang diuji di sini bukan sekadar "autentikasi jalan", tapi keputusan
 * aksesibilitas yang menempel padanya: nama pengguna tidak boleh peka huruf
 * besar-kecil, dan preferensi yang sudah dipilih sendiri harus benar-benar
 * tersimpan di akun.
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    private const VALID = [
        'name' => 'Rafi',
        'username' => 'rafi',
        'password' => 'rahasia',
        'reading_level' => 'belum',
    ];

    public function test_it_registers_a_reader_and_returns_a_token(): void
    {
        $response = $this->postJson('/api/auth/register', self::VALID)
            ->assertCreated()
            ->assertJsonPath('reader.username', 'rafi')
            ->assertJsonPath('reader.reading_level', 'belum')
            ->assertJsonStructure(['token', 'reader' => ['id', 'name', 'username', 'reading_level', 'preferences']]);

        $this->assertNotEmpty($response->json('token'));
        $this->assertDatabaseCount('readers', 1);
    }

    /** Kata sandinya tidak boleh tersimpan apa adanya, dan tidak boleh ikut terkirim. */
    public function test_it_never_stores_or_returns_the_raw_password(): void
    {
        $response = $this->postJson('/api/auth/register', self::VALID)->assertCreated();

        $this->assertStringNotContainsString('rahasia', $response->getContent());
        $this->assertNotSame('rahasia', Reader::first()->password);
        $this->assertTrue(Hash::check('rahasia', Reader::first()->password));
    }

    /**
     * Papan ketik ponsel mengapitalkan huruf pertama secara otomatis. Kalau
     * Rafi dan rafi menjadi dua akun berbeda, jebakan itu menimpa justru
     * pengguna yang paling kesulitan mengeja.
     */
    public function test_it_treats_usernames_as_case_insensitive(): void
    {
        $this->postJson('/api/auth/register', self::VALID)->assertCreated();

        $this->postJson('/api/auth/register', [...self::VALID, 'username' => 'RAFI'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('username');

        $this->postJson('/api/auth/login', ['username' => '  RaFi ', 'password' => 'rahasia'])
            ->assertOk()
            ->assertJsonPath('reader.username', 'rafi');
    }

    public function test_it_rejects_a_reading_level_it_does_not_know(): void
    {
        $this->postJson('/api/auth/register', [...self::VALID, 'reading_level' => 'tinggi'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('reading_level');
    }

    public function test_it_rejects_a_username_with_spaces(): void
    {
        $this->postJson('/api/auth/register', [...self::VALID, 'username' => 'rafi ganteng'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('username');
    }

    /** Sebab yang berbeda, pesan yang sama: mana yang salah tidak boleh bocor. */
    public function test_it_gives_one_message_for_a_wrong_password_and_an_unknown_username(): void
    {
        $this->postJson('/api/auth/register', self::VALID)->assertCreated();

        $wrongPassword = $this->postJson('/api/auth/login', [
            'username' => 'rafi',
            'password' => 'salah-sekali',
        ])->assertStatus(401);

        $unknownUser = $this->postJson('/api/auth/login', [
            'username' => 'entah-siapa',
            'password' => 'rahasia',
        ])->assertStatus(401);

        $this->assertSame($wrongPassword->json('message'), $unknownUser->json('message'));
    }

    public function test_it_refuses_protected_endpoints_without_a_token(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
        $this->patchJson('/api/auth/preferences', ['theme' => 'gelap'])->assertStatus(401);
        $this->postJson('/api/auth/logout')->assertStatus(401);
    }

    public function test_it_returns_the_profile_for_a_valid_token(): void
    {
        $token = $this->postJson('/api/auth/register', self::VALID)->json('token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('reader.name', 'Rafi');
    }

    /**
     * Preferensi yang sudah dipilih sendiri harus ikut pindah kalau penggunanya
     * berganti HP — itu satu-satunya alasan preferensinya disimpan di server
     * dan bukan hanya di perangkat.
     */
    public function test_it_stores_preferences_chosen_by_the_reader(): void
    {
        $token = $this->postJson('/api/auth/register', self::VALID)->json('token');

        $this->withToken($token)->patchJson('/api/auth/preferences', [
            'theme' => 'gelap',
            'type_level' => 'ringan',
            'tts_enabled' => false,
            'syllable_spacing' => false,
        ])->assertOk()->assertJsonPath('reader.preferences.tts_enabled', false);

        $reader = Reader::first();

        $this->assertSame('gelap', $reader->theme);
        $this->assertSame('ringan', $reader->type_level);
        $this->assertFalse($reader->tts_enabled);
        $this->assertFalse($reader->syllable_spacing);
    }

    /**
     * Kolom preferensi yang masih null berarti belum pernah menyimpang dari
     * preset. Membedakannya dari false itu penting: yang satu boleh ditimpa
     * preset level membaca, yang satu lagi tidak boleh.
     */
    public function test_it_leaves_untouched_preferences_null(): void
    {
        $token = $this->postJson('/api/auth/register', self::VALID)->json('token');

        $reader = Reader::first();

        $this->assertNull($reader->theme);
        $this->assertNull($reader->tts_enabled);
        $this->assertNull($reader->syllable_spacing);

        $this->withToken($token)
            ->patchJson('/api/auth/preferences', ['theme' => 'biru'])
            ->assertOk();

        $this->assertNull($reader->fresh()->tts_enabled);
    }

    public function test_a_reader_can_change_their_reading_level_later(): void
    {
        $token = $this->postJson('/api/auth/register', self::VALID)->json('token');

        $this->withToken($token)
            ->patchJson('/api/auth/preferences', ['reading_level' => 'lancar'])
            ->assertOk()
            ->assertJsonPath('reader.reading_level', 'lancar');
    }

    /** Preferensi bukan pintu belakang untuk mengganti nama pengguna. */
    public function test_it_ignores_credentials_sent_to_the_preferences_endpoint(): void
    {
        $token = $this->postJson('/api/auth/register', self::VALID)->json('token');

        $this->withToken($token)->patchJson('/api/auth/preferences', [
            'username' => 'penyusup',
            'password' => 'ditebak',
            'theme' => 'hijau',
        ])->assertOk();

        $reader = Reader::first();

        $this->assertSame('rafi', $reader->username);
        $this->assertTrue(Hash::check('rahasia', $reader->password));
        $this->assertSame('hijau', $reader->theme);
    }

    /**
     * Keluar dari satu HP tidak boleh ikut mengeluarkan HP lain milik orang
     * yang sama.
     *
     * `forgetGuards()` bukan hiasan. Di dalam satu test, seluruh permintaan
     * berbagi satu container, dan Illuminate\Auth\RequestGuard mengingat
     * pengguna yang sudah pernah ia kenali. Tanpa melupakannya, permintaan
     * sesudah logout tetap dilayani oleh hasil pengenalan sebelum logout —
     * yang tidak pernah terjadi di HTTP sungguhan, karena di sana tiap
     * permintaan memulai container-nya sendiri.
     */
    public function test_logging_out_revokes_only_the_token_that_was_used(): void
    {
        $first = $this->postJson('/api/auth/register', self::VALID)->json('token');
        $second = $this->postJson('/api/auth/login', [
            'username' => 'rafi',
            'password' => 'rahasia',
        ])->json('token');

        $this->assertDatabaseCount('personal_access_tokens', 2);

        $this->withToken($first)->postJson('/api/auth/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 1);

        Auth::forgetGuards();
        $this->withToken($first)->getJson('/api/auth/me')->assertStatus(401);

        Auth::forgetGuards();
        $this->withToken($second)->getJson('/api/auth/me')->assertOk();
    }

    /** Akun aplikasi tidak boleh mendarat di tabel administrator. */
    public function test_registering_does_not_create_an_admin_user(): void
    {
        $this->postJson('/api/auth/register', self::VALID)->assertCreated();

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('readers', 1);
    }
}
