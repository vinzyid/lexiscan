# LexiScan Mobile

Aplikasi Android LexiScan (Expo SDK 57, expo-router, NativeWind). Gambaran lengkap
proyek, fitur, dan backend ada di [`../readme.md`](../readme.md); keputusan desain
ada di [`design-system.md`](design-system.md).

## Menjalankan

```bash
npm install
cp .env.example .env    # isi alamat backend dan kunci API
npx expo start
```

OCR memakai Google ML Kit (modul native), jadi aplikasi harus dijalankan lewat
development build atau APK, bukan Expo Go.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npx expo start` | Server pengembangan |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Cek tipe TypeScript |
