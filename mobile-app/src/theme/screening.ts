/**
 * Struktur data untuk Cek Awal Risiko Disleksia.
 *
 * DIPANDU PENDAMPING, BUKAN DIKERJAKAN ANAK SENDIRI. Orang tua atau guru yang
 * membaca arahannya, meminta anak bersuara, lalu menandai hasilnya. Ini bukan
 * pilihan gaya: disleksia paling terlihat saat anak MENGUCAPKAN bunyi, bukan
 * saat menekan tombol pilihan. Skrining fonologis yang sah selalu melibatkan
 * telinga manusia yang mendengar anak berbicara.
 *
 * KARENA ITU TIDAK ADA KUNCI JAWABAN DAN TIDAK ADA SKOR. Yang dicatat hanya
 * seberapa lancar anak menjawab — "belum bisa / ragu / lancar" — karena aplikasi
 * ini menyaring tanda lalu mengarahkan ke tenaga ahli, bukan menilai. Kalau
 * suatu saat muncul keinginan menambahkan skor, hentikan dulu: begitu ada angka,
 * aplikasi mulai mengklaim, dan itu di luar batasnya.
 */

export type ScreeningDomain = 'syllable' | 'nonword' | 'naming';

/** Seberapa lancar anak menjawab, menurut pengamatan pendamping. */
export type MarkerLevel = 'lancar' | 'ragu' | 'belum';

/** Nama domain yang tampil di layar hasil sebagai "tanda yang muncul". */
export const SCREENING_DOMAINS: ScreeningDomain[] = ['syllable', 'nonword', 'naming'];

/**
 * Satu butir yang dicoba anak, didampingi.
 *
 * Tidak ada `choices` dan tidak ada `markerIndex` seperti tadi: anak tidak
 * menekan pilihan jawaban, ia bersuara. Pendamping yang menandai seberapa
 * lancar jawabannya.
 */
export type ScreeningItem = {
  id: string;
  domain: ScreeningDomain;
  /**
   * Kalimat yang diminta pendamping ucapkan/mintakan ke anak, mis. "Minta anak
   * membunyikan kata ini tanpa suku kata terakhirnya."
   */
  instruction: string;
  /**
   * Kata pemicu yang ditampilkan (dan bisa dibacakan) untuk anak, mis.
   * "matahari". Ditulis apa adanya supaya TTS melafalkannya sebagai satu kata.
   */
  trigger: string;
  /**
   * Contoh arah untuk pendamping tentang apa yang diharapkan dari anak, mis.
   * "…mengucapkan 'hari'." Bukan kunci nilai — hanya penjelas supaya pendamping
   * tahu butir ini menguji apa.
   */
  expect: string;

  /**
   * Catatan tambahan untuk pendamping, dipakai di butir yang bisa bikin bingung.
   *
   * Terutama kata non-kata: tanpa penjelasan, pendamping wajar bertanya-tanya
   * "kok katanya aneh, anak saya salah apa?". Catatan ini menjawabnya sebelum
   * pertanyaan itu muncul.
   */
  note?: string;
};

export type ScreeningObservation = {
  id: string;
  /** Pernyataan yang dicentang pendamping kalau perilakunya terlihat. */
  label: string;
};

/**
 * Tanda yang TIDAK bisa diuji lewat butir terpandu, hanya bisa diamati pendamping
 * selama anak membaca sehari-hari. Usia sekolah biasanya yang paling melihat ini,
 * bukan kuis sesaat.
 */
export const SCREENING_OBSERVATIONS: ScreeningObservation[] = [
  { id: 'reversal', label: 'Sering terbalik menulis atau membaca huruf seperti b/d, p/q' },
  { id: 'spelling', label: 'Ejaan tulisannya banyak tertukar walau sudah sering dilatih' },
  { id: 'slow-read', label: 'Membaca jauh lebih lambat dan ragu dibanding teman sebayanya' },
  { id: 'avoid', label: 'Menghindari kegiatan membaca atau menulis' },
  { id: 'tired', label: 'Cepat lelah atau mengeluh pusing saat membaca' },
  { id: 'sequence', label: 'Sering tertukar urutan, mis. membaca "nama" jadi "mana"' },
  { id: 'spell-aloud', label: 'Sulit mengeja kata dengan bersuara' },
  { id: 'guessing', label: 'Sering menebak kata dari gambar atau konteks, bukan membacanya' },
];
