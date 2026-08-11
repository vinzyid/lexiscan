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

  speech: {
    playLabel: 'Bacakan teks ini',
    stopLabel: 'Hentikan suara',
    readAloud: 'Bacakan',
    readParagraph: (index: number) => `Bacakan paragraf ${index}`,
  },

  /**
   * Tingkat kemampuan membaca. `example` sengaja memperlihatkan bentuk teks
   * yang akan didapat, bukan menjelaskannya — yang memilih tingkat ini bisa
   * jadi belum bisa membaca keterangannya sendiri.
   */
  readingLevels: {
    belum: {
      name: 'Belum bisa membaca',
      desc: 'Huruf paling besar, kata dipecah per suku kata, dan semuanya dibacakan suara.',
      example: 'Ma-ta-ha-ri',
    },
    mengeja: {
      name: 'Masih mengeja sedikit-sedikit',
      desc: 'Kata dipecah per suku kata, suara tersedia kalau dibutuhkan.',
      example: 'Ma-ta-ha-ri',
    },
    lancar: {
      name: 'Sudah lancar membaca',
      desc: 'Teks tampil seperti biasa, tanpa suara.',
      example: 'Matahari',
    },
  },

  /**
   * Jenjang sekolah di langkah 2 pendaftaran.
   *
   * `age` ditulis apa adanya dan bukan patokan kaku — gunanya membantu pengguna
   * mengenali barisnya sendiri saat namanya ("SD Kelas 4–6") belum tentu
   * terbaca.
   */
  schoolLevels: {
    sd1: { name: 'SD Kelas 1–3', age: 'Usia 6–9 tahun' },
    sd2: { name: 'SD Kelas 4–6', age: 'Usia 9–12 tahun' },
    smp: { name: 'SMP', age: 'Usia 12–15 tahun' },
    sma: { name: 'SMA', age: 'Usia 15–18 tahun' },
    umum: { name: 'Umum', age: 'Semua usia' },
  },

  auth: {
    /* ── Wizard 3 langkah (Figma: AuthScreen) ───────────────────────────── */
    appTagline: 'Teman belajar ramah disleksia',

    /** Judul kecil di bawah titik langkah, mis. "LANGKAH 1 / 3 — HALO!". */
    stepLabel: (step: number, total: number, name: string) =>
      `LANGKAH ${step} / ${total} — ${name}`,
    stepHalo: 'HALO!',
    stepJenjang: 'JENJANG',
    stepMembaca: 'MEMBACA',

    tabNew: 'Pengguna Baru',
    tabExisting: 'Sudah Punya Akun',

    /* Langkah 1 */
    askNameTitle: 'Siapa namamu?',
    askNameSubtitle: 'Kenalkan dirimu ke Lexi!',
    namePlaceholderLong: 'Ketuk di sini untuk menulis namamu…',
    welcomeBackTitle: 'Selamat datang kembali!',
    welcomeBackSubtitle: 'Masukkan namamu untuk melanjutkan.',

    /* Langkah 2 */
    askSchoolTitle: 'Kamu sekolah di mana?',
    askSchoolSubtitle: 'Lexi akan menyesuaikan teks untukmu.',

    /* Langkah 3 */
    askReadingTitle: 'Membaca teks itu…',
    askReadingSubtitle: 'Lexi akan menyiapkan bantuan yang tepat buatmu.',

    /**
     * Kalimat tiap kartu langkah 3. Sengaja ditulis sebagai kalimat orang
     * pertama ("Aku…"), bukan label — yang memilihnya sedang menyatakan sesuatu
     * tentang dirinya, dan bahasa seperti ini jauh lebih mudah dikenali daripada
     * istilah "kemampuan membaca rendah".
     */
    readingChoice: {
      lancar: {
        title: 'Aku bisa membaca sendiri',
        desc: 'Hanya butuh tampilan yang lebih nyaman dan ramah.',
      },
      mengeja: {
        title: 'Aku masih mengeja sedikit-sedikit',
        desc: 'Kata dipecah per suku kata, suara siap kalau dibutuhkan.',
      },
      belum: {
        title: 'Aku butuh bantuan suara',
        desc: 'Semua tombol & teks akan dibacakan untukku secara otomatis.',
      },
    },

    /** Muncul hanya saat "butuh bantuan suara" dipilih. */
    voiceAutoNote: 'Fitur suara akan aktif otomatis. Ketuk apa saja dan Lexi akan membacakannya!',

    next: 'Lanjut',
    back: 'Kembali',
    finish: 'Mulai Belajar!',

    /* Masuk */
    loginTitle: 'Selamat datang kembali',
    loginSubtitle: 'Masuk untuk melanjutkan membaca',
    loginAction: 'Masuk',
    loginLoading: 'Sedang masuk…',
    noAccount: 'Belum punya akun?',
    toRegister: 'Daftar di sini',

    /* Daftar */
    registerTitle: 'Buat akun LexiScan',
    registerSubtitle: 'Supaya tampilannya bisa menyesuaikan denganmu',
    registerAction: 'Daftar',
    registerLoading: 'Sedang mendaftar…',
    haveAccount: 'Sudah punya akun?',
    toLogin: 'Masuk di sini',

    /*
     * Ditempatkan paling atas di layar daftar. Bukan basa-basi: tingkat
     * kemampuan membaca yang dipilih di sini menentukan ukuran huruf dan
     * suara di seluruh aplikasi, dan yang paling tahu jawabannya adalah orang
     * yang mendampinginya.
     */
    companionBanner: 'Isi bersama guru atau orang tua ya',

    nameLabel: 'Nama kamu',
    namePlaceholder: 'Contoh: Rafi',
    usernameLabel: 'Nama pengguna',
    usernamePlaceholder: 'Contoh: rafi123',
    usernameHint: 'Huruf dan angka saja, tanpa spasi',
    passwordLabel: 'Kata sandi',
    passwordPlaceholder: 'Minimal 6 huruf',
    showPassword: 'Lihat kata sandi',
    hidePassword: 'Sembunyikan kata sandi',

    readingLevelLabel: 'Sekarang sudah bisa membaca?',
    readingLevelHint: 'Bisa diubah kapan saja lewat Atur.',

    /* Melewati pendaftaran */
    skip: 'Lihat-lihat dulu',
    skipHint: 'Kamu bisa mendaftar nanti dari Atur.',

    /* Galat */
    fillEverything: 'Semua kolom perlu diisi dulu ya.',
    unexpectedError: 'Terjadi kesalahan tak terduga. Coba lagi.',

    /*
     * Satu pesan per langkah, bukan satu pesan umum. Tombol "Lanjut" sengaja
     * tidak dibuat mati saat isian belum lengkap: tombol mati tidak memberi
     * tahu apa yang kurang, dan yang memakainya belum tentu bisa menyimpulkan
     * sendiri sebabnya.
     */
    needName: 'Tulis namamu dulu ya.',
    needSchool: 'Pilih dulu salah satu ya.',
    needReading: 'Pilih dulu yang paling cocok denganmu ya.',
  },

  dashboard: {
    /*
     * Dua bentuk sapaan. Yang bernama dipakai kalau sudah masuk; yang tanpa
     * nama untuk yang belum mendaftar — bukan nama karangan seperti dulu,
     * karena menyapa orang dengan nama orang lain lebih buruk daripada tidak
     * menyapa sama sekali.
     */
    greeting: 'Halo, Pembaca!',
    greetingNamed: (name: string) => `Halo, ${name}!`,
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
    /** Memperagakan dirinya sendiri, seperti chip "A-B Su-ku" di Figma. */
    syllables: 'Su-ku',
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
    /*
     * Lencana kecil di kartu profil bagi yang belum masuk. Yang sudah punya
     * akun menampilkan tingkat kemampuan membacanya di tempat ini, karena
     * itulah yang benar-benar menentukan tampilan aplikasinya.
     */
    role: 'Pelajar',

    /* ── Tata letak ProfileScreen di Figma ─────────────────────────────── */
    editAction: 'Edit',
    displayEyebrow: 'Tampilan',
    displayTitle: 'Tema & Aksesibilitas',
    prefsEyebrow: 'Preferensi',
    prefsTitle: 'Notifikasi & Suara',
    profileTitle: 'Profil & Keamanan',
    rowTheme: 'Tema Warna',
    rowDyslexia: 'Mode Disleksia',
    rowDailyTip: 'Tips Belajar Harian',
    dailyTipOn: 'Aktif · Setiap pagi',
    dailyTipOff: 'Nonaktif',
    /** Muncul kalau izin notifikasi ditolak permanen — sakelarnya kembali mati. */
    dailyTipDenied: 'Izinkan notifikasi dulu lewat setelan HP',
    rowVoice: 'Suara & Umpan Balik',
    rowLanguage: 'Bahasa',
    rowReading: 'Kemampuan Membaca',
    rowFootprint: 'Jejak Karbon',
    rowFootprintDesc: 'Energi & emisi dari permintaan AI',
    rowName: 'Ubah Nama',
    rowHelp: 'Bantuan & Dukungan',
    rowHelpDesc: 'FAQ, lapor masalah',
    nameSheetTitle: 'Ubah Nama',
    nameSave: 'Simpan',
    logoutTitle: 'Keluar dari Akun?',
    logoutBody:
      'Kamu perlu login kembali untuk menggunakan LexiScan. Progres tersimpan aman.',
    cancel: 'Batal',
    logoutConfirm: 'Keluar',
    footer: (version: string) => `LexiScan · v${version} · Untuk semua pelajar`,
    languageEyebrow: 'Bahasa',
    languageTitle: 'Bahasa aplikasi',
    languageNote: 'Ikut mengubah bahasa jawaban AI.',
    themeEyebrow: 'Tema warna',
    themeTitle: 'Ramah untuk mata disleksia',
    typeEyebrow: 'Ukuran tulisan',
    typeTitle: 'Dipakai di semua bacaan',
    fontChip: 'Font',
    spacingChip: 'Spasi',

    readingEyebrow: 'Kemampuan membaca',
    readingTitle: 'Sumber semua penyesuaian',
    readingNote:
      'Mengubah ini memasang ulang ukuran huruf, pemenggalan suku kata, dan suara. Sesudahnya kamu tetap bebas mengatur satu per satu di bawah.',

    voiceEyebrow: 'Suara',
    voiceTitle: 'Bacakan teks dengan suara',
    ttsTitle: 'Tombol suara',
    ttsDesc: 'Tampilkan tombol bacakan di setiap paragraf dan jawaban Lexi.',
    autoPlayTitle: 'Bacakan otomatis',
    autoPlayDesc: 'Paragraf yang sedang dibaca langsung berbunyi tanpa ditekan.',
    speakLabelsTitle: 'Bacakan nama tombol',
    speakLabelsDesc: 'Tiap tombol menyebut namanya sendiri saat ditekan, jadi kamu tahu fungsinya tanpa perlu membaca.',
    syllableTitle: 'Pisahkan suku kata',
    syllableDesc: 'Tulis kata sebagai "Ma-ta-ha-ri" supaya lebih mudah dieja.',
    voiceOfflineNote: 'Suara memakai mesin bawaan HP — tetap berbunyi tanpa internet.',

    /* Pemilih suara */
    voicePickerTitle: 'Pilih suara',
    voiceLoading: 'Sedang mencari suara di HP kamu…',

    /*
     * Dinomori, bukan memakai nama aslinya. Nama dari mesin TTS berbentuk
     * "id-id-x-idd-local" — tidak terbaca oleh siapa pun, apalagi oleh
     * penggunanya. Nomornya cuma pembeda; yang menentukan pilihan adalah
     * bunyinya saat diketuk.
     */
    voiceName: (index: number) => `Suara ${index}`,
    voiceAuto: 'Otomatis',
    voiceAutoDesc: 'Biar aplikasi memilihkan yang paling jernih.',
    voiceEnhanced: 'Kualitas tinggi',
    voiceNetwork: 'Paling jernih — butuh internet',
    voiceStandard: 'Kualitas standar',
    rateTitle: 'Kecepatan suara',
    rates: { slow: 'Pelan', medium: 'Sedang', normal: 'Normal' },
    switchOn: 'nyala',
    switchOff: 'mati',
    voicePickerHint: 'Ketuk untuk mendengarkan. Pilih yang paling enak didengar.',
    voiceSample: 'Matahari bersinar cerah. Kelinci kecil melompat di taman.',
    voiceOpenSettings: 'Buka setelan suara HP',
    voiceNone:
      'HP ini belum punya suara untuk bahasa tersebut. Buka Setelan HP → Aksesibilitas → Teks ke ucapan untuk memasangnya.',

    /* Akun */
    accountEyebrow: 'Akun',
    accountTitle: 'Profil kamu',
    guestName: 'Belum masuk',
    guestSubtitle: 'Daftar supaya tampilannya menyesuaikan denganmu',
    loginAction: 'Masuk atau daftar',
    logoutAction: 'Keluar',
    logoutLabel: 'Keluar dari akun ini',

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
    syllableHint: 'Ketuk satu suku kata untuk mendengarnya.',
    syllableLabel: (syllable: string) => `Bunyikan suku kata ${syllable}`,
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

  /*
   * Namanya mengikuti Figma: sebutan yang membesarkan hati, bukan label yang
   * mengurutkan orang dari 'ringan' ke 'berat'. Yang memilih 'Petualang' tidak
   * sedang mengaku paling parah, ia sedang memilih bantuan paling lengkap.
   */
  typeLevels: {
    ringan: {
      name: 'Pejuang Muda',
      desc: 'Huruf sedikit lebih besar, spasi nyaman untuk belajar membaca',
    },
    sedang: {
      name: 'Penjelajah',
      desc: 'Spasi lebar & awal kata ditebalkan agar mudah diikuti',
    },
    berat: {
      name: 'Petualang',
      desc: 'Aksesibilitas penuh untuk pembaca yang membutuhkan bantuan ekstra',
    },
  },

  simplifyLevels: {
    L1: { name: 'Teks Asli', short: 'Asli', tagline: 'Bahasa akademik sesuai sumber' },
    L2: { name: 'Sedikit Lebih Mudah', short: 'Mudah', tagline: 'Kalimat panjang dipersingkat' },
    L3: { name: 'Bahasa Santai', short: 'Santai', tagline: 'Bahasa sehari-hari, tetap akurat' },
    L4: { name: 'Poin Singkat', short: 'Poin', tagline: 'Format singkat dan padat' },
    // Dulu 'Setara tingkat SD'. Menyebut jenjang sekolah untuk menggambarkan
    // kemampuan seseorang itu merendahkan, dan tidak memberi tahu apa pun
    // tentang bentuk teksnya — yang justru ingin diketahui pengguna.
    L5: { name: 'Paling Mudah', short: 'Dasar', tagline: 'Kalimat sangat pendek, kata sehari-hari' },
  },

  /*
   * Jawaban di sini adalah contoh kurasi untuk dokumen demo, dipakai saat
   * aplikasi dipakai tanpa server. Panjangnya sengaja dipotong jadi satu
   * paragraf pendek agar sama dengan batas yang sekarang berlaku di prompt
   * backend — kalau demo memperlihatkan tiga paragraf sementara jawaban
   * sungguhan hanya satu, demonya berbohong.
   *
   * Emoji dibuang: jawaban ini ikut dibacakan suara, dan mesin TTS melafalkan
   * namanya di tengah kalimat.
   */
  explainStyles: {
    sederhana: {
      name: 'Bahasa paling sederhana',
      desc: 'Kata-kata yang paling mudah',
      answer: [
        'Mitokondria itu bagian kecil di dalam sel. Tugasnya membuat energi supaya tubuhmu bisa bergerak.',
      ],
    },
    analogi: {
      name: 'Analogi sederhana',
      desc: 'Perumpamaan yang mudah dipahami',
      answer: [
        'Bayangkan sel itu kota kecil. Mitokondria adalah pembangkit listriknya.',
      ],
    },
    nyata: {
      name: 'Contoh kehidupan nyata',
      desc: 'Dari pengalaman sehari-hari',
      answer: [
        'Saat kamu lari lalu ngos-ngosan, mitokondria di ototmu sedang bekerja keras membuat energi.',
      ],
    },
  },

  sampleDoc: {
    title: 'Contoh bacaan',
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
