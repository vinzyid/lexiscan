import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { create } from 'zustand';

import { getReadingLevel } from '../theme/reading-levels';
import { useOCRStore } from '../store/useStore';
import { normalizeSpeechText, speak as speakOut, stop as stopOut } from './speech-service';

/**
 * Apa yang sedang berbunyi, disimpan global.
 *
 * Harus global karena tombol suaranya tersebar: satu di tiap paragraf, satu di
 * bilah kontrol, satu di kartu jawaban Lexi. Kalau tiap tombol menyimpan
 * statusnya sendiri, menekan tombol paragraf kedua akan menghentikan bunyi
 * paragraf pertama — tapi tombol pertama tetap terlihat sedang berbunyi,
 * karena tidak ada yang memberitahunya.
 *
 * `key` menandai sumber bunyinya, mis. 'paragraph:3' atau 'explain'.
 */
type SpeechState = {
  speakingKey: string | null;
  setSpeakingKey: (key: string | null) => void;
};

const useSpeechState = create<SpeechState>()((set) => ({
  speakingKey: null,
  setSpeakingKey: (key) => set({ speakingKey: key }),
}));

/**
 * Nomor urutan `speakSequence` yang masih berhak berlanjut. Dinaikkan setiap
 * urutan baru dimulai, jadi urutan lama yang masih menunggu jeda berhenti
 * sendiri meski key-nya sama (mis. kata yang sama diketuk dua kali).
 */
let sequenceToken = 0;

/** Jeda antar suku kata: cukup untuk terdengar terpisah, tidak sampai putus. */
const SEQUENCE_GAP_MS = 180;

/**
 * Membacakan teks dengan pengaturan yang berlaku bagi pengguna saat ini.
 *
 * Yang dibacakan HARUS teks aslinya, bukan yang sudah dipenggal suku kata di
 * layar. "Mi to kon dri a" akan dilafalkan sebagai lima kata terpisah. Karena
 * itu pemenggalan hanya hidup di lapisan render (`DyslexicText`) dan tidak
 * pernah masuk ke store.
 */
export function useSpeech() {
  const language = useOCRStore((s) => s.language);
  const enabled = useOCRStore((s) => s.ttsEnabled);
  const readingLevel = useOCRStore((s) => s.readingLevel);
  const voice = useOCRStore((s) => s.voiceIds[s.language]);
  const speakingKey = useSpeechState((s) => s.speakingKey);
  const setSpeakingKey = useSpeechState((s) => s.setSpeakingKey);

  // Pilihan pengguna menang atas preset; `null` berarti ia belum pernah
  // mengaturnya sendiri, jadi presetlah yang berlaku.
  const customRate = useOCRStore((s) => s.speechRate);
  const rate = customRate ?? getReadingLevel(readingLevel).speechRate;

  const stop = useCallback(() => {
    setSpeakingKey(null);
    void stopOut();
  }, [setSpeakingKey]);

  const speak = useCallback(
    (
      text: string,
      key: string,
      options?: { onBoundary?: (charIndex: number) => void; onDone?: () => void },
    ) => {
      if (!enabled) return;

      setSpeakingKey(key);

      void speakOut(text, {
        language,
        rate,
        voice,
        onBoundary: options?.onBoundary,
        onDone: options?.onDone,
        /*
         * Dibandingkan dengan key-nya sendiri: saat ucapan lama dihentikan
         * karena ada yang baru, callback-nya masih ikut berbunyi. Tanpa
         * perbandingan ini, ucapan yang baru saja dimulai langsung ditandai
         * selesai oleh pendahulunya.
         */
        onSettled: () => {
          if (useSpeechState.getState().speakingKey === key) {
            setSpeakingKey(null);
          }
        },
      });
    },
    [enabled, language, rate, voice, setSpeakingKey],
  );

  /**
   * Bacakan potongan teks satu per satu, mis. suku kata "Nep", "tu", "nus".
   *
   * KENAPA SATU UCAPAN PER POTONGAN. Mesin TTS bawaan menerima teks utuh dan
   * tidak mengenal penanda suku kata; `onBoundary`-nya hanya per kata. Satu-
   * satunya cara agar tiap suku kata terdengar terpisah dan bisa disorot adalah
   * mengucapkannya sendiri-sendiri, lalu menyambung ke potongan berikutnya
   * setelah yang sebelumnya selesai.
   *
   * `speakingKey` dipegang sampai urutannya habis, bukan dilepas tiap potongan
   * selesai: kalau dilepas, sorotan dan tombol berhenti berkedip di setiap jeda.
   */
  const speakSequence = useCallback(
    (
      parts: string[],
      key: string,
      options?: { onPart?: (index: number) => void; onDone?: () => void; rate?: number },
    ) => {
      if (!enabled || parts.length === 0) return;

      sequenceToken += 1;
      const token = sequenceToken;
      setSpeakingKey(key);

      const stillMine = () =>
        token === sequenceToken && useSpeechState.getState().speakingKey === key;

      const finish = () => {
        if (!stillMine()) return;
        setSpeakingKey(null);
        options?.onDone?.();
      };

      const playAt = (index: number) => {
        if (!stillMine()) return;
        if (index >= parts.length) {
          finish();
          return;
        }

        /*
         * Potongan yang tak berbunyi (tanda baca saja) dilompati. `speakOut`
         * tidak memanggil `onDone` untuk teks kosong, jadi tanpa ini urutannya
         * macet di situ.
         */
        if (normalizeSpeechText(parts[index]).length === 0) {
          playAt(index + 1);
          return;
        }

        options?.onPart?.(index);

        void speakOut(parts[index], {
          language,
          rate: options?.rate ?? rate,
          voice,
          // Hanya selesai wajar yang menyambung; dihentikan berarti urutannya putus.
          onDone: () => setTimeout(() => playAt(index + 1), SEQUENCE_GAP_MS),
          onSettled: () => {},
        });
      };

      playAt(0);
    },
    [enabled, language, rate, voice, setSpeakingKey],
  );

  /** Tekan untuk membacakan, tekan lagi untuk berhenti. */
  const toggle = useCallback(
    (
      text: string,
      key: string,
      options?: { onBoundary?: (charIndex: number) => void; onDone?: () => void },
    ) => {
      if (speakingKey === key) {
        stop();

        return;
      }

      speak(text, key, options);
    },
    [speakingKey, speak, stop],
  );

  return { enabled, speak, speakSequence, stop, toggle, speakingKey };
}

/**
 * Awalan `key` untuk ucapan yang berasal dari NAMA TOMBOL, bukan dari isi
 * bacaan. Dibedakan karena umurnya beda: nama tombol sengaja dibiarkan selesai
 * meski layarnya sudah berganti — lihat `shouldKeepSpeaking`.
 */
const UI_KEY_PREFIX = 'ui:';

/**
 * Bacakan nama tombol saat ditekan.
 *
 * Dipakai satu kali saja, di dalam `PressableScale`, sehingga seluruh tombol
 * aplikasi ikut tanpa perlu disentuh satu per satu. Yang dibacakan adalah
 * `accessibilityLabel`-nya — label yang memang sudah ditulis untuk pembaca
 * layar, jadi tidak ada teks baru yang perlu dikarang dan tidak ada tombol yang
 * kelewat.
 */
export function useSpeakLabel(): (label: string) => void {
  const active = useOCRStore((s) => s.speakButtonLabels);
  const { speak } = useSpeech();

  return useCallback(
    (label: string) => {
      if (!active) return;

      speak(label, `${UI_KEY_PREFIX}${label}`);
    },
    [active, speak],
  );
}

/**
 * Bolehkah ucapan yang sedang berjalan diteruskan saat layar ditinggalkan.
 *
 * Nama tombol justru paling sering ditekan untuk BERPINDAH layar — "Pindai
 * dokumen", "Buka layar baca". Kalau perpindahannya menghentikan ucapan, satu-
 * satunya tombol yang namanya sempat terdengar adalah tombol yang tidak ke mana
 * -mana, dan pengguna yang belum bisa membaca tidak pernah tahu ia menekan apa.
 * Labelnya pendek, jadi ia selesai sendiri sesaat setelah layar barunya tampil.
 */
function shouldKeepSpeaking(): boolean {
  return useSpeechState.getState().speakingKey?.startsWith(UI_KEY_PREFIX) ?? false;
}

/**
 * Hentikan suara saat layar atau lembar ditutup.
 *
 * Tanpa ini, menutup "Tanya Lexi" di tengah jawaban meninggalkan suara yang
 * terus berbicara di atas layar lain — dan tidak ada lagi tombol untuk
 * menghentikannya.
 */
export function useStopSpeechOnUnmount(): void {
  useEffect(
    () => () => {
      if (shouldKeepSpeaking()) return;

      useSpeechState.getState().setSpeakingKey(null);
      void stopOut();
    },
    [],
  );
}

/**
 * Hentikan suara saat pengguna berpindah tab.
 *
 * Tab di expo-router tidak melepas layarnya saat ditinggalkan, jadi
 * `useStopSpeechOnUnmount` tidak pernah berjalan di sana — tanpa hook ini,
 * paragraf yang sedang dibacakan terus berbunyi di layar Pindai.
 */
export function useStopSpeechOnBlur(): void {
  useFocusEffect(
    useCallback(
      () => () => {
        if (shouldKeepSpeaking()) return;

        useSpeechState.getState().setSpeakingKey(null);
        void stopOut();
      },
      [],
    ),
  );
}

/**
 * Bacakan sendiri begitu `text` berganti, tanpa perlu ditekan.
 *
 * Hanya untuk pengguna yang presetnya memang meminta demikian — yang belum bisa
 * membaca sama sekali. `active` sengaja parameter, bukan dibaca di dalam, supaya
 * pemanggil bisa menambahkan syaratnya sendiri (mis. jawaban sudah selesai
 * dimuat, bukan sedang memuat).
 */
export function useAutoSpeak(
  text: string | null,
  key: string,
  active: boolean,
  onBoundary?: (charIndex: number) => void,
  onDone?: () => void,
): void {
  const autoPlay = useOCRStore((s) => s.ttsAutoPlay);
  const { enabled, speak } = useSpeech();

  /*
   * Disimpan di ref supaya identitas callback yang berubah tiap render tidak
   * ikut memicu efek di bawah dan mengulang bacaan dari awal.
   */
  const boundaryRef = useRef(onBoundary);
  const doneRef = useRef(onDone);

  useEffect(() => {
    boundaryRef.current = onBoundary;
    doneRef.current = onDone;
  }, [onBoundary, onDone]);

  useEffect(() => {
    if (!active || !autoPlay || !enabled || !text) return;

    speak(text, key, {
      onBoundary: (charIndex) => boundaryRef.current?.(charIndex),
      onDone: () => doneRef.current?.(),
    });
    // `speak` sengaja tidak masuk daftar: identitasnya berubah setiap kali
    // preferensi suara berganti, dan itu akan mengulang bacaan dari awal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, key, active, autoPlay, enabled]);
}
