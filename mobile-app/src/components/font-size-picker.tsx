import { Text, View } from 'react-native';
import { Minus, Plus, RotateCcw, type LucideIcon } from 'lucide-react-native';

import { useT } from '../i18n';
import { useOCRStore } from '../store/useStore';
import { getTypeLevel } from '../theme/palettes';
import { useThemeColors } from '../theme/theme-provider';
import { FONT_SIZES, useTypeLevel } from '../theme/use-type-level';
import { DyslexicText } from './dyslexic-text';
import { PressableScale } from './pressable-scale';

/**
 * Pengatur ukuran huruf teks bacaan: tombol perkecil, angkanya, tombol
 * perbesar, lalu pratinjau hidup.
 *
 * Tombol bertingkat, bukan slider. Slider bawaan React Native sudah lama
 * dikeluarkan dari intinya dan penggantinya modul native, yang membuat fitur
 * ini tidak bisa dikirim lewat pembaruan OTA. Tombol juga lebih mudah dipakai
 * anak yang motorik halusnya belum mantap: satu ketukan selalu satu langkah,
 * tidak ada yang terlewat karena jarinya tergelincir.
 */
export function FontSizePicker() {
  const t = useT();
  const colors = useThemeColors();
  const typeLevelId = useOCRStore((s) => s.typeLevelId);
  const customSize = useOCRStore((s) => s.fontSize);
  const setFontSize = useOCRStore((s) => s.setFontSize);

  const presetSize = getTypeLevel(typeLevelId).fontSize;
  const size = useTypeLevel().fontSize;

  /*
   * Langkah berikutnya dicari dari daftar, bukan `size ± 2`, supaya ukuran
   * preset seperti 21 tetap bisa dicapai lagi dari arah mana pun.
   */
  const smaller = [...FONT_SIZES].reverse().find((option) => option < size);
  const bigger = FONT_SIZES.find((option) => option > size);

  // Mendarat tepat di ukuran preset berarti kembali ikut preset, supaya
  // berganti Mode Disleksia sesudahnya tetap mengubah ukurannya.
  const choose = (next: number) => setFontSize(next === presetSize ? null : next);

  const stepButton = (target: number | undefined, label: string, Icon: LucideIcon, letter: number) => (
    <PressableScale
      onPress={() => {
        if (target !== undefined) choose(target);
      }}
      disabled={target === undefined}
      accessibilityRole="button"
      accessibilityState={{ disabled: target === undefined }}
      accessibilityLabel={label}
      scaleTo={0.92}
      className="h-16 w-16 flex-row items-center justify-center rounded-2xl bg-primary/10"
      style={{ gap: 2, opacity: target === undefined ? 0.35 : 1 }}>
      <Text className="font-ui-bold text-primary" style={{ fontSize: letter }}>
        A
      </Text>
      <Icon size={14} color={colors.primary} strokeWidth={3} />
    </PressableScale>
  );

  return (
    <View>
      <Text className="font-ui-medium text-[14px] leading-5 text-text-muted">
        {t.typography.fontSizeHint}
      </Text>

      <View className="mt-4 flex-row items-center" style={{ gap: 12 }}>
        {stepButton(smaller, t.typography.fontSizeSmaller, Minus, 16)}

        <View className="flex-1 items-center" accessible accessibilityLiveRegion="polite">
          <Text className="font-ui-bold text-[26px] text-text-main">
            {t.typography.fontSizeValue(size)}
          </Text>
          <Text className="mt-0.5 font-ui-medium text-[13px] text-text-muted">
            {customSize === null ? t.typography.fontSizeFollowsMode : t.typography.fontSizeCustom}
          </Text>
        </View>

        {stepButton(bigger, t.typography.fontSizeBigger, Plus, 24)}
      </View>

      {/* Pratinjau memakai tipografi yang benar-benar berlaku, jadi yang
          terlihat di sini sama persis dengan yang tampil di layar Baca. */}
      <View className="mt-4 rounded-2xl border border-border/10 bg-surface p-4">
        <DyslexicText>{t.typography.preview}</DyslexicText>
      </View>

      {customSize !== null ? (
        <PressableScale
          onPress={() => setFontSize(null)}
          accessibilityRole="button"
          accessibilityLabel={t.typography.fontSizeReset(presetSize)}
          scaleTo={0.98}
          className="mt-3 h-12 flex-row items-center justify-center rounded-2xl"
          style={{ gap: 8 }}>
          <RotateCcw size={15} color={colors.textMuted} />
          <Text className="font-ui-bold text-[14px] text-text-muted">
            {t.typography.fontSizeReset(presetSize)}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}
