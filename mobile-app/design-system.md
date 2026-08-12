# LexiScan Design System

Sistem desain ini diturunkan langsung dari file Figma **"Final Desain"**. Semua
nilai di bawah diambil dari node aslinya, bukan perkiraan.

## 1. Typography

Dua keluarga font, dengan pembagian tugas yang tegas:

| Keluarga | Dipakai untuk | Berat yang dimuat |
| --- | --- | --- |
| **Fredoka** | Seluruh chrome antarmuka: judul, label, tombol, chip, navigasi | 300 / 400 / 500 / 600 / 700 |
| **Atkinson Hyperlegible** | Khusus teks bacaan & suku kata di Word Isolation | 400 / 700 |

Atkinson Hyperlegible dipilih karena huruf-huruf yang mudah tertukar (b/d, p/q,
I/l, 0/O) sengaja dibedakan bentuknya - inilah font aksesibilitas yang dipakai
mockup, menggantikan OpenDyslexic.

Tiap berat didaftarkan sebagai **family tersendiri**, bukan varian `fontWeight`.
Di Android, fontFamily kustom + fontWeight tanpa face terdaftar membuat React
Native mundur ke font sistem. Karena itu berat selalu disebut lewat class:

```
font-ui  font-ui-light  font-ui-medium  font-ui-semibold  font-ui-bold
font-read  font-read-bold
```

### Aturan teks bacaan

Diterapkan seragam oleh `DyslexicText` (`src/components/dyslexic-text.tsx`):

- **Line-height** minimal 1.85× untuk mencegah *visual crowding*.
- **Letter spacing** renggang, 0.06em (18px → 1.08px, persis nilai Figma).
- **Visual fixation:** hanya **huruf pertama** tiap kata yang memakai berat Bold,
  sisanya Regular. Ini pola `characterStyleOverrides` di Figma - bukan separuh
  kata. Aktif di preset Sedang & Berat saja.
- **Bicolor Words:** kata ganjil memakai `bicolorA`, kata genap `bicolorB`.

## 2. Preset Tipografi

Tiga preset di `TYPE_LEVELS` (`src/theme/palettes.ts`), sama seperti kartu di
layar Pengaturan:

| Preset | Font | Spasi (label kartu) | Line-height | Huruf pertama tebal |
| --- | --- | --- | --- | --- |
| Ringan | 16px | 2px | 1.85 | tidak |
| Sedang (default) | 18px | 5px | 2.10 | ya |
| Berat | 21px | 9px | 2.40 | ya |

`spacingLabel` hanyalah angka yang ditampilkan di chip "Spasi"; nilai
`letterSpacing` sebenarnya dihitung dari ukuran font.

## 3. Palet Warna

Figma menyediakan tiga baris tema penuh - Dark Mode, Warm Cream, Soft Green.
Dua tema sisanya (Kuning Lembut, Biru Pastel) hanya muncul di kartu pemilih tema,
sehingga `surface`-nya diturunkan memakai rumus yang sama.

| Tema | Latar | Kartu | Teks utama | Teks redup |
| --- | --- | --- | --- | --- |
| Krem Hangat (default) | `#fdf8f2` | `#ffffff` | `#241908` | `#a08050` |
| Kuning Lembut | `#fffbea` | `#fffdf5` | `#2e2400` | `#8b7520` |
| Biru Pastel | `#edf4fb` | `#f7fafd` | `#0c1e30` | `#3b5f7a` |
| Hijau Lembut | `#eef7f1` | `#f5fbf7` | `#0b2518` | `#2e6a42` |
| Mode Gelap | `#111122` | `#1c1e35` | `#e8e8f8` | `#7070a0` |

Aksen **identik di semua tema** - Figma memakai nilai yang persis sama di ketiga
baris, jadi hanya permukaan & teks yang berganti:

- Primary `#7c3aed`, primary-deep `#6d28d9`
- Warm `#f59e0b`, success `#10b981`

**Garis pemisah** selalu `textMain` @ 8%. Karena itu token `border` bernilai sama
dengan `textMain` dan **selalu dipakai dengan opacity** - `border-border/10`,
bukan `border-border` polos.

## 4. Gradien

Gradien tidak ikut berganti saat tema diubah. Semuanya ada di `GRADIENTS`
(`src/theme/palettes.ts`):

| Nama | Nilai |
| --- | --- |
| `hero` | `#4c1d95 → #5b21b6 (45%) → #1e40af` - banner dashboard |
| `readerHeader` | `#1e1b4b → #312e81 → #1e3a8a` - header layar Baca |
| `profileHeader` | `#1e1b4b → #312e81 → #0f172a` - kartu profil |
| `brand` | `#7c3aed → #ec4899 (50%) → #f59e0b` - Bicolor Words, strip Tip |
| `activePill` / `navPill` | `#7c3aed → #4f46e5` - segmen & tab aktif |
| `avatar` | `#7c3aed → #4338ca` |
| `profileAvatar` | `#7c3aed → #ec4899` |
| `ruler` | `#b45309 → #f59e0b` |
| `isolation` | `#0d9488 → #4f46e5` |
| `isolationSheet` | `#5b21b6 → #4338ca` |

Ubin ikon 52x52 tiap FeatureCard punya gradien & warna panahnya sendiri -
lihat `FEATURE_ACCENTS`.

`BACKDROP_WASHES` adalah empat sapuan radial sangat samar di latar tiap layar
(amber 4%, emerald 4%, indigo 5%, violet 7%). React Native tidak punya gradien
radial, jadi `ScreenBackdrop` menerjemahkannya jadi lingkaran SVG bertumpuk.

## 5. Tailwind (NativeWind) Configuration

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
(`124 58 237`) supaya utilitas opacity seperti `bg-primary/10` tetap bekerja.
Nilai default ada di `global.css`.

Untuk prop yang tidak menerima `className` - misal `color` pada ikon
`lucide-react-native` atau `colors` pada `LinearGradient` - pakai hook
`useThemeColors()`.

## 6. Ilustrasi & Hiasan

**`assets/figma/*.svg`** - aset asli hasil export dari file Figma, dipakai apa
adanya (bukan gambar ulang):

| Berkas | Node Figma | Dipakai di |
| --- | --- | --- |
| `lexi.svg` | `Lexi` (120x120) | banner dashboard, kartu Tentang, AI Explain |
| `illu-scan.svg` | `IlluScan` | FeatureCard "Smart OCR Scan", header layar Pindai |
| `illu-typo.svg` | `IlluTypo` | FeatureCard "Adaptive Typography" |
| `illu-simplify.svg` | `IlluSimplify` | FeatureCard "AI Simplify" |
| `illu-focus.svg` | `IlluFocus` | FeatureCard "Focus Mode" |
| `illu-explain.svg` | `IlluExplain` | FeatureCard "AI Explain This" |
| `art-ruler.svg` | `Icon` (90x56) | kartu "Reading Ruler" |
| `art-isolation.svg` | `Icon` (70x70) | kartu "Word Isolation" |
| `art-bicolor.svg` | `Icon` (322x48) | kartu "Bicolor Words" |

Berkas `.svg` di-resolve jadi komponen React oleh `react-native-svg-transformer`
(lihat `metro.config.js` dan `svg.d.ts`). Menyegarkan aset cukup dengan menimpa
berkasnya - kode di `src/components/illustrations.tsx` tidak perlu berubah.

**`src/components/figma-decor.tsx`** - hiasan yang berulang di banyak layar:
`Blob`, `Ring`, `HexDecor`, `Sparkle`, `WaveCut`, dan `ScreenBackdrop`. Data
path-nya diambil dari node Figma, tapi warna & opacity sengaja dibuat jadi prop
karena bentuk yang sama dipakai ulang dengan kepekatan berbeda-beda (mis. `Blob`
4% di banner, 8% di kartu inovasi) dan `WaveCut` harus sewarna latar tema aktif.

File key Figma: `xgDpKZRYYHBpsY7AJAkZhX` (file "Final Desain").
