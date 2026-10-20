import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, X, type LucideIcon } from 'lucide-react-native';

import { keyboardOverlap, useKeyboardFrame } from '../hooks/use-keyboard-frame';
import { useT } from '../i18n';
import { useSpeakLabel } from '../speech/use-speech';
import { useThemeColors } from '../theme/theme-provider';
import { Portal } from './portal';
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
          className="font-ui-bold text-[12px] text-text-muted"
          style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>
          {eyebrow}
        </Text>
        <Text className="mt-0.5 font-ui-bold text-[17px] text-text-main">{title}</Text>
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
        <Text className="font-ui-bold text-[16px] text-text-main">{title}</Text>
        {value ? (
          <Text className="mt-0.5 font-ui-medium text-[13px] leading-[18px] text-text-muted">
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
        // Hanya penanda: ketukannya diurus baris di bawah. Kalau sakelarnya
        // ikut menerima sentuhan, satu ketukan tepat di atasnya terhitung dua
        // kali dan nilainya kembali seperti semula.
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Switch
            value={toggle.value}
            trackColor={{ false: colors.textMuted, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      ) : (
        <ChevronRight size={18} color={colors.textMuted} />
      )}
    </View>
  );

  /*
   * Seluruh baris bersakelar bisa diketuk, bukan hanya sakelarnya. Sakelar
   * bawaan Android kecil sekali, dan orang yang menekan judul atau
   * keterangannya mengira setelannya rusak karena tidak ada yang berubah.
   * Keadaan barunya diucapkan, jadi ketukan tak sengaja tetap ketahuan.
   */
  if (toggle) {
    const next = !toggle.value;

    return (
      <PressableScale
        onPress={() => {
          speakLabel(`${title}, ${next ? t.settings.switchOn : t.settings.switchOff}`);
          toggle.onValueChange(next);
        }}
        // Bukan nama tombol yang dibacakan, melainkan keadaan barunya (di atas).
        silent
        accessibilityRole="switch"
        accessibilityState={{ checked: toggle.value }}
        accessibilityLabel={value ? `${title}. ${value}` : title}
        scaleTo={0.99}>
        {body}
      </PressableScale>
    );
  }

  if (!onPress) return body;

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
 * Dirender lewat `Portal`, bukan `Modal`. Lembar ini bisa berisi kolom isian
 * (Bantuan & Dukungan, Ubah Nama), dan di dalam `Modal` Android papan tiknya
 * tidak terdeteksi di HP asli sehingga ketikan tertimbun; alasan lengkapnya ada
 * di `portal.tsx`. Akibatnya animasi naik, tombol kembali Android, dan
 * penghindaran papan tik diurus sendiri di sini.
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
  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <SheetBody title={title} onClose={onClose}>
        {children}
      </SheetBody>
    </Portal>
  );
}

/** Jarak antara kolom yang sedang diisi dan tepi atas papan tik. */
const FOCUS_MARGIN = 16;

function SheetBody({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  const t = useT();
  const insets = useSafeAreaInsets();

  const [rootHeight, setRootHeight] = useState(0);
  const keyboard = useKeyboardFrame();

  const overlap = keyboardOverlap(keyboard, rootHeight);
  const keyboardOpen = overlap > 0;

  const maxHeight =
    rootHeight > 0
      ? keyboardOpen
        ? rootHeight - overlap - insets.top - 12
        : rootHeight * 0.85
      : undefined;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();

      return true;
    });

    return () => sub.remove();
  }, [onClose]);

  /*
   * Lembarnya naik dan memendek saat papan tik muncul, tapi gulungannya tidak
   * ikut berpindah, jadi kolom yang sedang diisi bisa tetap berada di bawah
   * batas lembar. Kolom itu digulung masuk ke pandangan, termasuk setiap kali
   * kolom pesan bertambah baris selagi diketik.
   */
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const scrollY = useRef(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const revealFocusedInput = useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput();
    const content = contentRef.current;
    if (!input || !content || viewportHeight === 0) {
      return;
    }

    input.measureLayout(
      content,
      (_x, y, _width, height) => {
        const bottom = y + height + FOCUS_MARGIN;
        const visibleBottom = scrollY.current + viewportHeight;

        if (bottom > visibleBottom) {
          // Kolom yang lebih tinggi dari lembarnya diratakan ke bawah: di
          // situlah kursor berada saat mengetik.
          scrollRef.current?.scrollTo({ y: bottom - viewportHeight, animated: true });
        } else if (y < scrollY.current) {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - FOCUS_MARGIN), animated: true });
        }
      },
      () => {},
    );
  }, [viewportHeight]);

  useEffect(() => {
    if (!keyboardOpen) {
      return;
    }

    // Satu frame dulu, supaya tinggi lembar yang baru sudah terpasang.
    const frame = requestAnimationFrame(revealFocusedInput);

    return () => cancelAnimationFrame(frame);
  }, [keyboardOpen, overlap, revealFocusedInput]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setRootHeight(e.nativeEvent.layout.height)}>
      {/* Area gelap di atas lembar: mengetuknya menutup, seperti lembar lain
          di aplikasi ini. */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(180)}
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <PressableScale
          onPress={onClose}
          accessibilityLabel={t.common.close}
          scaleTo={1}
          wrapperStyle={{ flex: 1 }}
          style={{ flex: 1 }}>
          <View style={{ flex: 1 }} />
        </PressableScale>
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(280)}
        exiting={SlideOutDown.duration(220)}
        accessibilityViewIsModal
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: overlap,
          maxHeight,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          backgroundColor: colors.background,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: keyboardOpen ? FOCUS_MARGIN : 32 + insets.bottom,
        }}>
        <View className="mb-4 items-center">
          <View className="h-1 w-10 rounded-full bg-border/20" />
        </View>

        <View className="mb-4 flex-row items-center" style={{ gap: 12 }}>
          <Text className="flex-1 font-ui-bold text-[20px] text-text-main">{title}</Text>
          <PressableScale
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
            scaleTo={0.9}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt">
            <X size={17} color={colors.textMuted} />
          </PressableScale>
        </View>

        {/*
          flexShrink eksplisit: tanpa itu gulungan bisa memakai tinggi isinya
          sendiri, melewati batas tinggi lembar, sehingga baris terakhirnya
          berada di bawah bilah navigasi dan tidak pernah bisa dijangkau.
        */}
        <ScrollView
          ref={scrollRef}
          style={{ flexGrow: 0, flexShrink: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollY.current = e.nativeEvent.contentOffset.y;
          }}
          onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={() => {
            if (keyboardOpen) {
              revealFocusedInput();
            }
          }}>
          <View ref={contentRef} collapsable={false} style={{ paddingBottom: 8 }}>
            {children}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
