/**
 * Dokumen contoh yang dipakai mockup v1 (Biologi Kelas 10 – Bab 3).
 * Lima level di bawah adalah hasil "AI Simplification" L1–L5; sampai
 * backend penyederhanaan terhubung, level-level ini dipakai apa adanya
 * dan teks hasil OCR menggantikan level L1.
 */
export type SimplifyLevelId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export type SimplifyLevel = {
  id: SimplifyLevelId;
  name: string;
  tagline: string;
  paragraphs: string[];
};

export const DOC_TITLE = 'Biologi Kelas 10 — Bab 3';
export const DOC_SECTION = 'MITOKONDRIA — PEMBANGKIT ENERGI SEL';

export const SIMPLIFY_LEVELS: SimplifyLevel[] = [
  {
    id: 'L1',
    name: 'Teks Asli',
    tagline: 'Bahasa akademik sesuai sumber',
    paragraphs: [
      'Mitokondria adalah organel sel yang berfungsi menghasilkan energi dalam bentuk ATP melalui proses respirasi seluler.',
      'Organel ini memiliki struktur membran ganda — membran luar yang halus dan membran dalam yang berlipat-lipat membentuk kristae.',
      'Matriks mitokondria mengandung enzim-enzim yang diperlukan dalam siklus Krebs, serta DNA mitokondria yang memungkinkan organel ini bereproduksi secara semi-independen.',
    ],
  },
  {
    id: 'L2',
    name: 'Sedikit Lebih Mudah',
    tagline: 'Kalimat panjang dipersingkat',
    paragraphs: [
      'Mitokondria adalah bagian kecil dalam sel yang bertugas membuat energi.',
      'Energi yang dihasilkan berbentuk molekul bernama ATP — ini dipakai sel untuk semua aktivitasnya.',
      'Mitokondria punya dua lapisan membran dan berisi enzim-enzim penting untuk mengubah makanan menjadi energi.',
    ],
  },
  {
    id: 'L3',
    name: 'Bahasa Santai',
    tagline: 'Bahasa sehari-hari, tetap akurat',
    paragraphs: [
      'Mitokondria itu seperti pembangkit listrik di dalam sel kita.',
      'Tugasnya adalah membuat energi yang disebut ATP — energi ini dipakai sel untuk melakukan semua aktivitasnya.',
      'Semakin aktif kita bergerak, semakin keras mitokondria bekerja untuk menyediakan energi.',
    ],
  },
  {
    id: 'L4',
    name: 'Easy Read',
    tagline: 'Format singkat dan padat',
    paragraphs: [
      'Mitokondria = pembangkit listrik sel.',
      'Tugasnya: mengubah makanan → energi (ATP).',
      'Tanpa mitokondria → sel tidak punya energi → tubuh tidak bisa bekerja.',
    ],
  },
  {
    id: 'L5',
    name: 'Paling Mudah',
    tagline: 'Setara tingkat SD',
    paragraphs: [
      'Mitokondria itu bagian kecil di dalam sel tubuhmu.',
      'Kerjanya seperti baterai — ia membuat energi biar kamu bisa bergerak dan berpikir.',
      'Tanpa mitokondria, sel kamu nggak bisa kerja sama sekali.',
    ],
  },
];

export const getSimplifyLevel = (id: SimplifyLevelId): SimplifyLevel =>
  SIMPLIFY_LEVELS.find((l) => l.id === id) ?? SIMPLIFY_LEVELS[0];

/** Tiga gaya penjelasan di layar "AI Explain This". */
export type ExplainStyleId = 'anak10' | 'analogi' | 'nyata';

export type ExplainStyle = {
  id: ExplainStyleId;
  emoji: string;
  name: string;
  desc: string;
  answer: string[];
};

export const EXPLAIN_STYLES: ExplainStyle[] = [
  {
    id: 'anak10',
    emoji: '🧒',
    name: 'Seperti usia 10 tahun',
    desc: 'Penjelasan paling sederhana',
    answer: [
      'Di dalam tubuh kamu ada banyak sekali sel kecil. Dan di dalam tiap sel ada sesuatu namanya mitokondria.',
      "Mitokondria itu tugasnya cuma satu: bikin energi! Energinya namanya ATP — kayak koin yang dipakai sel untuk 'membeli' semua aktivitas.",
      "Kalau nggak ada mitokondria, sel kamu kehabisan koin dan nggak bisa ngapa-ngapain. Makanya mitokondria sering disebut 'pembangkit listrik sel'. ⚡",
    ],
  },
  {
    id: 'analogi',
    emoji: '🎯',
    name: 'Analogi sederhana',
    desc: 'Perumpamaan yang mudah dipahami',
    answer: [
      'Bayangkan sel itu sebuah kota kecil. Kota butuh listrik supaya lampu, kereta, dan pabriknya jalan.',
      'Mitokondria adalah pembangkit listriknya. Ia membakar "bahan bakar" dari makanan yang kamu makan, lalu mengubahnya jadi listrik bernama ATP.',
      'Makin sibuk kotanya, makin banyak pembangkit yang dibutuhkan. Itu sebabnya sel otot punya mitokondria jauh lebih banyak daripada sel lain. 🏙️',
    ],
  },
  {
    id: 'nyata',
    emoji: '🌍',
    name: 'Contoh kehidupan nyata',
    desc: 'Dari pengalaman sehari-hari',
    answer: [
      'Waktu kamu lari-larian dan tiba-tiba ngos-ngosan, itu karena sel ototmu butuh banyak energi cepat.',
      'Mitokondria di dalam sel ototmu langsung kerja keras mengubah gula dari makananmu menjadi ATP.',
      'Itulah juga kenapa tidur cukup dan makan bergizi penting — itu bahan bakar untuk mitokondria kamu! 😴🍎',
    ],
  },
];

export const getExplainStyle = (id: ExplainStyleId): ExplainStyle =>
  EXPLAIN_STYLES.find((s) => s.id === id) ?? EXPLAIN_STYLES[0];

/** Ceklis "Preprocessing Otomatis" di layar hasil Smart OCR Scan. */
export const PREPROCESSING_STEPS = [
  'Mendeteksi orientasi dokumen',
  'Memperbaiki kemiringan halaman',
  'Meningkatkan kualitas gambar',
  'Mengenali karakter teks (OCR)',
  'Analisis teks selesai!',
];

export const SCAN_TIPS = [
  'Pastikan cahaya cukup terang',
  'Semua teks masuk dalam bingkai',
  'Sistem otomatis perbaiki kemiringan',
  'Hasil tampil dengan font disleksia',
];

/** Tip harian di dashboard — dirotasi berdasarkan tanggal, bukan acak. */
export const DAILY_TIPS = [
  'Cahaya hangat lebih nyaman dari layar putih terang.',
  'Gunakan jari untuk mengikuti baris yang sedang kamu baca.',
  'Bicolor Words membantu matamu melacak posisi dalam kalimat.',
  'Kalau satu kalimat terasa berat, naikkan level penyederhanaan satu tingkat.',
  'Mode Fokus meredupkan paragraf lain supaya matamu tidak melompat.',
  'Ketuk kata yang sulit — LexiScan akan memecahnya jadi suku kata.',
];
