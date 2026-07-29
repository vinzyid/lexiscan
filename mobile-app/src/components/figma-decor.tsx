import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { BACKDROP_WASHES } from '../theme/palettes';

/**
 * Hiasan yang berulang di seluruh layar Figma: gumpalan, cincin, heksagon,
 * kilau, dan potongan gelombang di kaki banner. Semuanya putih transparan di
 * atas gradien, jadi tidak ikut berganti saat palet diubah.
 *
 * Data path-nya diambil langsung dari node Figma, tapi warna & opacity tetap
 * jadi prop karena bentuk yang sama dipakai ulang dengan kepekatan berbeda-beda
 * (mis. Blob 4% di banner, 8% di kartu inovasi).
 */

/** "Blob" — gumpalan putih samar, biasanya melewati tepi kartu. */
export function Blob({
  size,
  opacity = 0.06,
  style,
}: {
  size: number;
  opacity?: number;
  style?: React.ComponentProps<typeof View>['style'];
}) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 110 110">
        <Path
          d="M79.475 13.035C86.57 16.225 92.125 23.265 95.755 31.02C99.385 38.775 101.035 46.86 100.76 54.835C100.485 62.81 98.285 70.62 94.215 77.22C90.145 83.82 84.205 89.155 77.165 93.005C70.125 96.855 62.04 99.22 54.615 99.825C47.19 100.43 39.38 99.22 32.34 96.03C25.3 92.785 19.03 87.56 14.905 80.85C10.78 74.14 8.8 65.945 8.745 54.945C8.745 43.945 10.615 29.92 16.94 24.31C23.265 18.7 34.045 21.56 42.46 19.415C50.875 17.27 57.585 10.12 64.46 9.02C71.335 7.92 72.38 9.845 79.475 13.035Z"
          fill="#ffffff"
          fillOpacity={opacity}
        />
      </Svg>
    </View>
  );
}

/** "Ring" — tiga lingkaran sepusat dengan garis putih 10%. */
export function Ring({
  size,
  style,
}: {
  size: number;
  style?: React.ComponentProps<typeof View>['style'];
}) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 110 110">
        {/* `fill="none"` wajib — tanpa itu SVG mengisi lingkaran dengan hitam. */}
        <Circle cx="55" cy="55" r="49.5" fill="none" stroke="#ffffff" strokeOpacity={0.1} strokeWidth={1.2} />
        <Circle cx="55" cy="55" r="35" fill="none" stroke="#ffffff" strokeOpacity={0.1} strokeWidth={1} />
        <Circle cx="55" cy="55" r="22" fill="none" stroke="#ffffff" strokeOpacity={0.1} strokeWidth={0.8} />
      </Svg>
    </View>
  );
}

/** "HexDecor" — heksagon bergaris, muncul di banner & header profil. */
export function HexDecor({
  size,
  opacity = 0.12,
  style,
}: {
  size: number;
  opacity?: number;
  style?: React.ComponentProps<typeof View>['style'];
}) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size * (31.1719 / 36)} viewBox="0 0 36 31.1719">
        <Path
          d="M18 1.99974L33.9979 8.99882V26.9965L18 29.1722L2.0021 26.9965V8.99882L18 1.99974Z"
          stroke="#ffffff"
          strokeOpacity={opacity}
          strokeWidth={1.4998}
          fill="none"
        />
      </Svg>
    </View>
  );
}

/** "Sparkle" — bintang empat sudut, taburan di atas gradien. */
export function Sparkle({
  size,
  opacity = 0.55,
  style,
}: {
  size: number;
  opacity?: number;
  style?: React.ComponentProps<typeof View>['style'];
}) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 10.1287 10.1287">
        <Path
          d="M5.06437 0L6.07725 4.0515L10.1287 5.06437L6.07725 6.07725L5.06437 10.1287L4.0515 6.07725L0 5.06437L4.0515 4.0515L5.06437 0Z"
          fill="#ffffff"
          fillOpacity={opacity}
        />
      </Svg>
    </View>
  );
}

/**
 * "WaveCut" — gelombang sewarna latar yang menutup kaki banner, memberi kesan
 * banner menyatu dengan halaman.
 */
export function WaveCut({ width, color }: { width: number; color: string }) {
  return (
    <View pointerEvents="none" style={{ width, height: 28 }}>
      <Svg width={width} height={28} viewBox="0 0 358 28" preserveAspectRatio="none">
        <Path
          d="M0 14C59.337 2.1326 118.674 25.8674 179 14C239.326 2.1326 298.663 21.9116 358 10.0442V27.8453H0V14Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

/**
 * Empat sapuan warna sangat samar di latar tiap layar. Figma memakai gradien
 * radial; React Native tidak punya padanannya, jadi diterjemahkan jadi
 * lingkaran besar ber-opacity rendah di sudut-sudut layar.
 */
export function ScreenBackdrop() {
  const [amber, emerald, indigo, violet] = BACKDROP_WASHES;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Wash {...amber} size={420} style={{ top: -160, left: -140 }} />
      <Wash {...emerald} size={380} style={{ top: 180, right: -170 }} />
      <Wash {...indigo} size={460} style={{ bottom: 40, left: -200 }} />
      <Wash {...violet} size={360} style={{ bottom: -140, right: -120 }} />
    </View>
  );
}

function Wash({
  color,
  opacity,
  size,
  style,
}: {
  color: string;
  opacity: number;
  size: number;
  style: React.ComponentProps<typeof View>['style'];
}) {
  return (
    <View style={[{ position: 'absolute' }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Beberapa lingkaran bertumpuk meniru peluruhan halus gradien radial. */}
        <Circle cx="50" cy="50" r="50" fill={color} fillOpacity={opacity * 0.45} />
        <Circle cx="50" cy="50" r="34" fill={color} fillOpacity={opacity * 0.6} />
        <Circle cx="50" cy="50" r="18" fill={color} fillOpacity={opacity} />
      </Svg>
    </View>
  );
}
