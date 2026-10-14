import { useMemo, useState } from 'react';
import { Text, type TextLayoutEventData, type NativeSyntheticEvent } from 'react-native';

import { getTypeLevel, type TypeLevel } from '../theme/palettes';
import { useOCRStore } from '../store/useStore';
import { useThemeColors } from '../theme/theme-provider';
import { splitSyllables } from '../utils/syllables';
import type { LanguageId } from '../store/useStore';

type Props = {
  children: string;
  /** Bicolor Words: warna bergantian per kata supaya mata tidak kehilangan baris. */
  bicolor?: boolean;
  /** Diredupkan saat paragraf lain sedang aktif di Mode Fokus. */
  dimmed?: boolean;
  onWordPress?: (word: string) => void;
  /** Timpa preset tipografi aktif — dipakai kartu pratinjau di Pengaturan. */
  levelOverride?: TypeLevel;
  /** Timpa pengaturan pemenggalan suku kata — juga untuk kartu pratinjau. */
  syllableOverride?: boolean;
  /**
   * Nomor kata yang sedang dibacakan suara, untuk menyorotnya mengikuti TTS.
   *
   * Diisi hanya saat paragraf ini sedang berbunyi; `null`/tidak diisi berarti
   * tidak ada sorotan. Nomor katanya memakai urutan yang sama dengan
   * `wordIndex` pada `toChunks` (spasi tidak dihitung).
   */
  activeWordIndex?: number | null;
  /** Posisi tiap baris hasil layout — dipakai Reading Ruler untuk menempatkan penggaris. */
  onTextLayout?: (event: NativeSyntheticEvent<TextLayoutEventData>) => void;
  /**
   * Nomor baris yang sedang ditunjuk Reading Ruler, atau `null` kalau penggaris
   * mati / paragraf ini bukan yang aktif.
   *
   * Gunanya satu: Bicolor Words DIMATIKAN pada kata-kata yang duduk di baris
   * itu. Alasannya kontras — penggaris menggambar latar kuning, dan kata genap
   * yang berwarna emas di atas kuning nyaris tidak terbaca. Di baris lain
   * bicolor tetap jalan seperti biasa, jadi yang kehilangan warna hanya satu
   * baris yang memang sedang ditunjuk.
   */
  rulerLineIndex?: number | null;
};

/** Hanya huruf/angka — tanda baca dibuang agar sheet suku kata tidak ikut kebawa. */
const stripPunctuation = (word: string) => word.replace(/[^\p{L}\p{N}]/gu, '');

/**
 * Pisahkan tanda baca yang menempel di depan dan belakang kata.
 *
 * Tanpa ini "sel," ikut masuk ke pemenggal suku kata dan komanya hilang dari
 * layar. Tanda hubung sengaja dibiarkan menempel di inti kata, karena
 * "anak-anak" memang satu kata dan pemenggalnya sudah tahu cara menanganinya.
 */
const AFFIXES = /^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}]*)$/u;

/** Penyambung antar suku kata: "Mi-to-kon-dri-a", mengikuti Figma. */
const HYPHEN = '-';

type Chunk =
  | { kind: 'space' }
  | {
      kind: 'word';
      text: string;
      wordIndex: number;
      prefix: string;
      suffix: string;
      /** Kosong berarti kata ini ditampilkan utuh, tanpa dipenggal. */
      syllables: string[];
    };

/**
 * Pecah paragraf jadi potongan kata + spasi, sambil menomori kata (spasi tidak
 * dihitung). Nomor inilah yang menentukan giliran warna pada Bicolor Words.
 */
function toChunks(text: string, syllableSpacing: boolean, language: LanguageId): Chunk[] {
  let counter = 0;

  return text
    .split(/(\s+)/)
    .filter((chunk) => chunk.length > 0)
    .map((chunk): Chunk => {
      if (/^\s+$/.test(chunk)) return { kind: 'space' };

      const wordIndex = counter;
      counter += 1;

      if (!syllableSpacing) {
        return { kind: 'word', text: chunk, wordIndex, prefix: '', suffix: '', syllables: [] };
      }

      const [, prefix = '', core = '', suffix = ''] = chunk.match(AFFIXES) ?? [];
      const syllables = splitSyllables(core, language);

      /*
       * Dua syarat sebelum sebuah kata boleh ditampilkan terpenggal:
       *
       * - lebih dari satu suku kata, karena memenggal "di" jadi "di" hanya
       *   menambah elemen tanpa efek apa pun;
       * - hasil penggalannya kalau disambung kembali harus SAMA PERSIS dengan
       *   kata aslinya. splitSyllables membuang karakter yang bukan huruf,
       *   angka, atau tanda hubung, sehingga "don't" akan kembali sebagai
       *   "dont". Menampilkan kata yang berbeda dari yang tertulis di buku
       *   adalah kesalahan yang jauh lebih buruk daripada tidak memenggalnya.
       */
      const lossless = syllables.join('') === core;

      return {
        kind: 'word',
        text: chunk,
        wordIndex,
        prefix,
        suffix,
        syllables: syllables.length > 1 && lossless ? syllables : [],
      };
    });
}

/**
 * Satu paragraf teks bacaan dengan aturan tipografi dari Figma:
 *
 * - Atkinson Hyperlegible, line-height lega (1.85–2.4×), letter spacing renggang.
 * - Visual fixation: huruf pertama tiap kata Bold, sisanya Regular. Hanya aktif
 *   di preset Sedang & Berat.
 * - Bicolor Words: kata ganjil/genap berganti warna (bicolorA / bicolorB).
 * - Pemenggalan suku kata: "Mitokondria" ditulis "Mi-to-kon-dri-a", langsung di
 *   teksnya dan tanpa perlu diketuk lebih dulu.
 */
export function DyslexicText({
  children,
  bicolor,
  dimmed,
  onWordPress,
  levelOverride,
  syllableOverride,
  activeWordIndex,
  onTextLayout,
  rulerLineIndex,
}: Props) {
  const typeLevelId = useOCRStore((s) => s.typeLevelId);
  const storeSyllableSpacing = useOCRStore((s) => s.syllableSpacing);
  const language = useOCRStore((s) => s.language);
  const level = levelOverride ?? getTypeLevel(typeLevelId);
  const colors = useThemeColors();

  const syllableSpacing = syllableOverride ?? storeSyllableSpacing;

  /*
   * Pemenggalan dihitung ulang hanya kalau salah satu masukannya berubah.
   * Tanpa memo, setiap paragraf memanggil splitSyllables sekali per kata di
   * SETIAP render — termasuk saat penggaris baca digeser jari.
   */
  const chunks = useMemo(
    () => toChunks(children, syllableSpacing, language),
    [children, syllableSpacing, language],
  );

  /*
   * Teks tiap baris hasil layout, dipakai untuk tahu kata mana yang duduk di
   * barisan penggaris. Disimpan di state (bukan ref) karena perubahannya harus
   * memicu render ulang — kalau di ref, warnanya baru berubah pada render
   * berikutnya dan penggaris terlihat "telat" satu langkah.
   */
  const [lineTexts, setLineTexts] = useState<string[]>([]);

  /*
   * Pemetaan kata → baris yang sedang ditunjuk penggaris.
   *
   * CARA MENGHITUNGNYA: tiap baris dari `onTextLayout` membawa teksnya sendiri,
   * dan jumlah katanya menentukan berapa banyak kata berurutan yang jatuh di
   * baris itu. Jadi peta dibangun dengan menghitung kata per baris secara
   * kumulatif — tanpa perlu mengukur posisi y tiap kata, yang tidak tersedia
   * dari layout teks.
   *
   * Ini perkiraan yang cukup untuk pewarnaan: kalau jumlah katanya meleset
   * sedikit, yang salah cuma warna di ujung baris, bukan isi teksnya.
   */
  const rulerWords = useMemo(() => {
    if (rulerLineIndex == null || lineTexts.length === 0) return null;

    const flagged = new Set<number>();
    let wordCursor = 0;

    for (let line = 0; line < lineTexts.length; line += 1) {
      const count = lineTexts[line].split(/\s+/).filter((word) => word.length > 0).length;

      if (line === rulerLineIndex) {
        for (let i = 0; i < count; i += 1) flagged.add(wordCursor + i);
      }

      wordCursor += count;
    }

    return flagged;
  }, [rulerLineIndex, lineTexts]);

  /*
   * Jarak antar kata tetap satu spasi, bahkan saat pemenggalan menyala.
   *
   * Dulu dilebarkan jadi dua spasi karena suku kata dipisahkan spasi juga —
   * tanpa pembeda itu, "Mi to kon dri a" terbaca sebagai lima kata terpisah.
   * Sekarang suku kata disambung TANDA HUBUNG (mengikuti Figma), dan tanda
   * hubung sudah mengikat suku katanya secara visual: melebarkan jarak antar
   * kata di atasnya justru merenggangkan baris tanpa guna.
   */
  const wordGap = ' ';

  return (
    <Text
      className="font-read"
      /*
       * Dua tugas digabung di satu handler: teks tiap baris disimpan sendiri
       * supaya peta kata→baris di atas terisi, lalu kejadian aslinya diteruskan
       * ke pemanggil. Memasang dua `onTextLayout` tidak mungkin — prop-nya satu.
       */
      onTextLayout={(event) => {
        const lines = event.nativeEvent.lines.map((line) => line.text);

        /*
         * Dibandingkan dulu sebelum disimpan: `onTextLayout` terpanggil tiap
         * render dengan array baru, dan menyetel state tanpa perbandingan akan
         * memicu render tanpa henti.
         */
        setLineTexts((previous) =>
          previous.length === lines.length && previous.every((text, i) => text === lines[i])
            ? previous
            : lines,
        );

        onTextLayout?.(event);
      }}
      /*
       * Label diisi teks aslinya. TalkBack membaca isi elemen apa adanya, jadi
       * tanpa ini pembaca layar ikut mengeja "Mi-to-kon-dri-a" suku kata demi
       * suku kata — persis kebalikan dari maksud fiturnya.
       */
      accessible
      accessibilityLabel={children}
      style={{
        fontSize: level.fontSize,
        lineHeight: level.fontSize * level.lineHeightRatio,
        letterSpacing: level.letterSpacing,
        color: dimmed ? colors.textMuted : colors.textMain,
        opacity: dimmed ? 0.35 : 1,
      }}>
      {chunks.map((chunk, index) => {
        if (chunk.kind === 'space') return <Text key={index}>{wordGap}</Text>;

        /*
         * Bicolor Words dimatikan pada kata yang duduk di baris penggaris.
         * Latar penggaris sudah berwarna, dan kata genap yang bernuansa emas di
         * atasnya nyaris hilang — jadi di baris itu saja teksnya dikembalikan ke
         * warna biasa supaya tetap terbaca. Baris lain tidak terpengaruh.
         */
        const onRulerLine = rulerWords?.has(chunk.wordIndex) ?? false;

        const color = dimmed
          ? undefined
          : bicolor && !onRulerLine
            ? chunk.wordIndex % 2 === 0
              ? colors.bicolorA
              : colors.bicolorB
            : undefined;

        /*
         * Kata yang sedang dibacakan diberi latar sorot. Warnanya `wordHighlight`,
         * BUKAN `highlight` milik penggaris: keduanya sering menyala bersamaan,
         * dan kalau warnanya sama, kata yang dibacakan tenggelam di dalam balok
         * penggaris. Dua token berbeda membuat penanda kata tetap terlihat di
         * atas penanda baris.
         *
         * Warna teksnya dikunci ke `textMain`, bukan diwarisi warna Bicolor:
         * belum ada token teks khusus-di-atas-sorotan, dan `textMain` sudah
         * dijamin kontras dengan `wordHighlight` di setiap tema.
         */
        const isActive = !dimmed && activeWordIndex === chunk.wordIndex;

        const press = onWordPress ? () => onWordPress(stripPunctuation(chunk.text)) : undefined;

        return (
          <Text
            key={index}
            style={
              isActive
                ? { color: colors.textMain, backgroundColor: colors.wordHighlight }
                : color
                  ? { color }
                  : undefined
            }
            onPress={press}>
            {chunk.syllables.length > 0
              ? renderSyllables(chunk, level.bodyBold)
              : renderWhole(chunk.text, level.bodyBold)}
          </Text>
        );
      })}
    </Text>
  );
}

/** Kata utuh, dengan huruf pertamanya ditebalkan kalau presetnya meminta. */
function renderWhole(text: string, bodyBold: boolean) {
  if (!bodyBold) return text;

  return (
    <>
      <Text className="font-read-bold">{text.slice(0, 1)}</Text>
      <Text>{text.slice(1)}</Text>
    </>
  );
}

/**
 * Kata yang dipecah jadi suku kata, disambung tanda hubung.
 *
 * Tanda hubungnya DILEWATI kalau suku kata sebelumnya sudah berakhir dengan
 * tanda hubung — "anak-anak" dipenggal jadi ["a","nak-","a","nak"], dan
 * menambahkan satu lagi akan menghasilkan "a-nak--a-nak".
 *
 * Yang ditebalkan tetap huruf pertama KATA, bukan huruf pertama tiap suku kata:
 * penebalan itu penanda tempat mata mulai membaca satu kata, dan lima penanda
 * dalam satu kata tidak menandai apa pun.
 */
function renderSyllables(chunk: Extract<Chunk, { kind: 'word' }>, bodyBold: boolean) {
  return (
    <>
      {chunk.prefix}
      {chunk.syllables.map((syllable, index) => (
        <Text key={index}>
          {index > 0 && !chunk.syllables[index - 1].endsWith(HYPHEN) ? HYPHEN : null}
          {index === 0 ? renderWhole(syllable, bodyBold) : syllable}
        </Text>
      ))}
      {chunk.suffix}
    </>
  );
}
