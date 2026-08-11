import type { ReactNode } from 'react';
import { Modal, ScrollView, Switch, Text, View } from 'react-native';
import { ChevronRight, X, type LucideIcon } from 'lucide-react-native';

import { useT } from '../i18n';
import { useSpeakLabel } from '../speech/use-speech';
import { useThemeColors } from '../theme/theme-provider';
import { PressableScale } from './pressable-scale';

/**
 * Potongan-potongan layar Pengaturan versi Figma (frame "ProfileScreen").
 *
 * Dikumpulkan di satu berkas karena bentuknya berulang: seluruh layar itu pada
 * dasarnya hanya seksi berjudul yang berisi baris-baris seragam, dan sebagian
 * barisnya membuka lembar bawah. Menulisnya sekali di sini membuat layarnya
 * sendiri terbaca sebagai daftar isi, bukan sebagai tumpukan markup.
 */

/**
 * Judul seksi: garis aksen tegak, label kecil huruf kapital, lalu judulnya.
 *
 * Huruf kapitalnya dibuat lewat `textTransform`, bukan ditulis kapital di
 * `src/i18n`. Teks di kamus harus tetap dalam bentuk normal supaya bisa
 * dibacakan mesin suara dengan wajar — "TAMPILAN" dieja per huruf oleh
 * sebagian mesin TTS.
 */
export function SettingsSection({ eyebrow, title }: { eyebrow: string; title: string }) {
  const colors = useThemeColors();

  return (
    <View className="mb-3 mt-7 flex-row" style={{ gap: 10 }}>
      <View style={{ width: 3, borderRadius: 2, backgroundColor: colors.primary }} />
      <View>
        <Text
          className="font-ui-bold text-[10px] text-text-muted"
          style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>
          {eyebrow}
        </Text>
        <Text className="mt-0.5 font-ui-bold text-[16px] text-text-main">{title}</Text>
      </View>
    </View>
  );
}

/** Wadah baris — satu kartu dengan garis pemisah tipis di antara anaknya. */
export function SettingsGroup({ children }: { children: ReactNode }) {
  return <View className="overflow-hidden rounded-3xl border border-border/10 bg-surface">{children}</View>;
}

type RowProps = {
  Icon: LucideIcon;
  title: string;
  /** Baris kedua; di Figma isinya NILAI yang sedang berlaku, bukan penjelasan. */
  value?: string;
  /** Garis pemisah di atas baris ini; dimatikan untuk baris pertama. */
  divider?: boolean;
  onPress?: () => void;
  /** Kalau diisi, baris menampilkan sakelar alih-alih tanda panah. */
  toggle?: { value: boolean; onValueChange: (next: boolean) => void };
  /** Titik warna kecil di kanan, dipakai baris Tema Warna. */
  dot?: string;
};

export function SettingsRow({ Icon, title, value, divider = true, onPress, toggle, dot }: RowProps) {
  const colors = useThemeColors();
  const t = useT();
  const speakLabel = useSpeakLabel();

  const body = (
    <View
      className={`flex-row items-center px-4 py-3.5 ${divider ? 'border-t border-border/10' : ''}`}
      style={{ gap: 12 }}>
      {/* Ubin ikon 38x38 bernuansa warna utama — penanda baris di Figma. */}
      <View className="h-[38px] w-[38px] items-center justify-center rounded-2xl bg-primary/10">
        <Icon size={18} color={colors.primary} />
      </View>

      <View className="flex-1">
        <Text className="font-ui-bold text-[15px] text-text-main">{title}</Text>
        {value ? (
          <Text className="mt-0.5 font-ui-medium text-[12px] leading-[17px] text-text-muted">
            {value}
          </Text>
        ) : null}
      </View>

      {dot ? (
        <View
          className="h-[18px] w-[18px] rounded-full border-2 border-border/20"
          style={{ backgroundColor: dot }}
        />
      ) : null}

      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={(next) => {
            // Sakelar tidak lewat PressableScale, jadi keadaan barunya harus
            // diucapkan di sini — sama seperti ToggleRow di layar lain.
            speakLabel(`${title}, ${next ? t.settings.switchOn : t.settings.switchOff}`);
            toggle.onValueChange(next);
          }}
          trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
          thumbColor="#ffffff"
        />
      ) : (
        <ChevronRight size={18} color={colors.textMuted} />
      )}
    </View>
  );

  /*
   * Baris bersakelar tidak dibungkus tombol. Kalau dibungkus, mengetuk di mana
   * pun ikut membalik sakelarnya — dan di layar yang tiap ketukannya berbunyi,
   * sentuhan tak sengaja jadi perubahan setelan yang tidak disadari.
   */
  if (toggle || !onPress) return body;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}. ${value}` : title}
      scaleTo={0.99}>
      {body}
    </PressableScale>
  );
}

/**
 * Lembar bawah: gagang, judul, tombol tutup, lalu isinya yang bisa digulung.
 *
 * `animationType="slide"` dan bukan animasi sendiri — modal bawaan sudah
 * menaikkannya dari bawah, dan menambah animasi di atasnya membuat gerakannya
 * bertumpuk dan patah di perangkat lambat.
 */
export function SettingsSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  const t = useT();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        {/* Area gelap di atas lembar: mengetuknya menutup, seperti lembar lain
            di aplikasi ini. */}
        <PressableScale
          onPress={onClose}
          accessibilityLabel={t.common.close}
          scaleTo={1}
          wrapperStyle={{ flex: 1 }}
          style={{ flex: 1 }}>
          <View style={{ flex: 1 }} />
        </PressableScale>

        <View className="max-h-[85%] rounded-t-[32px] bg-background px-5 pb-8 pt-3">
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-border/20" />
          </View>

          <View className="mb-4 flex-row items-center" style={{ gap: 12 }}>
            <Text className="flex-1 font-ui-bold text-[19px] text-text-main">{title}</Text>
            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.common.close}
              scaleTo={0.9}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt">
              <X size={17} color={colors.textMuted} />
            </PressableScale>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
