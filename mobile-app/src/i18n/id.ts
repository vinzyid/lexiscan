/**
 * Sumber kebenaran seluruh teks aplikasi. Bentuknya dipakai TypeScript untuk
 * memeriksa `en.ts` — kunci yang lupa diterjemahkan gagal saat compile.
 */
export const id = {
  languageName: 'Bahasa Indonesia',
  locale: 'id-ID',

  splash: {
    title: 'LexiScan',
    tagline: 'Membaca jadi lebih mudah',
    subTagline: 'untuk semua pelajar',
    chips: ['Pindai Teks', 'Sederhanakan AI', 'Mode Fokus', 'Atur Tulisan'],
    footer: 'DIRANCANG UNTUK DISLEKSIA',
    loadingLabel: 'Membuka LexiScan',
    skipHint: 'Ketuk untuk lanjut',
  },

  onboarding: {
    skip: 'Lewati',
    next: 'Lanjut',
    start: 'Mulai!',
    stepOf: (step: number, total: number) => `Langkah ${step} dari ${total}`,
    slides: [
      {
        badge: 'Pindai Cerdas',
        title: 'Pindai Cerdas & Cepat',
        desc: 'Ubah teks dari buku atau dokumen jadi teks digital dalam hitungan detik.',
      },
      {
        badge: 'Baca Menyesuaikan',
        title: 'Baca dengan Lebih Nyaman',
        desc: 'Font khusus disleksia, penggaris baca, dan mode fokus satu paragraf penuh.',
      },
      {
        badge: 'Ditenagai AI',
        title: 'AI Siap Membantu Kamu',
        desc: 'Lexi menyederhanakan teks sulit jadi mudah dipahami dalam 5 tingkat AI.',
      },
    ],
  },

  tabs: {
    home: 'Beranda',
    scan: 'Pindai',
    read: 'Baca',
    settings: 'Atur',
  },

  common: {
    close: 'Tutup',
    tryAgain: 'Coba Lagi',
    free: 'Gratis',
    askLexi: 'Tanya Lexi',
  },

  dashboard: {
    greeting: 'Hei, Rama!',
    statusBadge: 'Siap belajar',
    heroTitle: 'Siap Petualangan\nhari ini?',
    scanButton: 'Pindai',
    scanButtonLabel: 'Pindai dokumen',
    readButton: 'Baca',
    readButtonLabel: 'Buka layar baca',
    featuresEyebrow: '5 Fitur Utama',
    featuresTitle: 'Semua yang kamu butuhkan',
    innovationEyebrow: 'Inovasi Eksklusif',
    innovationTitle: 'Khusus untuk disleksia',
    tipOfDay: 'Tip hari ini',
    features: {
      scan: { label: 'Pindai Dokumen', desc: 'Foto buku atau catatan, jadi teks digital' },
      typography: { label: 'Atur Tulisan', desc: 'Ukuran huruf dan jarak baris yang nyaman' },
      simplify: {
        label: 'Sederhanakan Teks',
        desc: '5 tingkat, dari bahasa asli sampai paling mudah',
      },
      focus: { label: 'Mode Fokus', desc: 'Baca satu paragraf tanpa gangguan' },
      explain: { label: 'Tanya Lexi', desc: '3 gaya penjelasan dari Lexi si asisten' },
    },
    innovations: {
      bicolor: {
        title: 'Kata Dua Warna',
        desc: 'Warna berganti tiap kata supaya matamu tidak kehilangan baris',
        label: 'Kata Dua Warna, buka layar baca',
      },
      ruler: { title: 'Penggaris Baca', desc: 'Seret garisnya dengan jari' },
      isolation: { title: 'Sorot Satu Kata', desc: 'Ketuk kata saat membaca' },
    },
  },

  reader: {
    nowReading: 'Sedang dibaca',
    scanResult: 'Hasil Pindaian',
    scannedTextTitle: 'Teks hasil pindaian',
    changeTypeLabel: 'Ubah ukuran tulisan, sekarang',
    aiBadge: 'AI',
    levelLabel: 'Tingkat',
    focus: 'Fokus',
    ruler: 'Penggaris',
    bicolor: 'Dua Warna',
    swipeHint: 'Geser layar untuk ganti paragraf',
    prevParagraph: 'Paragraf sebelumnya',
    nextParagraph: 'Paragraf berikutnya',
    paragraphOf: (index: number, total: number) => `Paragraf ${index} dari ${total}`,
    simplifying: (levelName: string) => `Lexi sedang menyederhanakan ke tingkat ${levelName}…`,
    emptyText: 'Belum ada teks untuk dibaca.',
    sampleTitle: 'Ini contoh bacaan',
    sampleDesc: 'Ketuk di sini untuk memindai buku atau catatanmu sendiri.',
    sampleLabel: 'Pindai dokumenmu sendiri',
    retryLink: 'Ketuk untuk coba lagi.',
    retryLabel: 'Coba sederhanakan lagi',
    rulerHintLead: 'Seret garis kuning dengan jarimu, atau\npakai tombol ini. Baris ',
    rulerLineOf: (line: number, total: number) => `${line} dari ${total}`,
    rulerUp: 'Penggaris naik satu baris',
    rulerDown: 'Penggaris turun satu baris',
    explainButton: 'Jelaskan Teks Ini',
    explainButtonLabel: 'Minta Lexi menjelaskan paragraf ini',
    tapWordHint: 'Ketuk kata untuk melihat suku kata',
    unexpectedError: 'Terjadi kesalahan tak terduga.',
  },

  scanner: {
    badge: 'Pindai Cerdas',
    title: 'Pindai Dokumen',
    subtitle: 'Foto buku atau catatanmu, ubah jadi teks yang mudah dibaca',
    camera: 'Kamera',
    upload: 'Unggah File',
    aimAtDocument: 'Arahkan ke dokumen',
    fileTypes: 'PDF, JPG, atau PNG',
    tipsTitle: 'Tips agar hasil pindai bagus',
    tips: [
      'Pastikan cahaya cukup terang',
      'Semua teks masuk dalam bingkai',
      'Sistem otomatis perbaiki kemiringan',
      'Hasil tampil dengan font disleksia',
    ],
    processTitle: 'Proses otomatis',
    processSteps: [
      'Mendeteksi orientasi dokumen',
      'Memperbaiki kemiringan halaman',
      'Meningkatkan kualitas gambar',
      'Mengenali karakter teks (OCR)',
      'Analisis teks selesai!',
    ],
    detected: 'Teks terdeteksi',
    success: 'Berhasil!',
    tidyingUp: 'Merapikan teks…',
    paragraphCount: (count: number) => `${count} paragraf`,
    autoFont: 'Font otomatis',
    aiReady: 'Siap AI',
    openAndRead: 'Buka dan Baca',
    openAndReadLabel: 'Buka hasil pindaian di layar baca',
    scanAnother: '← Pindai dokumen lain',
    startScan: 'Mulai Pindai',
    startScanLabel: 'Mulai memindai',
    pickImage: 'Pilih Gambar',
    pickImageLabel: 'Pilih gambar',
    processing: 'Memproses…',
    permissionText: 'LexiScan butuh izin kamera untuk memindai dokumen fisikmu.',
    permissionButton: 'Berikan Izin Kamera',
    noTextTitle: 'Tidak ada teks',
    noTextCamera: 'Coba dekatkan kamera dan pastikan cahaya cukup terang.',
    noTextUpload: 'Gambar ini tampaknya tidak memiliki teks atau terlalu buram.',
    scanFailTitle: 'Gagal memindai',
    uploadFailTitle: 'Gagal membaca gambar',
    genericError: 'Terjadi kesalahan.',
    cameraNoImage: 'Kamera tidak mengembalikan gambar.',
    typoWarning: 'Gagal memperbaiki typo via AI, memakai teks asli dari OCR.',
  },

  settings: {
    role: 'Pelajar',
    name: 'Rama Putra',
    school: 'Kelas 10 · SMA Negeri 1',
    profileTags: ['Gratis', 'Riset Ilmiah', 'Inklusif'],
    languageEyebrow: 'Bahasa',
    languageTitle: 'Bahasa aplikasi',
    languageNote: 'Ikut mengubah bahasa jawaban AI.',
    themeEyebrow: 'Tema warna',
    themeTitle: 'Ramah untuk mata disleksia',
    typeEyebrow: 'Ukuran tulisan',
    typeTitle: 'Dipakai di semua bacaan',
    fontChip: 'Font',
    spacingChip: 'Spasi',
    aboutTagline: 'Asisten baca untuk disleksia',
    aboutTags: ['v1.0', 'Gratis', 'Inklusif'],
    aboutBody:
      'LexiScan menggunakan prinsip aksesibilitas berbasis riset ilmiah untuk menciptakan pengalaman membaca yang nyaman dan efektif bagi semua orang.',
  },

  feedback: {
    eyebrow: 'Masukan',
    title: 'Ceritakan pengalamanmu',
    intro: 'Laporanmu dibaca langsung oleh tim LexiScan.',
    typeFeedback: 'Masukan',
    typeOcrFailure: 'Pindai gagal',
    placeholderFeedback: 'Apa yang bisa kami perbaiki? Tulis sejelas yang kamu bisa.',
    placeholderOcrFailure: 'Halaman seperti apa yang gagal terbaca? Tulis sebisamu.',
    charCount: (count: number, max: number) => `${count}/${max}`,
    attachTitle: 'Lampirkan teks pindaian terakhir',
    attachDesc: 'Membantu kami menemukan sebabnya. Hanya terkirim kalau kamu menyalakannya.',
    attachEmpty: 'Belum ada hasil pindaian yang bisa dilampirkan.',
    privacyNote: 'Terkirim tanpa nama — yang ikut hanya penanda perangkat acak.',
    submit: 'Kirim Laporan',
    submitLabel: 'Kirim laporan ke tim LexiScan',
    sending: 'Mengirim…',
    tooShort: 'Tulis pesannya dulu, minimal 3 huruf.',
    sentTitle: 'Terima kasih!',
    sentBody: 'Laporanmu sudah kami terima.',
    sendAnother: 'Kirim laporan lain',
    unexpectedError: 'Terjadi kesalahan tak terduga. Coba lagi.',
  },

  footprint: {
    eyebrow: 'Dampak lingkungan',
    title: 'Jejak karbon AI',
    empty: 'Belum ada permintaan AI. Coba sederhanakan sebuah teks dulu.',
    spentLabel: 'Emisi terpakai',
    avoidedLabel: 'Emisi dihindari',
    requestsLabel: 'Permintaan AI',
    energyLabel: 'Energi',
    cachedShare: (cached: number, total: number, percent: number) =>
      `${cached} dari ${total} permintaan dijawab dari simpanan, tanpa menyalakan model lagi (${percent}%).`,
    equivalent: (percent: string) => `Setara mengisi daya ponsel sekitar ${percent}%.`,
    // Chip kecil di samping hasil AI.
    chipCached: 'Dari simpanan · 0 g',
    chipSpent: (value: string) => `≈ ${value} CO₂e`,
    chipUnknown: 'Jejak karbon tak terdata',
    methodNote:
      'Angka ini taksiran, bukan pengukuran: dihitung dari jumlah token yang dilaporkan penyedia AI, dikalikan konsumsi energi per token dan intensitas karbon listrik pusat datanya.',
    resetLabel: 'Nolkan hitungan',
  },

  typography: {
    title: 'Atur Tulisan',
    subtitle: 'Sesuaikan teks untuk kenyamananmu',
    closeLabel: 'Tutup pengaturan tulisan',
    preview: 'Membaca jadi lebih mudah.',
    previewSettings: 'Membaca jadi lebih nyaman.',
    bicolorTitle: 'Kata Dua Warna',
    bicolorDesc: 'Warna berganti tiap kata supaya matamu tidak kehilangan baris',
    rulerTitle: 'Penggaris Baca',
    rulerDesc: 'Garis penanda baris yang bisa kamu seret dengan jari',
  },

  wordSheet: {
    badge: 'Satu kata saja',
    syllableCount: (count: number) => `${count} suku kata`,
    askLexiLabel: (word: string) => `Minta Lexi menjelaskan kata ${word}`,
  },

  explain: {
    title: 'Tanya Lexi',
    fromLexi: 'Penjelasan dari Lexi',
    about: (term: string) => `Tentang: ${term}`,
    backLabel: 'Kembali ke pilihan gaya',
    thinking: 'Lexi sedang berpikir…',
    cantAnswer: 'Aduh, aku belum bisa menjawab.',
    retryLabel: 'Coba tanya lagi',
    otherStyle: '← Coba Gaya Lain',
    otherStyleLabel: 'Coba gaya penjelasan lain',
    styleLabel: (name: string) => `Jelaskan dengan gaya ${name}`,
    chooseStyle: 'Mau Lexi jelasin gimana?',
    unexpectedError: 'Terjadi kesalahan tak terduga. Coba lagi.',
  },

  api: {
    noBaseUrl:
      'Alamat backend belum ditanam di aplikasi ini. Set EXPO_PUBLIC_API_URL saat build (di eas.json untuk build EAS), lalu build ulang.',
    timeout: 'Server terlalu lama merespons. Coba lagi sebentar.',
    unreachable:
      'Tidak bisa terhubung ke server. Pastikan backend berjalan dan HP satu jaringan dengan laptop.',
    httpError: (status: number) => `Permintaan gagal (HTTP ${status}).`,
    noSimplifyResult: 'Server tidak mengembalikan hasil penyederhanaan.',
    noExplainResult: 'Server tidak mengembalikan penjelasan.',
    noCorrectionResult: 'Server tidak mengembalikan teks hasil koreksi.',
  },

  themes: {
    krem: 'Krem Hangat',
    kuning: 'Kuning Lembut',
    biru: 'Biru Pastel',
    hijau: 'Hijau Lembut',
    gelap: 'Mode Gelap',
  },

  typeLevels: {
    ringan: { name: 'Ringan', desc: 'Ukuran & spasi sedikit lebih besar' },
    sedang: { name: 'Sedang', desc: 'Spasi lebar, awal kata ditebalkan' },
    berat: { name: 'Berat', desc: 'Aksesibilitas maksimal' },
  },

  simplifyLevels: {
    L1: { name: 'Teks Asli', short: 'Asli', tagline: 'Bahasa akademik sesuai sumber' },
    L2: { name: 'Sedikit Lebih Mudah', short: 'Mudah', tagline: 'Kalimat panjang dipersingkat' },
    L3: { name: 'Bahasa Santai', short: 'Santai', tagline: 'Bahasa sehari-hari, tetap akurat' },
    L4: { name: 'Poin Singkat', short: 'Poin', tagline: 'Format singkat dan padat' },
    L5: { name: 'Paling Mudah', short: 'Dasar', tagline: 'Setara tingkat SD' },
  },

  explainStyles: {
    anak10: {
      name: 'Seperti usia 10 tahun',
      desc: 'Penjelasan paling sederhana',
      answer: [
        'Di dalam tubuh kamu ada banyak sekali sel kecil. Dan di dalam tiap sel ada sesuatu namanya mitokondria.',
        "Mitokondria itu tugasnya cuma satu: bikin energi! Energinya namanya ATP — kayak koin yang dipakai sel untuk 'membeli' semua aktivitas.",
        "Kalau nggak ada mitokondria, sel kamu kehabisan koin dan nggak bisa ngapa-ngapain. Makanya mitokondria sering disebut 'pembangkit listrik sel'. ⚡",
      ],
    },
    analogi: {
      name: 'Analogi sederhana',
      desc: 'Perumpamaan yang mudah dipahami',
      answer: [
        'Bayangkan sel itu sebuah kota kecil. Kota butuh listrik supaya lampu, kereta, dan pabriknya jalan.',
        'Mitokondria adalah pembangkit listriknya. Ia membakar "bahan bakar" dari makanan yang kamu makan, lalu mengubahnya jadi listrik bernama ATP.',
        'Makin sibuk kotanya, makin banyak pembangkit yang dibutuhkan. Itu sebabnya sel otot punya mitokondria jauh lebih banyak daripada sel lain. 🏙️',
      ],
    },
    nyata: {
      name: 'Contoh kehidupan nyata',
      desc: 'Dari pengalaman sehari-hari',
      answer: [
        'Waktu kamu lari-larian dan tiba-tiba ngos-ngosan, itu karena sel ototmu butuh banyak energi cepat.',
        'Mitokondria di dalam sel ototmu langsung kerja keras mengubah gula dari makananmu menjadi ATP.',
        'Itulah juga kenapa tidur cukup dan makan bergizi penting — itu bahan bakar untuk mitokondria kamu! 😴🍎',
      ],
    },
  },

  sampleDoc: {
    title: 'Biologi Kelas 10 — Bab 3',
    sectionTitle: 'Mitokondria — Pembangkit Energi Sel',
    term: 'Mitokondria',
    paragraphs: [
      'Mitokondria adalah organel sel yang berfungsi menghasilkan energi dalam bentuk ATP melalui proses respirasi seluler.',
      'Organel ini memiliki struktur membran ganda — membran luar yang halus dan membran dalam yang berlipat-lipat membentuk kristae.',
      'Matriks mitokondria mengandung enzim-enzim yang diperlukan dalam siklus Krebs, serta DNA mitokondria yang memungkinkan organel ini bereproduksi secara semi-independen.',
    ],
  },

  dailyTips: [
    'Cahaya hangat lebih nyaman dari layar putih terang.',
    'Di layar Baca, geser ke kiri atau kanan untuk pindah paragraf.',
    'Nyalakan Penggaris, lalu seret garisnya dengan jarimu mengikuti baris.',
    'Dua Warna membantu matamu melacak posisi dalam kalimat.',
    'Kalau satu kalimat terasa berat, naikkan level penyederhanaan satu tingkat.',
    'Mode Fokus meredupkan paragraf lain supaya matamu tidak melompat.',
    'Ketuk kata yang sulit — LexiScan akan memecahnya jadi suku kata.',
  ],
};

/** Sengaja tanpa `as const`: tipenya perlu melebar jadi `string`, strukturnya tetap terkunci. */
export type Translation = typeof id;
