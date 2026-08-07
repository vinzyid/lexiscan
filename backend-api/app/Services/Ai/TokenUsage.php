<?php

namespace App\Services\Ai;

/**
 * Jumlah token satu panggilan LLM. Ini satu-satunya besaran yang dilaporkan
 * semua penyedia dan berbanding lurus dengan energi yang dipakai, jadi seluruh
 * perhitungan jejak karbon bertumpu padanya.
 *
 * Token "penalaran" (thinking) dihitung sebagai keluaran: model tetap
 * membangkitkannya satu per satu dengan biaya komputasi yang sama, meski
 * tidak ikut ditampilkan ke pengguna.
 */
final class TokenUsage
{
    public function __construct(
        public readonly int $input = 0,
        public readonly int $output = 0,
    ) {}

    /**
     * Dipakai saat penyedia tidak melaporkan pemakaian sama sekali. Dibedakan
     * dari nol supaya jejak karbon bisa ditandai "tidak diketahui" alih-alih
     * dilaporkan sebagai nol yang menyesatkan.
     */
    public static function unknown(): self
    {
        return new self(0, 0);
    }

    public function isKnown(): bool
    {
        return $this->input > 0 || $this->output > 0;
    }

    public function total(): int
    {
        return $this->input + $this->output;
    }

    /** @return array{input: int, output: int, total: int} */
    public function toArray(): array
    {
        return [
            'input' => $this->input,
            'output' => $this->output,
            'total' => $this->total(),
        ];
    }

    /**
     * Blok `usage` milik API bergaya OpenAI — dipakai Grok, Mistral, dan
     * OpenRouter. Token penalaran sudah termasuk di completion_tokens.
     *
     * @param  mixed  $usage
     */
    public static function fromOpenAi($usage): self
    {
        if (! is_array($usage)) {
            return self::unknown();
        }

        return new self(
            max(0, (int) ($usage['prompt_tokens'] ?? 0)),
            max(0, (int) ($usage['completion_tokens'] ?? 0)),
        );
    }

    /**
     * Blok `usageMetadata` milik Gemini. Berbeda dari gaya OpenAI, token
     * penalaran dilaporkan terpisah di thoughtsTokenCount dan TIDAK termasuk
     * dalam candidatesTokenCount, jadi harus dijumlahkan sendiri — kalau tidak,
     * model thinking seperti Gemini 3.x akan tampak jauh lebih hemat daripada
     * kenyataannya.
     *
     * @param  mixed  $metadata
     */
    public static function fromGemini($metadata): self
    {
        if (! is_array($metadata)) {
            return self::unknown();
        }

        return new self(
            max(0, (int) ($metadata['promptTokenCount'] ?? 0)),
            max(0, (int) ($metadata['candidatesTokenCount'] ?? 0))
                + max(0, (int) ($metadata['thoughtsTokenCount'] ?? 0)),
        );
    }

    /**
     * Kebalikan toArray(), untuk membaca pemakaian yang tersimpan di cache.
     *
     * @param  mixed  $data
     */
    public static function fromArray($data): self
    {
        if (! is_array($data)) {
            return self::unknown();
        }

        return new self(
            max(0, (int) ($data['input'] ?? 0)),
            max(0, (int) ($data['output'] ?? 0)),
        );
    }
}
