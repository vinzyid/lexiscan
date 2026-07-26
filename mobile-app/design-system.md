# LexiScan Design System

Sistem desain ini dibuat khusus untuk aksesibilitas kognitif penyandang disleksia berdasarkan penelitian tipografi dan warna.

## 1. Typography

- **Font Family Utama:** `OpenDyslexic` (Standar disleksia)
- **Karakteristik:** Bentuk huruf lebih tebal di bagian bawah untuk mencegah huruf terlihat terbalik atau melayang.
- **Line Height (Jarak Baris):** Minimal `1.5` (150%) untuk mencegah *visual crowding*.
- **Letter Spacing (Jarak Huruf):** Sedikit lebih renggang dibandingkan teks standar.

## 2. Color Palette (Ramah Disleksia)

Kontras yang terlalu tinggi (Hitam murni `#000000` di atas Putih murni `#FFFFFF`) dapat menyebabkan silau atau efek "huruf bergerak" pada penyandang disleksia. Kita menggunakan kontras yang dilembutkan (*soft contrast*).

### Backgrounds
- **Primary Background:** `#FDFBF7` (Off-white / Krem muda, mengurangi silau)
- **Secondary Background:** `#F4F1EA` (Krem sedikit lebih gelap untuk kartu/kontainer)
- **Highlight (Focus Mode):** `#FEF3C7` (Kuning pastel pucat untuk menyoroti kalimat aktif)

### Text Colors
- **Primary Text:** `#2D2D2D` (Abu-abu sangat gelap, BUKAN hitam murni)
- **Secondary Text:** `#555555` (Abu-abu medium untuk teks kurang penting)

### Accents (Interactive Elements)
- **Primary Accent (Button):** `#7148FC` (Ungu, sesuai mockup v1)
- **Success / Easy Read Mode:** `#22C55E` (Hijau lembut)
- **Warm Accent (label & tip):** `#F59E0B`

## 3. Tema yang Bisa Dipilih Pengguna

Latar putih terang menyebabkan kelelahan mata, jadi pengguna memilih sendiri
palet di layar Pengaturan. Lima palet — Krem Hangat (default), Kuning Lembut,
Biru Pastel, Hijau Lembut, dan Mode Gelap — didefinisikan di
`src/theme/palettes.ts`.

## 4. Tailwind (NativeWind) Configuration

Token warna tidak di-hardcode di `tailwind.config.js`, melainkan menunjuk ke CSS
variable supaya bisa berganti saat runtime:

```javascript
colors: {
  background: 'rgb(var(--color-background) / <alpha-value>)',
  surface: 'rgb(var(--color-surface) / <alpha-value>)',
  primary: 'rgb(var(--color-primary) / <alpha-value>)',
  // ...lihat tailwind.config.js untuk daftar lengkap
}
```

Nilai variabelnya disuntikkan `ThemeProvider` (`src/theme/theme-provider.tsx`)
lewat `vars()` dari NativeWind. Formatnya channel RGB tanpa fungsi
(`113 72 252`) supaya utilitas opacity seperti `bg-primary/10` tetap bekerja.
Nilai default ada di `global.css`.

Untuk prop yang tidak menerima `className` — misal `color` pada ikon
`lucide-react-native` — pakai hook `useThemeColors()` yang mengembalikan string
`rgb(...)` siap pakai.

## 5. Preset Tipografi

Tiga preset di `TYPE_LEVELS` (`src/theme/palettes.ts`). Angka spasi adalah
pengali line-height, bukan piksel:

| Preset | Ukuran | Line-height | Penebalan awal kata |
| --- | --- | --- | --- |
| Ringan | 16px | 1.85 | tidak |
| Sedang (default) | 18px | 2.10 | ya |
| Berat | 21px | 2.40 | ya |

Semua paragraf bacaan dirender lewat `DyslexicText`
(`src/components/dyslexic-text.tsx`) supaya aturan di atas berlaku seragam,
sekaligus jadi tempat fitur Bicolor Words dan tap-untuk-Word-Isolation.
