# LexiScan

> **Aplikasi Restrukturisasi Tipografi dan AI Text Simplification Berbasis OCR & LLM untuk Aksesibilitas Kognitif Penyandang Disleksia.**

## 📌 Ikhtisar Proyek

LexiScan adalah aplikasi *mobile* inovatif yang dirancang sebagai "lensa aksesibilitas" untuk menjembatani kesenjangan pendidikan bagi penyandang disleksia. Melalui pendekatan ganda (**Visual** dan **Kognitif**), LexiScan tidak hanya memperbaiki tampilan visual teks agar mudah dibaca, tetapi juga menyederhanakan substansi kalimat majemuk akademis yang kompleks tanpa menghilangkan makna aslinya.

## ✨ Fitur Utama (Fokus MVP GEMASTIK - 1-Week Sprint)

Pengembangan saat ini dibatasi secara ketat pada 5 fitur inovatif utama untuk memastikan performa yang matang, stabil, dan bebas *bug* saat demonstrasi:

1.  📷 **Smart OCR Scan:** Mengubah teks pada media fisik menjadi teks digital secara instan menggunakan teknologi *Optical Character Recognition* (OCR) *on-device*[cite: 2].
2.  👁️ **Adaptive Typography Engine:** Melakukan restrukturisasi tipografi (Algoritma Fiksasi Visual), mengubah *font* ke standar disleksia (OpenDyslexic), serta mengatur jarak antarhuruf dan baris secara otomatis[cite: 2].
3.  🧠 **AI Text Simplification:** Memanfaatkan *Large Language Model* (LLM) untuk menyederhanakan tingkat kesulitan bacaan dari kalimat kompleks menjadi format yang lebih ringan (Easy Read) tanpa mengubah substansi asli[cite: 2].
4.  🎯 **Focus Reading Mode:** Membantu pengguna menjaga konsentrasi dengan menyorot satu kalimat/paragraf yang sedang dibaca dan meredupkan (*blur*) sisa teks lainnya di layar[cite: 2].
5.  💡 **AI Explain This:** Fitur penjelasan pintar berbasis LLM yang memungkinkan pengguna menyeleksi kata atau kalimat sulit untuk mendapatkan penjelasan menggunakan analogi sehari-hari yang mudah dipahami[cite: 2].

## 🚀 Rencana Pengembangan Masa Depan (Future Work)

Sebagai komitmen pengembangan produk jangka panjang (*roadmap*), LexiScan dirancang untuk memiliki fitur tingkat lanjut di masa depan (TIDAK diimplementasikan pada fase MVP ini):
*   Personalized Reading Profile & Vocabulary Builder[cite: 2].
*   Camera Live Mode (AR Text Replacement)[cite: 2].
*   AI Mind Map & Smart Learning Companion[cite: 2].
*   Reading Fatigue Detector[cite: 2].

## 🛠️ Arsitektur Teknologi & Tech Stack

Sistem LexiScan dibangun menggunakan *stack* Full-Stack modern yang tangguh (*robust*), *type-safe*, dan berorientasi pada kecepatan pengembangan MVP. Lingkungan sistem dijalankan secara lokal (localhost) untuk fase kompetisi ini.

### Frontend Layer (Mobile App)
*   **Framework:** React Native + Expo + TypeScript.
*   **UI/Styling:** NativeWind v4 + React Native Reusables (Desain UI minimalis ramah disleksia).
*   **State & Fetching:** Zustand & TanStack Query (React Query) untuk manajemen status global dan *caching* data.

### Backend Layer (API Only)
*   **Framework:** Laravel 12 (API Only).
*   **Database:** PostgreSQL (Diinstal lokal via `brew install postgresql@18`).
*   **Authentication:** Laravel Sanctum (Token-based API Auth).

### External Services & Integrations
*   **OCR Engine:** Google ML Kit (Pemrosesan *on-device*).
*   **AI Engine:** Gemini API (Diakses melalui Backend Laravel).

## 👥 Pengembang Utama

*   **Rafi** - *Solo Full-Stack Developer (Frontend, Backend, AI Integration, UI/UX Implementation)*

---
© 2026 Tim LexiScan. Submitted for GEMASTIK XVIII Category VIII - Software Development.