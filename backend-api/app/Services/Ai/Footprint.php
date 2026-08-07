<?php

namespace App\Services\Ai;

/**
 * Taksiran dampak lingkungan satu permintaan AI.
 *
 * Dua pasang angka, dan bedanya penting:
 *
 * - energyWh / co2eGrams  : yang BENAR-BENAR dikeluarkan permintaan ini.
 * - avoided*              : yang TIDAK jadi dikeluarkan karena jawabannya
 *                           diambil dari cache.
 *
 * Satu permintaan hanya mengisi salah satu pasangan, tidak pernah keduanya.
 * Dipisah begitu supaya penjumlahan di aplikasi tidak pernah ambigu: total
 * pemakaian dan total penghematan tidak boleh saling mencemari.
 */
final class Footprint
{
    private function __construct(
        public readonly float $energyWh,
        public readonly float $co2eGrams,
        public readonly float $avoidedEnergyWh,
        public readonly float $avoidedCo2eGrams,
        public readonly TokenUsage $tokens,
        public readonly bool $cached,
    ) {}

    /** Permintaan yang benar-benar memanggil model. */
    public static function spent(float $energyWh, float $co2eGrams, TokenUsage $tokens): self
    {
        return new self($energyWh, $co2eGrams, 0.0, 0.0, $tokens, false);
    }

    /**
     * Permintaan yang dilayani cache: tidak ada model yang berjalan, jadi
     * biayanya nol dan taksiran yang seharusnya keluar dicatat sebagai hemat.
     */
    public static function avoided(float $energyWh, float $co2eGrams, TokenUsage $tokens): self
    {
        return new self(0.0, 0.0, $energyWh, $co2eGrams, $tokens, true);
    }

    /**
     * Jumlah token tidak dilaporkan penyedia, jadi tidak ada dasar untuk
     * menaksir apa pun. Sengaja tidak memakai nol supaya aplikasi bisa
     * menyembunyikan angkanya alih-alih menampilkan "0 g" yang keliru.
     */
    public static function unknown(): self
    {
        return new self(0.0, 0.0, 0.0, 0.0, TokenUsage::unknown(), false);
    }

    public function isKnown(): bool
    {
        return $this->tokens->isKnown();
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            // Selalu taksiran, tidak pernah pengukuran. Ditandai eksplisit
            // supaya aplikasi bisa menuliskannya apa adanya ke pengguna.
            'estimated' => true,
            'known' => $this->isKnown(),
            'cached' => $this->cached,
            'method' => (string) config('footprint.method'),
            'energy_wh' => round($this->energyWh, 4),
            'co2e_g' => round($this->co2eGrams, 5),
            'avoided_energy_wh' => round($this->avoidedEnergyWh, 4),
            'avoided_co2e_g' => round($this->avoidedCo2eGrams, 5),
            'tokens' => $this->tokens->toArray(),
        ];
    }
}
