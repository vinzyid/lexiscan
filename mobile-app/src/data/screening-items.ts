import type { ScreeningItem } from '../theme/screening';

/**
 * Butir contoh untuk Cek Awal Risiko Disleksia — versi dipandu pendamping.
 *
 * INI BARU CONTOH, BUKAN PERANGKAT YANG TERVALIDASI. Butir sungguhan untuk
 * skrining disleksia (kesadaran fonologis, kata non-kata, penamaan cepat)
 * disusun bersama psikolog atau guru PLB dan diuji dulu ke anak-anak sebelum
 * dipakai. Yang ada di sini gunanya HANYA membuktikan alurnya berjalan: apakah
 * arahannya bisa diikuti pendamping, apakah anak mau bersuara, dan apakah
 * hasilnya terasa membantu tanpa terasa menghakimi.
 *
 * KATA NON-KATA DI BAWAH MEMANG KATA YANG TIDAK ADA ARTINYA, DAN ITU SENGAJA.
 * Kalau anak disuruh membaca kata asli, ia bisa menebaknya dari ingatan atau
 * gambar, sehingga tidak ketahuan apakah ia benar-benar bisa membunyikan
 * hurufnya. Kata tanpa arti tidak bisa ditebak, jadi kesulitan bunyilah yang
 * terlihat — justru itu inti skrining disleksia. Tiap butirnya diberi `note`
 * supaya pendamping tidak bingung "kok katanya aneh".
 *
 * Bentuk katanya pun dibuat mengikuti pola bunyi Indonesia yang lazim
 * (konsonan-vokal, dua sampai tiga suku kata) supaya masih bisa dilafalkan
 * lidah anak Indonesia — bukan tumpukan konsonan yang asing.
 *
 * TIGA JENIS TUGAS, DARI YANG PALING BERBOBOT KE YANG PALING RINGAN:
 *   - nonword   : kata tanpa makna; paling menunjuk ke disleksia karena tidak
 *                 bisa ditebak dari konteks maupun ingatan kosakata.
 *   - syllable  : membunyikan kata sambil melepas/menambah suku kata; menguji
 *                 kesadaran bunyi.
 *   - naming    : menyebut cepat; menguji kelancaran mengambil nama benda.
 * Mengurutkan dari yang paling berat juga lebih ramah: anak yang lelah biasanya
 * masih sempat mengerjakan bagian awal yang justru paling informatif.
 */
export const SCREENING_ITEMS: ScreeningItem[] = [
  /* ── Kata non-kata ────────────────────────────────────────────────────── */
  {
    id: 'non-1',
    domain: 'nonword',
    instruction: 'Minta anak membunyikan kata ini seolah itu nama orang atau nama tempat.',
    trigger: 'malora',
    expect: 'Anak membunyikan "malora" sebagai rangkaian bunyi, bukan menebaknya jadi kata lain yang bermakna.',
    note: 'Kata ini memang bukan kata asli. Ini sengaja — supaya anak benar-benar membaca hurufnya, bukan menebak dari ingatan. Tidak apa-apa kalau bunyinya agak aneh.',
  },
  {
    id: 'non-2',
    domain: 'nonword',
    instruction: 'Minta anak membunyikan kata ini tanpa jeda, seolah itu nama temannya.',
    trigger: 'tugire',
    expect: 'Anak mencoba membunyikan seluruhnya, bukan berhenti di awal atau melompat ke kata yang dikenal.',
    note: 'Sekali lagi, ini bukan kata asli. Yang dilihat bukan benar-salahnya, tapi apakah anak mau dan bisa mencoba membunyikannya sampai habis.',
  },
  {
    id: 'non-3',
    domain: 'nonword',
    instruction: 'Minta anak membunyikan kata ini dua kali berturut-turut.',
    trigger: 'padumi',
    expect: 'Bunyinya tetap sama saat diulang — anak memegang rangkaian bunyi itu, bukan mengarang ulang.',
    note: 'Kata karangan lagi, dan itu memang tujuannya. Kalau anak mengulangnya dengan bunyi yang sama, artinya ia sedang memegang rangkaian bunyinya dengan baik.',
  },

  /* ── Kesadaran suku kata ──────────────────────────────────────────────── */
  {
    id: 'syl-1',
    domain: 'syllable',
    instruction: 'Ucapkan "matahari", lalu minta anak mengucapkannya kembali tanpa suku kata pertama.',
    trigger: 'matahari',
    expect: 'Anak mengucapkan "tahari" (menanggalkan "ma" di depan dengan sadar).',
  },
  {
    id: 'syl-2',
    domain: 'syllable',
    instruction: 'Ucapkan "sekolah", lalu minta anak mengucapkannya tanpa suku kata terakhir.',
    trigger: 'sekolah',
    expect: 'Anak mengucapkan "seko" (melepas "lah" di belakang).',
  },
  {
    id: 'syl-3',
    domain: 'syllable',
    instruction: 'Ucapkan "buku", lalu minta anak bertepuk sekali untuk tiap suku kata yang ia dengar.',
    trigger: 'buku',
    expect: 'Anak bertepuk dua kali (bu-ku).',
  },

  /* ── Penamaan cepat ───────────────────────────────────────────────────── */
  {
    id: 'nam-1',
    domain: 'naming',
    instruction: 'Tunjuk benda di sekitar yang biasa dikenal anak, lalu minta ia menyebut namanya secepat mungkin.',
    trigger: '',
    expect: 'Nama keluar lancar, tanpa jeda panjang atau lupa kata.',
  },
];
