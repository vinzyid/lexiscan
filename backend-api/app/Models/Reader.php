<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Pengguna aplikasi LexiScan — anak atau siapa pun yang memakainya membaca.
 *
 * Bukan administrator: yang itu ada di App\Models\User dan tinggal di tabel
 * terpisah. Alasan pemisahannya ada di migrasi create_readers_table.
 *
 * @property int $id
 * @property string $name
 * @property string $username
 * @property string $reading_level
 * @property string|null $school_level
 * @property string $language
 * @property string|null $theme
 * @property string|null $type_level
 * @property bool|null $tts_enabled
 * @property bool|null $tts_auto_play
 * @property bool|null $syllable_spacing
 * @property bool|null $bicolor_words
 */
#[Fillable(['name', 'username', 'password', 'reading_level', 'school_level', 'language'])]
#[Hidden(['password', 'remember_token'])]
class Reader extends Authenticatable
{
    use HasApiTokens;

    /**
     * Tingkat kemampuan membaca yang menentukan seluruh penyesuaian tampilan.
     * Urut dari yang paling butuh bantuan. Harus sama persis dengan
     * ReadingLevelId di mobile-app/src/theme/reading-levels.ts.
     */
    public const LEVEL_BELUM = 'belum';

    public const LEVEL_MENGEJA = 'mengeja';

    public const LEVEL_LANCAR = 'lancar';

    /** @return array<int, string> */
    public static function readingLevels(): array
    {
        return [self::LEVEL_BELUM, self::LEVEL_MENGEJA, self::LEVEL_LANCAR];
    }

    /**
     * Jenjang sekolah, ditanyakan di langkah 2 pendaftaran. Harus sama persis
     * dengan SchoolLevelId di mobile-app/src/theme/school-levels.ts.
     *
     * Bukan turunan dari reading_level dan tidak boleh diperlakukan begitu:
     * anak kelas 5 yang masih mengeja justru sasaran utama aplikasi ini.
     */
    public const SCHOOL_SD1 = 'sd1';

    public const SCHOOL_SD2 = 'sd2';

    public const SCHOOL_SMP = 'smp';

    public const SCHOOL_SMA = 'sma';

    public const SCHOOL_UMUM = 'umum';

    /** @return array<int, string> */
    public static function schoolLevels(): array
    {
        return [
            self::SCHOOL_SD1,
            self::SCHOOL_SD2,
            self::SCHOOL_SMP,
            self::SCHOOL_SMA,
            self::SCHOOL_UMUM,
        ];
    }

    /**
     * Preferensi yang boleh disimpan lewat PATCH /api/auth/preferences.
     *
     * Sengaja tidak ikut $fillable: `reading_level` boleh diubah lewat sini
     * juga, tapi `username` dan `password` tidak — mengubah keduanya bukan
     * "menyimpan preferensi" dan butuh alurnya sendiri.
     *
     * @return array<int, string>
     */
    public static function preferenceKeys(): array
    {
        return [
            /*
             * `name` boleh, `username` tetap tidak — dan bedanya bukan
             * sekadar teknis. Nama panggilan cuma tulisan yang tampil di kartu
             * profil; mengubahnya tidak memutus siapa pun dari akunnya.
             * Username adalah kunci masuk: menggantinya lewat endpoint
             * "preferensi" berarti seseorang bisa terkunci dari akun sendiri
             * karena salah ketik di layar pengaturan.
             */
            'name',

            'reading_level',
            'school_level',
            'language',
            'theme',
            'type_level',
            'tts_enabled',
            'tts_auto_play',
            'syllable_spacing',
            'bicolor_words',
        ];
    }

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'tts_enabled' => 'boolean',
            'tts_auto_play' => 'boolean',
            'syllable_spacing' => 'boolean',
            'bicolor_words' => 'boolean',
        ];
    }

    /**
     * Bentuk yang dikirim ke aplikasi. Ditulis eksplisit, bukan toArray(),
     * supaya kolom baru di tabel tidak diam-diam ikut terkirim.
     *
     * @return array<string, mixed>
     */
    public function toProfile(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'reading_level' => $this->reading_level,

            /*
             * Sejajar dengan reading_level, bukan di dalam `preferences`.
             * Isi `preferences` semuanya boleh dipasang ulang oleh preset saat
             * levelnya berganti; jenjang sekolah tidak — ia fakta tentang
             * penggunanya, bukan pilihan tampilan yang bisa ditimpa.
             */
            'school_level' => $this->school_level,

            'preferences' => [
                'language' => $this->language,
                'theme' => $this->theme,
                'type_level' => $this->type_level,
                'tts_enabled' => $this->tts_enabled,
                'tts_auto_play' => $this->tts_auto_play,
                'syllable_spacing' => $this->syllable_spacing,
                'bicolor_words' => $this->bicolor_words,
            ],
        ];
    }
}
