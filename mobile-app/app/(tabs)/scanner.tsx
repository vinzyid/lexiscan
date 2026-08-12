import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Camera as CameraIcon,
  Check,
  Crop,
  RotateCw,
  ScanLine,
  Sparkles,
  Sun,
  Upload,
} from 'lucide-react-native';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as DocumentPicker from 'expo-document-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { useOCRStore } from '../../src/store/useStore';
import { PressableScale } from '../../src/components/pressable-scale';
import { SpeakButton } from '../../src/components/speak-button';
import { useStopSpeechOnBlur } from '../../src/speech/use-speech';
import { useThemeColors } from '../../src/theme/theme-provider';
import { GRADIENTS, getTypeLevel } from '../../src/theme/palettes';
import { useT } from '../../src/i18n';
import { correctTypo } from '../../src/api/ai';
import { Blob, HexDecor, Ring, ScreenBackdrop, Sparkle } from '../../src/components/figma-decor';
import { IlluScan } from '../../src/components/illustrations';
import { cropRectForGuide } from '../../src/utils/crop-frame';

type Phase = 'idle' | 'scanning' | 'done';

/** Header layar Pindai — lebih ungu dari banner dashboard. */
const SCAN_HEADER = ['#3b0764', '#4c1d95', '#1e3a8a'] as const;
/** Kotak pratinjau kamera. */
const VIEWFINDER = ['#0c0c1e', '#141430'] as const;

/**
 * Jarak siku panduan dari tepi pratinjau, dalam poin layar.
 *
 * Dipakai DUA KALI — untuk menempatkan sikunya dan untuk menghitung kotak
 * potongnya. Itu memang maksudnya: begitu keduanya memakai angka yang berbeda,
 * yang dipotong bukan lagi yang dilihat pengguna, dan itulah cacat yang dulu
 * membuat teks di luar kotak ikut terbaca.
 */
const GUIDE_INSET = 16;

/**
 * Tinggi bilah tombol yang dipaku di dasar layar: tombol 55px + 12px padding
 * atas dan bawah. Dipakai dua kali — sebagai tinggi bilahnya sendiri dan
 * sebagai sisa ruang di bawah daftar tips supaya barisnya tidak tertutup.
 */
const ACTION_BAR_HEIGHT = 55 + 24;

/** Pratinjau tidak pernah lebih pendek dari ini, sesempit apa pun layarnya. */
const MIN_PREVIEW_HEIGHT = 200;

/** Ubin ikon 36x36 tiap baris tip — satu warna per tip, urut seperti Figma. */
const TIP_TILES = [
  { gradient: ['#f59e0b', '#fbbf24'] as const, Icon: Sun },
  { gradient: ['#059669', '#10b981'] as const, Icon: Crop },
  { gradient: ['#7c3aed', '#8b5cf6'] as const, Icon: RotateCw },
  { gradient: ['#4f46e5', '#6366f1'] as const, Icon: Sparkles },
];


export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  /*
   * Ukuran kotak pratinjau, diukur saat tata letaknya jadi. Diperlukan untuk
   * menerjemahkan kotak panduan di layar menjadi kotak potong di foto — lihat
   * `cropRectForGuide`.
   */
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  /*
   * Tinggi area layar dan tinggi header diukur, bukan ditebak: keduanya
   * bergeser oleh safe area, ukuran huruf sistem, dan tinggi perangkat.
   */
  const [screenHeight, setScreenHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const t = useT();

  // Pindah tab sambil hasil pindaian sedang dibacakan tidak boleh meninggalkan
  // suara yang terus berbicara tanpa tombol untuk menghentikannya.
  useStopSpeechOnBlur();

  const [permission, requestPermission] = useCameraPermissions();
  const [tab, setTab] = useState<'camera' | 'upload'>('camera');
  const [phase, setPhase] = useState<Phase>('idle');
  const [detected, setDetected] = useState('');
  const [stepsDone, setStepsDone] = useState(0);

  // Kamera dilepas saat tab kehilangan fokus supaya pratinjau tidak membeku.
  const [isFocused, setIsFocused] = useState(true);

  const setRawText = useOCRStore((s) => s.setRawText);
  const typeLevel = getTypeLevel(useOCRStore((s) => s.typeLevelId));

  const [isCorrectingTypo, setIsCorrectingTypo] = useState(false);

  // `useState` dengan initializer, bukan `useRef(...).current`: nilainya tetap
  // bertahan antar render tanpa menyentuh ref saat render berlangsung.
  const [successScale] = useState(() => new Animated.Value(0.5));
  const [successOpacity] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  useEffect(() => {
    if (phase === 'done') {
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      successScale.setValue(0.5);
      successOpacity.setValue(0);
    }
  }, [phase, successScale, successOpacity]);

  // Ceklis preprocessing dimunculkan bertahap supaya prosesnya terlihat, bukan melompat.
  useEffect(() => {
    if (phase !== 'done' || stepsDone >= t.scanner.processSteps.length) return;
    const timer = setTimeout(() => setStepsDone((n) => n + 1), 260);
    return () => clearTimeout(timer);
  }, [phase, stepsDone, t.scanner.processSteps.length]);

  const correctTypoInBackground = async (text: string) => {
    try {
      setIsCorrectingTypo(true);
      setDetected(await correctTypo(text));
    } catch (e) {
      console.warn(t.scanner.typoWarning, e);
    } finally {
      setIsCorrectingTypo(false);
    }
  };

  const handleScan = async () => {
    if (!cameraRef.current) return;

    try {
      setPhase('scanning');

      /*
       * quality 1 & exif mati. Kompresi JPEG meninggalkan bercak di sekitar
       * huruf, dan bercak itulah yang membuat ML Kit tertukar antara rn/m dan
       * cl/d. EXIF dibuang karena hanya menambah ukuran berkas; orientasinya
       * sudah diterapkan ke pikselnya selama `skipProcessing` tidak dinyalakan.
       */
      const photo = await cameraRef.current.takePictureAsync({ quality: 1, exif: false });
      if (!photo?.uri) throw new Error(t.scanner.cameraNoImage);

      /*
       * Dipotong sesuai KOTAK YANG DILIHAT PENGGUNA, dihitung dari ukuran
       * pratinjau yang sebenarnya — bukan pecahan tetap. Lihat `cropRectForGuide`
       * untuk alasannya. Kalau pratinjaunya belum sempat terukur, fotonya
       * dipakai utuh: kelebihan teks masih bisa dihapus pengguna, sedangkan
       * teks yang terlanjur terpotong hilang tanpa jejak.
       */
      const crop = cropRectForGuide(photo, previewSize, GUIDE_INSET);

      let sourceUri = photo.uri;

      if (crop) {
        const context = ImageManipulator.manipulate(photo.uri).crop(crop);
        const imageRef = await context.renderAsync();
        // compress 1: sama alasannya dengan quality di atas — ini gambar untuk
        // dibaca mesin, bukan untuk dikirim lewat jaringan.
        const cropped = await imageRef.saveAsync({ compress: 1, format: SaveFormat.JPEG });
        sourceUri = cropped.uri;
      }

      const result = await TextRecognition.recognize(sourceUri);
      const rawText = result?.text?.trim() ?? '';

      if (!rawText) {
        setPhase('idle');
        Alert.alert(t.scanner.noTextTitle, t.scanner.noTextCamera);
        return;
      }

      setDetected(rawText);
      setStepsDone(0);
      setPhase('done');
      correctTypoInBackground(rawText);
    } catch (error) {
      setPhase('idle');
      Alert.alert(t.scanner.scanFailTitle, error instanceof Error ? error.message : t.scanner.genericError);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      setPhase('scanning');
      const recognitionResult = await TextRecognition.recognize(result.assets[0].uri);
      const rawText = recognitionResult?.text?.trim() ?? '';

      if (!rawText) {
        setPhase('idle');
        Alert.alert(t.scanner.noTextTitle, t.scanner.noTextUpload);
        return;
      }

      setDetected(rawText);
      setStepsDone(0);
      setPhase('done');
      correctTypoInBackground(rawText);
    } catch (error) {
      setPhase('idle');
      Alert.alert(
        t.scanner.uploadFailTitle,
        error instanceof Error ? error.message : t.scanner.genericError,
      );
    }
  };

  const openReader = () => {
    setRawText(detected);
    router.push('/reader');
  };

  if (!permission) return <View className="flex-1 bg-background" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ScreenBackdrop />
        <View className="mb-5 h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
          <CameraIcon size={40} color={colors.primary} />
        </View>
        <Text className="mb-6 text-center font-ui text-sm leading-6 text-text-main">
          {t.scanner.permissionText}
        </Text>
        <PressableScale
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel={t.scanner.permissionButton}
          scaleTo={0.97}>
          <PrimaryButtonSurface>
            <Text className="font-ui-bold text-base text-white">{t.scanner.permissionButton}</Text>
          </PrimaryButtonSurface>
        </PressableScale>
      </View>
    );
  }

  const paragraphCount = detected.split(/\n{2,}|\n/).filter((line) => line.trim().length > 0).length;
  const busy = phase === 'scanning' || isCorrectingTypo;

  /*
   * Tinggi pratinjau diambil dari sisa ruang layar, dengan 3:4 sebagai batas
   * ATAS — bukan sebagai ukuran mati.
   *
   * Versi sebelumnya selalu memakai 3:4 penuh. Di layar 6 inci tumpukan
   * header + pemilih sumber + kotak itu sudah melewati satu layar, sehingga
   * tombol Pindai jatuh di bawah lipatan: pengguna menggulir untuk menekannya,
   * dan begitu digulir bagian atas pratinjau ikut hilang — ia memotret bingkai
   * yang tidak pernah dilihatnya utuh. Sekarang kotaknya yang mengalah.
   *
   * Angka perkiraan hanya dipakai pada frame pertama, sebelum onLayout
   * menjawab, supaya tingginya tidak terlihat melompat.
   */
  const spaceBelowHeader =
    (screenHeight || windowHeight - 96) - (headerHeight || insets.top + 150);
  const previewHeight = Math.round(
    Math.max(
      MIN_PREVIEW_HEIGHT,
      Math.min(
        // 3:4 tegak — sebangun dengan foto sensor dan dengan halaman buku.
        (windowWidth - 32) * (4 / 3),
        spaceBelowHeader -
          20 - // padding atas isi
          54 - // pemilih sumber kamera/unggah
          40 - // dua jarak antar blok
          ACTION_BAR_HEIGHT -
          8, // sisa napas supaya tombol tidak menempel tepi
      ),
    ),
  );

  return (
    <View
      className="flex-1 bg-background"
      onLayout={(event) => setScreenHeight(event.nativeEvent.layout.height)}>
      <ScreenBackdrop />

      <ScrollView
        contentContainerStyle={{
          // Bilah tombol menutupi dasar layar, jadi tips perlu ruang di bawahnya.
          paddingBottom: phase === 'done' ? 32 : ACTION_BAR_HEIGHT + 24,
        }}
        showsVerticalScrollIndicator={false}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[...SCAN_HEADER]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={{ paddingTop: insets.top + 8, overflow: 'hidden' }}>
          <Blob size={100} opacity={0.06} style={{ position: 'absolute', top: -26, right: 10 }} />
          <Ring size={80} style={{ position: 'absolute', top: 20, right: -14 }} />
          <HexDecor size={22} style={{ position: 'absolute', bottom: 26, right: 120 }} />
          <View style={{ position: 'absolute', right: 22, bottom: 18, opacity: 0.9 }}>
            <IlluScan size={80} />
          </View>
          <Sparkle size={10} style={{ position: 'absolute', top: 24, right: 92 }} />
          <Sparkle size={5} style={{ position: 'absolute', bottom: 30, right: 40 }} />

          <View className="px-5 pb-6 pt-5">
            <View className="flex-row">
              <View
                className="flex-row items-center rounded-[14px] border border-white/[0.18] bg-white/[0.12] px-3 py-1.5"
                style={{ gap: 8 }}>
                <ScanLine size={13} color="#ffffff" />
                <Text className="font-ui-bold text-[13px] text-white/85">{t.scanner.badge}</Text>
              </View>
            </View>
            <Text className="mt-3 font-ui-bold text-2xl text-white">{t.scanner.title}</Text>
            <Text className="mt-1 font-ui-medium text-sm text-white/60">
              {t.scanner.subtitle}
            </Text>
          </View>
        </LinearGradient>

        <View className="px-4 pt-5" style={{ gap: 20 }}>
          {phase === 'done' ? (
            <Animated.View
              style={{ opacity: successOpacity, transform: [{ scale: successScale }], gap: 20 }}>
              {/* Konfirmasi berhasil */}
              <LinearGradient
                colors={[...VIEWFINDER]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 210,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: '#10b981',
                }}>
                <View
                  className="h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
                  <Check size={26} color="#10b981" strokeWidth={3} />
                </View>
                <Text className="mt-2 font-ui-bold text-sm" style={{ color: '#10b981' }}>
                  {isCorrectingTypo ? t.scanner.tidyingUp : t.scanner.success}
                </Text>
              </LinearGradient>

              {/* Teks terdeteksi */}
              <View
                className="rounded-2xl bg-surface p-4"
                style={{ borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
                  <Text className="font-ui-bold text-[13px]" style={{ color: '#10b981' }}>
                    {t.scanner.detected}
                  </Text>
                  {isCorrectingTypo ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 'auto' }} />
                  ) : (
                    /*
                     * Bisa didengar sebelum dibuka di layar Baca. Bagi yang
                     * belum bisa membaca, inilah satu-satunya cara memastikan
                     * halaman yang difoto sudah benar — kalau tidak, ia baru
                     * tahu salah foto setelah masuk ke layar berikutnya.
                     */
                    <View style={{ marginLeft: 'auto' }}>
                      <SpeakButton text={detected} speechKey="scan-result" size={16} />
                    </View>
                  )}
                </View>

                <Text
                  className="mt-3 font-read text-text-main"
                  numberOfLines={4}
                  style={{
                    fontSize: 14,
                    lineHeight: 14 * typeLevel.lineHeightRatio,
                    letterSpacing: 0.4,
                  }}>
                  {detected}
                </Text>

                <View
                  className="mt-3 flex-row border-t pt-3"
                  style={{ gap: 8, borderTopColor: colors.border }}>
                  <StatChip label={t.scanner.paragraphCount(paragraphCount)} color="#10b981" tint="rgba(16,185,129,0.1)" />
                  <StatChip
                    label={t.scanner.autoFont}
                    color={colors.primary}
                    tint="rgba(124,58,237,0.08)"
                  />
                  <StatChip label={t.scanner.aiReady} color={colors.primary} tint="rgba(124,58,237,0.08)" />
                </View>
              </View>

              {/* Preprocessing */}
              <View
                className="rounded-2xl bg-surface p-4"
                style={{ borderWidth: 1, borderColor: colors.border }}>
                <Text className="font-ui-bold text-[13px] text-text-muted">{t.scanner.processTitle}</Text>

                <View className="mt-3.5" style={{ gap: 10 }}>
                  {t.scanner.processSteps.map((step, index) => {
                    const done = index < stepsDone;

                    return (
                      <View
                        key={step}
                        className="h-14 flex-row items-center rounded-[14px] px-3"
                        style={{
                          gap: 12,
                          backgroundColor: done ? 'rgba(16,185,129,0.06)' : 'transparent',
                          opacity: done ? 1 : 0.4,
                        }}>
                        <GradientTile gradient={['#10b981', '#059669']}>
                          <Check size={15} color="#ffffff" strokeWidth={3} />
                        </GradientTile>
                        <Text
                          className="flex-1 font-ui-bold text-[13px]"
                          style={{ color: done ? '#10b981' : colors.textMuted }}>
                          {step}
                        </Text>
                        {done ? <Check size={14} color="#10b981" /> : null}
                      </View>
                    );
                  })}
                </View>
              </View>

              <PressableScale
                onPress={openReader}
                accessibilityRole="button"
                accessibilityLabel={t.scanner.openAndReadLabel}
                scaleTo={0.97}>
                <PrimaryButtonSurface>
                  <ArrowRight size={20} color="#ffffff" />
                  <Text className="font-ui-bold text-base text-white">{t.scanner.openAndRead}</Text>
                </PrimaryButtonSurface>
              </PressableScale>

              <PressableScale
                onPress={() => {
                  setPhase('idle');
                  setDetected('');
                  setStepsDone(0);
                }}
                accessibilityRole="button"
                accessibilityLabel={t.scanner.scanAnother}
                className="h-11 items-center justify-center">
                <Text className="text-center font-ui-bold text-sm text-text-muted">
                  {t.scanner.scanAnother}
                </Text>
              </PressableScale>
            </Animated.View>
          ) : (
            <>
              {/* Pilihan sumber */}
              <View
                className="h-[54px] flex-row rounded-2xl bg-primary/[0.05] p-1.5"
                style={{ gap: 6, borderWidth: 1, borderColor: colors.border }}>
                <SourceTab
                  active={tab === 'camera'}
                  onPress={() => setTab('camera')}
                  icon={
                    <CameraIcon size={15} color={tab === 'camera' ? '#ffffff' : colors.textMuted} />
                  }
                  label={t.scanner.camera}
                />
                <SourceTab
                  active={tab === 'upload'}
                  onPress={() => setTab('upload')}
                  icon={<Upload size={15} color={tab === 'upload' ? '#ffffff' : colors.textMuted} />}
                  label={t.scanner.upload}
                />
              </View>

              {/* Pratinjau */}
              <LinearGradient
                colors={[...VIEWFINDER]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                onLayout={(event) => setPreviewSize(event.nativeEvent.layout)}
                style={{
                  /*
                   * Setinggi mungkin sampai batas 3:4 — bentuk itu menyamai foto
                   * sensor sekaligus halaman buku. Kotak lebar-pendek yang dulu
                   * memaksa pengguna menjauhkan HP sampai satu halaman muat,
                   * sehingga hurufnya tinggal beberapa piksel dan itulah sebab
                   * pembacaan meleset; batas bawahnya dihitung di previewHeight.
                   * Untuk tab Unggah tingginya tetap, karena di sana isinya cuma
                   * gambar penanda.
                   */
                  height: tab === 'camera' ? previewHeight : 210,
                  borderRadius: 24,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(124,58,237,0.45)',
                }}>
                {/*
                  ratio 4:3 mengunci bentuk gambar sensor supaya sama dengan kotak
                  3:4 di atas. Begitu keduanya sebangun, tidak ada lagi bagian foto
                  yang terekam tanpa pernah terlihat — pemetaan di `cropRectForGuide`
                  jadi nyaris satu banding satu.

                  autofocus dibiarkan bawaan ('off'), dan namanya memang menyesatkan:
                  yang berarti fokus otomatis TERUS-MENERUS justru 'off', sedangkan
                  'on' mengunci fokus sekali lalu berhenti — persis yang tidak
                  diinginkan saat HP digerak-gerakkan di atas buku.
                */}
                {tab === 'camera' && isFocused ? (
                  <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" ratio="4:3" />
                ) : null}

                <View
                  className="absolute h-full w-full items-center justify-center"
                  pointerEvents="none">
                  {/* Empat siku panduan bingkai */}
                  <CornerBracket style={{ top: GUIDE_INSET, left: GUIDE_INSET }} corners="tl" />
                  <CornerBracket style={{ top: GUIDE_INSET, right: GUIDE_INSET }} corners="tr" />
                  <CornerBracket style={{ bottom: GUIDE_INSET, left: GUIDE_INSET }} corners="bl" />
                  <CornerBracket style={{ bottom: GUIDE_INSET, right: GUIDE_INSET }} corners="br" />

                  {tab === 'camera' ? (
                    <>
                      <ScanLine size={38} color="rgba(255,255,255,0.28)" />
                      <Text className="mt-2.5 font-ui text-xs text-white/[0.28]">
                        {t.scanner.aimAtDocument}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Upload size={38} color="rgba(255,255,255,0.28)" />
                      <Text className="mt-2.5 font-ui text-xs text-white/[0.28]">
                        {t.scanner.fileTypes}
                      </Text>
                    </>
                  )}
                </View>
              </LinearGradient>

              {/* Tips */}
              <View
                className="rounded-2xl bg-surface p-4"
                style={{ borderWidth: 1, borderColor: colors.border }}>
                <Text className="font-ui-bold text-[13px] text-text-muted">
                  {t.scanner.tipsTitle}
                </Text>
                <View className="mt-3.5" style={{ gap: 10 }}>
                  {t.scanner.tips.map((tip, index) => {
                    const { gradient, Icon } = TIP_TILES[index % TIP_TILES.length];

                    return (
                      <View key={tip} className="flex-row items-center" style={{ gap: 12 }}>
                        <GradientTile gradient={gradient}>
                          <Icon size={15} color="#ffffff" />
                        </GradientTile>
                        <Text className="flex-1 font-ui text-[13px] text-text-muted">{tip}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/*
        Tindakan utama dipaku di dasar layar, bukan ikut menggulir. Daftar tips
        boleh sepanjang apa pun tanpa lagi mendorong tombol Pindai keluar layar.
      */}
      {phase === 'done' ? null : (
        <View
          className="px-4 pb-3 pt-3"
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}>
          <PressableScale
            onPress={tab === 'camera' ? handleScan : handleUpload}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={tab === 'camera' ? t.scanner.startScanLabel : t.scanner.pickImageLabel}
            scaleTo={0.97}>
            <PrimaryButtonSurface dimmed={busy}>
              {busy ? (
                <ActivityIndicator color="#ffffff" />
              ) : tab === 'camera' ? (
                <CameraIcon size={20} color="#ffffff" />
              ) : (
                <Upload size={20} color="#ffffff" />
              )}
              <Text className="font-ui-bold text-base text-white">
                {phase === 'scanning'
                  ? t.scanner.processing
                  : isCorrectingTypo
                    ? t.scanner.tidyingUp
                    : tab === 'camera'
                      ? t.scanner.startScan
                      : t.scanner.pickImage}
              </Text>
            </PrimaryButtonSurface>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

/** Tombol utama 55px bergradien ungu→indigo. */
function PrimaryButtonSurface({
  children,
  dimmed,
}: {
  children: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <LinearGradient
      colors={[...GRADIENTS.activePill.colors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        height: 55,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 16,
        opacity: dimmed ? 0.55 : 1,
      }}>
      {children}
    </LinearGradient>
  );
}

/** Ubin ikon 36x36 dengan kilau putih di sudut kiri atas. */
function GradientTile({
  gradient,
  children,
}: {
  gradient: readonly [string, string];
  children: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={[...gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 36,
        height: 36,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', width: 36, height: 36 }}
      />
      {children}
    </LinearGradient>
  );
}

function SourceTab({
  active,
  onPress,
  icon,
  label,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const content = (
    <>
      {icon}
      <Text className={`font-ui-bold text-sm ${active ? 'text-white' : 'text-text-muted'}`}>
        {label}
      </Text>
    </>
  );

  return (
    <PressableScale
      wrapperStyle={{ flex: 1 }}
      className="flex-1"
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      scaleTo={0.96}>
      {active ? (
        <LinearGradient
          colors={[...GRADIENTS.activePill.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 14,
          }}>
          {content}
        </LinearGradient>
      ) : (
        <View
          className="flex-1 flex-row items-center justify-center rounded-[14px]"
          style={{ gap: 8 }}>
          {content}
        </View>
      )}
    </PressableScale>
  );
}

/** Chip statistik di kartu "Teks Terdeteksi". */
function StatChip({ label, color, tint }: { label: string; color: string; tint: string }) {
  return (
    <View className="rounded-[10px] px-2.5 py-1" style={{ backgroundColor: tint }}>
      <Text className="font-ui-bold text-[11px]" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

/** Siku 28x28 di sudut kotak pratinjau. */
function CornerBracket({
  style,
  corners,
}: {
  style: object;
  corners: 'tl' | 'tr' | 'bl' | 'br';
}) {
  const line = 'rgba(124,58,237,1)';

  return (
    <View
      style={[
        {
          position: 'absolute',
          width: 28,
          height: 28,
          borderColor: line,
          borderTopWidth: corners.startsWith('t') ? 2 : 0,
          borderBottomWidth: corners.startsWith('b') ? 2 : 0,
          borderLeftWidth: corners.endsWith('l') ? 2 : 0,
          borderRightWidth: corners.endsWith('r') ? 2 : 0,
          borderTopLeftRadius: corners === 'tl' ? 5 : 0,
          borderTopRightRadius: corners === 'tr' ? 5 : 0,
          borderBottomLeftRadius: corners === 'bl' ? 5 : 0,
          borderBottomRightRadius: corners === 'br' ? 5 : 0,
        },
        style,
      ]}
    />
  );
}
