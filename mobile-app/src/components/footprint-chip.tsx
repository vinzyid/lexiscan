import { Text, View } from 'react-native';
import { Leaf } from 'lucide-react-native';

import { useLocale, useT } from '../i18n';
import { useOCRStore } from '../store/useStore';
import { useThemeColors } from '../theme/theme-provider';
import { formatMass } from '../utils/footprint-format';

/**
 * Lencana kecil di bawah hasil AI: berapa jejak karbon permintaan barusan.
 *
 * Membaca permintaan TERAKHIR dari store, bukan menerimanya lewat prop, karena
 * yang mencatat adalah lapisan API — jadi tidak ada layar yang perlu meneruskan
 * angka ini turun ke bawah hanya untuk ditampilkan.
 *
 * Tiga keadaan yang sengaja dibedakan: dijawab dari simpanan (tidak ada model
 * yang berjalan), terhitung, dan tidak terdata. Yang terakhir tidak boleh
 * tampil sebagai "0 g" — itu klaim yang tidak dimiliki datanya.
 */
export function FootprintChip() {
  const t = useT();
  const locale = useLocale();
  const colors = useThemeColors();
  const footprint = useOCRStore((s) => s.lastFootprint);

  if (!footprint) {
    return null;
  }

  const label = footprint.cached
    ? t.footprint.chipCached
    : footprint.known
      ? t.footprint.chipSpent(formatMass(footprint.co2e_g, locale))
      : t.footprint.chipUnknown;

  return (
    <View
      className="mt-3 flex-row items-center self-start rounded-full px-2.5 py-1"
      accessibilityRole="text"
      style={{ gap: 6, backgroundColor: colors.surfaceAlt }}>
      <Leaf size={12} color={colors.textMuted} />
      <Text className="font-ui-medium text-[11px] text-text-muted">{label}</Text>
    </View>
  );
}
