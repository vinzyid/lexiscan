# LexiScan MVP Task Tracker (7-Day Sprint - SOLO DEV HACKATHON)

**PERINGATAN UNTUK AI AGENT:** Waktu pengembangan hanya 7 hari oleh SATU orang developer (Solo Dev). Hindari over-engineering. Fokus mutlak pada 5 fungsionalitas utama MVP. Kerjakan tugas secara berurutan sesuai urutan hari.

## Day 1: System Foundation (Boilerplate & Backend Setup)
- [ ] Inisialisasi proyek Laravel 12 (API Only) untuk Backend.
- [ ] Setup PostgreSQL lokal (via `brew install postgresql@18`), buat database `lexiscan_db`, dan jalankan migrasi dasar.
- [ ] Setup Laravel Sanctum untuk autentikasi API.
- [ ] Inisialisasi proyek React Native (Expo + TypeScript) untuk Frontend.
- [ ] Konfigurasi NativeWind v4, buat file `design-system.md` (tema warna ramah disleksia), dan *install* *font* OpenDyslexic.

## Day 2: Core Frontend UI & OCR Integration
- [ ] Buat kerangka UI utama: `ScannerScreen` dan `ReaderScreen` dengan komponen dasar (Button, Header) sesuai *mockup* desain.
- [ ] Integrasikan library `@react-native-ml-kit/text-recognition` di `ScannerScreen`.
- [ ] Pastikan kamera bisa memindai gambar dan mengekstrak teks asli (*raw text*) secara lokal tanpa koneksi internet.
- [ ] Simpan teks hasil OCR ke dalam Zustand (Global State).

## Day 3: Typography Logic & AI Backend Service
- [ ] **Frontend:** Buat utilitas `applyVisualFixation(text)` yang membaca teks dari Zustand dan menebalkan awal kata, serta mengatur *line-spacing* dinamis di `ReaderScreen`.
- [ ] **Backend:** Konfigurasi kredensial Gemini API di `.env` Laravel.
- [ ] **Backend:** Buat `GeminiService` di Laravel untuk mengatur *prompt engineering* JSON.
- [ ] **Backend:** Selesaikan *endpoint* `POST /api/simplify-text` untuk fitur AI Text Simplification (Mode Easy Read).

## Day 4: Wiring It All Together (Frontend-Backend Integration)
- [ ] **Frontend:** Setup Axios interceptor dan TanStack Query (React Query) di Expo.
- [ ] **Frontend:** Hubungkan `ReaderScreen` dengan *endpoint* `simplify-text` menggunakan TanStack Query.
- [ ] **Frontend:** Buat *toggle switch* di UI untuk berpindah antara "Teks Asli" dan "Teks Easy Read".
- [ ] **Backend:** Selesaikan *endpoint* kedua: `POST /api/explain-word` untuk fitur AI Explain This.

## Day 5: Focus Mode & AI Explain This UI
- [ ] **Frontend:** Buat logika interaksi untuk "AI Explain This". Saat pengguna menyorot kata, tembak *endpoint* `explain-word` dan tampilkan responsnya di *Bottom Sheet Modal*.
- [ ] **Frontend:** Implementasikan *Focus Reading Mode*. Buat logika di UI untuk memecah teks per paragraf, jadikan paragraf aktif terang (`opacity-100`), dan sisanya buram/redup (`opacity-30`, `blur`).

## Day 6: Bug Bash & Edge Cases (ZERO BUG POLICY)
- [ ] Hentikan pembuatan fitur baru. Fokus pengujian mandiri (*self-QA*).
- [ ] Uji kualitas OCR: Coba *scan* foto yang agak buram, pastikan aplikasi menampilkan *error message* yang ramah (tidak *crash*).
- [ ] Uji API Gemini: Pastikan teks panjang tidak menyebabkan *timeout* (atur batas *timeout* di Laravel/Axios).
- [ ] Pastikan responsivitas UI aman dan *font* OpenDyslexic dimuat dengan benar di perangkat fisik/emulator.

## Day 7: Final Polish & Demo Preparation
- [ ] Lakukan uji coba alur penuh dari awal (*Scan* -> Restrukturisasi -> Simplifikasi -> Penjelasan Kata) menggunakan *backend* yang berjalan di `localhost`.
- [ ] Siapkan rekaman *screencast* aplikasi berjalan dengan mulus tanpa *bug* sebagai material cadangan saat presentasi GEMASTIK.
- [ ] Code freeze (Kunci kode, jangan ada perubahan lagi).