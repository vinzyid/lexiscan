
<p align="center">
  <img src="./assets/images/icon.png" alt="LexiScan Logo" width="100" height="100" />
</p>

<h1 align="center">LexiScan</h1>

<p align="center">
  <strong>Aksesibilitas Membaca untuk Disleksia — OCR Cerdas + AI Text Simplification</strong>
  <br />
  <em>GEMASTIK XVIII — Kategori VIII (Pengembangan Perangkat Lunak)</em>
</p>

<p align="center">
  <img alt="React Native" src="https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB" />
  <img alt="Expo" src="https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img alt="NativeWind" src="https://img.shields.io/badge/NativeWind-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Laravel" src="https://img.shields.io/badge/Laravel-FF2D20?logo=laravel&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-4285F4?logo=google&logoColor=white" />
</p>

---

## 📖 Ikhtisar

**LexiScan** adalah aplikasi *mobile* inovatif yang dirancang sebagai "lensa aksesibilitas" untuk menjembatani kesenjangan pendidikan bagi penyandang disleksia. Melalui pendekatan ganda **Visual** dan **Kognitif**, LexiScan tidak hanya memperbaiki tampilan teks agar mudah dibaca (*Adaptive Typography*), tetapi juga menyederhanakan kalimat akademis yang kompleks tanpa menghilangkan makna aslinya (*AI Text Simplification*).

---

## ✨ Fitur Utama

| # | Fitur | Deskripsi |
|---|-------|-----------|
| 1 | 📸 **Smart OCR Scan** | Foto dokumen fisik → teks digital instan menggunakan *Google ML Kit* (OCR on-device). Dilengkapi koreksi typo berbasis AI. |
| 2 | 🔤 **Adaptive Typography Engine** | Restrukturisasi tipografi otomatis: font Atkinson Hyperlegible, spasi baris, ukuran huruf, **pemenggalan suku kata** ("Mi to kon dri a"), serta mode **Bicolor Words** & **Reading Ruler**. |
| 3 | 🧠 **AI Text Simplification** | Sederhanakan teks dalam 5 level (L1–L5) — dari teks asli hingga kalimat sangat pendek dengan kata sehari-hari — menggunakan *Large Language Model* tanpa mengubah fakta. |
| 4 | 🎯 **Focus Reading Mode** | Sorot satu paragraf aktif dan redupkan sisanya. Dilengkapi navigasi antar paragraf & *Reading Ruler* untuk menjaga konsentrasi baca. |
| 5 | 💡 **AI Explain This** | Pilih teks/kalimat yang sulit → Lexi jelaskan dengan 3 gaya: bahasa paling sederhana, analogi, atau contoh nyata. Panjang jawabannya menyesuaikan kemampuan membaca pengguna. |
| 6 | 🔊 **Text-to-Speech** | Setiap paragraf, jawaban Lexi, dan suku kata bisa dibacakan. Memakai mesin TTS bawaan perangkat lewat `expo-speech` — gratis tanpa batas, jalan offline, dan **tidak memakai kuota LLM**. |
| 7 | 👤 **Profil Kemampuan Membaca** | Dipilih saat mendaftar (didampingi guru atau orang tua). Tipografi, pemenggalan suku kata, suara, dan panjang jawaban AI menyesuaikan sendiri — dan semuanya tetap bisa dimatikan manual. |

---

## 🏗️ Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────┐
│                    MOBILE APP (Expo)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Camera  │  │  ML Kit  │  │  Reader  │  │  Settings    │ │
│  │  (Scanner)│  │  (OCR)   │  │  (Baca)  │  │  (Tipografi)│ │
│  └────┬─────┘  └──────────┘  └────┬─────┘  └──────────────┘ │
│       │                            │                          │
│       ▼                            ▼                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Zustand (Global State)                   │    │
│  └──────────────────────────────────────────────────────┘    │
│       │                                                       │
│       │ HTTP (fetch) — POST /api/*                           │
└───────┼───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                    BACKEND API (Laravel)                       │
│  ┌────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │  Simplify  │    │  Explain     │    │  Correct Typo     │  │
│  │  (/api)    │    │  (/api)      │    │  (/api)           │  │
│  └─────┬──────┘    └──────┬───────┘    └────────┬──────────┘  │
│        │                  │                      │             │
│        └──────────────────┼──────────────────────┘             │
│                           ▼                                    │
│              ┌────────────────────────┐                        │
│              │  AiTextService (PHP)   │                        │
│              └───────────┬────────────┘                        │
│                          │                                     │
│              ┌───────────▼────────────┐                        │
│              │  AI Provider           │                        │
│              │  (Gemini / Grok / OR)  │                        │
│              └────────────────────────┘                        │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Supabase PostgreSQL  │
              │   (Cloud Database)     │
              └────────────────────────┘
```

---

## 🛠️ Tech Stack

### 📱 Frontend (Mobile App — `mobile-app/`)

| Teknologi | Kegunaan |
|-----------|----------|
| **[React Native](https://reactnative.dev/)** + **[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)** | Kerangka utama aplikasi mobile |
| **[TypeScript](https://www.typescriptlang.org/)** | Type safety di seluruh frontend |
| **[Expo Router](https://docs.expo.dev/router/introduction/)** | *File-based routing* (tab navigasi) |
| **[NativeWind v4](https://www.nativewind.dev/)** | Utility-first styling (TailwindCSS untuk RN) |
| **[TailwindCSS](https://tailwindcss.com/)** (+ `tailwind.config.js`) | Desain utility-class |
| **[Zustand](https://github.com/pmndrs/zustand)** | Manajemen state global yang ringan |
| **[Lucide React Native](https://lucide.dev/)** | Ikon SVG modern, konsisten |
| **[expo-camera](https://docs.expo.dev/versions/v57.0.0/sdk/camera/)** | Antarmuka kamera untuk scan |
| **[expo-document-picker](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/)** | Upload gambar dari galeri/file manager |
| **[expo-dev-client](https://docs.expo.dev/develop/development-builds/introduction/)** | Development build untuk native module kustom |

### ⚙️ Backend (API Only — `backend-api/`)

| Teknologi | Kegunaan |
|-----------|----------|
| **[Laravel 13](https://laravel.com/)** | Framework API backend |
| **[PHP 8.3+](https://www.php.net/)** | Runtime bahasa backend |
| **[Laravel Sanctum](https://laravel.com/docs/sanctum)** | Token-based API authentication |
| **[Supabase PostgreSQL](https://supabase.com/)** | Database relasional di cloud |
| **[GuzzleHttp](https://docs.guzzlephp.org/)** | HTTP client untuk komunikasi dengan AI provider |

### 🧠 External AI Services

| Service | Peran | Status |
|---------|-------|--------|
| **[Google ML Kit](https://developers.google.com/ml-kit)** | OCR *on-device* (tanpa internet) | ✅ Terintegrasi |
| **[Gemini API](https://aistudio.google.com/)** | AI Simplification, Explain This, Correct Typo | ✅ **Aktif (default)** |
| **[OpenRouter](https://openrouter.ai/)** / **[xAI (Grok)](https://console.x.ai/)** | Alternatif AI provider (dapat dipilih via `.env`) | ✅ Didukung |

---

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** v22+
- **PHP** ^8.3
- **Composer** v2+
- **Expo CLI** (`npm install -g expo-cli`)
- Perangkat Android (fisik via kabel USB / emulator)
- Akses internet (untuk AI & database cloud)

### 1. Clone & Setup Backend (Laravel)

```bash
cd backend-api
cp .env.example .env

# Edit file .env — isi konfigurasi AI:
#   AI_PROVIDER=gemini
#   GEMINI_API_KEY=your_api_key

composer install
php artisan key:generate
php artisan serve --host=0.0.0.0
```
> Server berjalan di `http://localhost:8000`.

### 2. Setup Frontend (Mobile App)

```bash
cd mobile-app
npm install
npx expo run:android    # Install development build ke HP
```

> Jika belum memiliki development build, jalankan `npx expo start` lalu scan QR dengan **Expo Go** (terbatas — ML Kit tidak berfungsi di Expo Go).

### 3. Konfigurasi AI

Buka `backend-api/.env` dan atur AI provider:

```env
# ——— Pilih salah satu ———

# Opsi 1: Gemini (default — gratis di Google AI Studio)
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...

# Opsi 2: Grok (xAI)
AI_PROVIDER=grok
XAI_API_KEY=xai-...

# Opsi 3: OpenRouter (model gratis, lebih lambat)
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
```

### 4. Endpoint API yang Tersedia

| Method | Endpoint | Fungsi | Throttle |
|--------|----------|--------|----------|
| `POST` | `/api/simplify-text` | Sederhanakan teks (L2–L5) | 20/menit |
| `POST` | `/api/explain-word` | Jelaskan kata/kalimat dengan gaya tertentu | 20/menit |
| `POST` | `/api/correct-typo` | Koreksi typo hasil OCR | 20/menit |
| `GET` | `/api/ai/health` | Cek status provider AI | - |
| `POST` | `/api/auth/register` | Daftar akun + kemampuan membaca | 10/menit |
| `POST` | `/api/auth/login` | Masuk, membalas token Sanctum | 10/menit |
| `GET` | `/api/auth/me` | Profil akun (butuh token) | 60/menit |
| `POST` | `/api/auth/logout` | Cabut token yang sedang dipakai | 60/menit |
| `PATCH` | `/api/auth/preferences` | Simpan preferensi tampilan & suara ke akun | 60/menit |

`simplify-text` dan `explain-word` menerima field opsional `reading_level`
(`belum` / `mengeja` / `lancar`) yang menentukan seberapa pendek jawabannya.
Endpoint AI sengaja **tidak** menuntut token: fitur bacanya harus bisa dicoba
sebelum mendaftar.

---

## 📁 Struktur Proyek (Frontend)

```
mobile-app/
├── app/
│   └── (tabs)/
│       ├── index.tsx        # Dashboard (Beranda)
│       ├── scanner.tsx      # Halaman Scan OCR & Upload
│       ├── reader.tsx       # Halaman Baca + Simplify + Explain
│       └── _layout.tsx      # Konfigurasi tab navigasi
├── src/
│   ├── api/
│   │   └── ai.ts            # HTTP client ke backend AI
│   ├── components/
│   │   ├── explain-sheet.tsx    # Sheet AI Explain This
│   │   ├── typography-sheet.tsx # Sheet pengaturan tipografi
│   │   ├── word-sheet.tsx       # Sheet suku kata
│   │   ├── dyslexic-text.tsx    # Komponen teks dengan OpenDyslexic
│   │   └── ...
│   ├── store/
│   │   └── useStore.ts      # Zustand global state
│   ├── theme/
│   │   ├── palettes.ts      # Palet warna & tipe level
│   │   └── theme-provider.tsx
│   └── data/
│       └── sample-document.ts # Data contoh & tip
├── assets/
├── app.json
├── tailwind.config.js
└── package.json
```

---

## 🔮 Pengembangan Selanjutnya (Roadmap)

| Fitur | Keterangan |
|-------|-----------|
| 📂 **Upload & OCR PDF** | Ekstrak teks langsung dari file PDF |
| 🎥 **Live Camera Mode** | Ganti teks fisik dengan teks termodifikasi secara *real-time* (AR) |
| 🧠 **AI Mind Map** | Peta pikiran otomatis dari hasil scan |
| 📊 **Personal Vocabulary Builder** | Kosakata pribadi + riwayat penjelasan |
| 🌐 **Backend Auth** | Middleware Sanctum untuk keamanan publikasi |

---

## 👥 Pengembang

| Peran | Nama |
|-------|------|
| *Solo Full-Stack Developer* | **Rafi** |
| Frontend | React Native + Expo + NativeWind |
| Backend | Laravel + Supabase |
| AI Integration | Gemini / Grok / OpenRouter |
| UI/UX Implementation | OpenDyslexic + Adaptive Typography |

---

<p align="center">
  <sub>© 2026 Tim LexiScan — GEMASTIK XVIII Kategori VIII (Pengembangan Perangkat Lunak)</sub>
  <br />
  <sub>Dibangun dengan ❤️ untuk aksesibilitas pendidikan di Indonesia</sub>
</p>
