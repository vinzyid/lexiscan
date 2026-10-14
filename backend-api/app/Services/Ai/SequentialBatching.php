<?php

namespace App\Services\Ai;

/**
 * Implementasi bawaan `paragraphsForMany()` — berurutan, satu per satu.
 *
 * Ditaruh di trait, bukan diulang di tiap provider, karena bentuknya sama
 * persis untuk semuanya: cukup memanggil `paragraphsFor` berulang. Provider
 * yang bisa mengirim permintaan secara paralel (lihat GriphubProvider) menimpa
 * method-nya sendiri dan tidak memakai trait ini untuk jalur itu.
 *
 * Kenapa bukan method konkret di interface: interface PHP tidak boleh punya
 * isi. Kenapa bukan abstract class: seluruh provider sudah `implements
 * AiProvider`, dan mengubahnya jadi `extends` akan mengunci satu induk untuk
 * semua — padahal mereka tidak berbagi apa pun selain kontrak ini.
 */
trait SequentialBatching
{
    /**
     * @param  array<int, string>  $prompts
     * @return array<int, LlmResult>
     */
    public function paragraphsForMany(array $prompts, ?float $timeoutSeconds = null): array
    {
        $results = [];

        foreach ($prompts as $prompt) {
            $results[] = $this->paragraphsFor($prompt, $timeoutSeconds);
        }

        return $results;
    }
}
