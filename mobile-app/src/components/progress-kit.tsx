import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { useThemeColors } from '../theme/theme-provider';
import { PressableScale } from './pressable-scale';

/**
 * Kerangka layar LexiProgress: tombol kembali, judul, subjudul, lalu isinya.
 *
 * Dipakai seluruh alur (setup, baca, penilaian, hasil, goal) supaya bentuknya
 * seragam dan tidak ada layar yang tombol kembalinya hilang.
 */
export function ProgressScreen({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="mb-5 flex-row items-start" style={{ gap: 12 }}>
      <PressableScale
        onPress={onBack ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        className="h-10 w-10 items-center justify-center rounded-full bg-surface">
        <ArrowLeft size={19} color={colors.textMain} />
      </PressableScale>
      <View className="flex-1">
        <Text className="font-ui-bold text-[24px] text-text-main">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 font-ui-medium text-[13px] leading-5 text-text-muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Kartu permukaan standar untuk seluruh layar progress. */
export function ProgressCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-3xl border border-border/10 bg-surface p-4 ${className}`}>
      {children}
    </View>
  );
}

/** Judul kecil huruf kapital di atas satu blok. */
export function ProgressLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="font-ui-bold text-[11px] uppercase tracking-wide text-text-muted">
      {children}
    </Text>
  );
}

/**
 * Pilihan berbentuk chip besar. Dipakai untuk memilih kondisi, metrik, dan
 * fitur — semuanya pilihan yang harus terbaca jelas dan bisa dibacakan.
 */
export function ChoiceChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      scaleTo={0.96}
      className={`rounded-2xl border px-3 py-2.5 ${
        selected ? 'border-primary bg-primary/10' : 'border-border/20 bg-surface'
      }`}>
      <Text
        className={`text-center font-ui-semibold text-[13px] ${
          selected ? 'text-primary' : 'text-text-muted'
        }`}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** Tombol utama lebar penuh. */
export function ProgressButton({
  label,
  onPress,
  disabled,
  accessibilityLabel,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  tone?: 'primary' | 'soft';
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      scaleTo={0.97}
      className={`h-12 flex-row items-center justify-center rounded-2xl ${
        tone === 'primary' ? 'bg-primary' : 'bg-primary/[0.08]'
      } ${disabled ? 'opacity-40' : ''}`}>
      <Text
        className={`font-ui-bold text-[15px] ${
          tone === 'primary' ? 'text-white' : 'text-primary'
        }`}>
        {label}
      </Text>
    </PressableScale>
  );
}
