import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
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
import { ImageManipulator } from 'expo-image-manipulator';

import { useOCRStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/theme/theme-provider';
import { GRADIENTS, getTypeLevel } from '../../src/theme/palettes';
import { PREPROCESSING_STEPS, SCAN_TIPS } from '../../src/data/sample-document';
import { correctTypo } from '../../src/api/ai';
import { Blob, HexDecor, Ring, ScreenBackdrop, Sparkle } from '../../src/components/figma-decor';
import { IlluScan } from '../../src/components/illustrations';

type Phase = 'idle' | 'scanning' | 'done';

/** Header layar Pindai — lebih ungu dari banner dashboard. */
const SCAN_HEADER = ['#3b0764', '#4c1d95', '#1e3a8a'] as const;
/** Kotak pratinjau kamera. */
const VIEWFINDER = ['#0c0c1e', '#141430'] as const;

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

  /*
   * `useState` dengan initializer, bukan `useRef(...).current` — nilainya tetap
   * bertahan antar render tapi tidak menyentuh ref saat render berlangsung.
   */
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
    if (phase !== 'done' || stepsDone >= PREPROCESSING_STEPS.length) return;
    const timer = setTimeout(() => setStepsDone((n) => n + 1), 260);
    return () => clearTimeout(timer);
  }, [phase, stepsDone]);

  const correctTypoInBackground = async (text: string) => {
    try {
      setIsCorrectingTypo(true);
      setDetected(await correctTypo(text));
    } catch (e) {
      console.warn('Gagal memperbaiki typo via AI, memakai text asli dari OCR.', e);
    } finally {
      setIsCorrectingTypo(false);
    }
  };

  const handleScan = async () => {
    if (!cameraRef.current) return;

    try {
      setPhase('scanning');
      const photo = await cameraRef.current.takePictureAsync();
      if (!photo?.uri) throw new Error('Kamera tidak mengembalikan gambar.');

      // Crop ke area tengah (60% dari lebar & tinggi) — sesuai batas kotak panduan.
      const context = ImageManipulator.manipulate(photo.uri).crop({
        originX: photo.width * 0.2,
        originY: photo.height * 0.2,
        width: photo.width * 0.6,
        height: photo.height * 0.6,
      });
      const imageRef = await context.renderAsync();
      const cropped = await imageRef.saveAsync({ format: 'jpeg' as any });

      const result = await TextRecognition.recognize(cropped.uri);
      const rawText = result?.text?.trim() ?? '';

      if (!rawText) {
        setPhase('idle');
        Alert.alert('Tidak ada teks', 'Coba dekatkan kamera dan pastikan cahaya cukup terang.');
        return;
      }

      setDetected(rawText);
      setStepsDone(0);
      setPhase('done');
      correctTypoInBackground(rawText);
    } catch (error) {
      setPhase('idle');
      Alert.alert('Gagal memindai', error instanceof Error ? error.message : 'Terjadi kesalahan.');
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
        Alert.alert('Tidak ada teks', 'Gambar ini tampaknya tidak memiliki teks atau terlalu buram.');
        return;
      }

      setDetected(rawText);
      setStepsDone(0);
      setPhase('done');
      correctTypoInBackground(rawText);
    } catch (error) {
      setPhase('idle');
      Alert.alert(
        'Gagal membaca gambar',
        error instanceof Error ? error.message : 'Terjadi kesalahan.',
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
          LexiScan butuh izin kamera untuk memindai dokumen fisikmu.
        </Text>
        <Pressable onPress={requestPermission} accessibilityRole="button">
          <PrimaryButtonSurface>
            <Text className="font-ui-bold text-[15px] text-white">Berikan Izin Kamera</Text>
          </PrimaryButtonSurface>
        </Pressable>
      </View>
    );
  }

  const paragraphCount = detected.split(/\n{2,}|\n/).filter((line) => line.trim().length > 0).length;
  const busy = phase === 'scanning' || isCorrectingTypo;

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[...SCAN_HEADER]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
                <ScanLine size={12} color="#ffffff" />
                <Text className="font-ui-bold text-[11px] text-white/85">SMART OCR SCAN</Text>
              </View>
            </View>
            <Text className="mt-3 font-ui-bold text-2xl text-white">Pindai Dokumen</Text>
            <Text className="mt-0.5 font-ui text-[13px] text-white/55">
              Foto fisik jadi teks digital ramah disleksia
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
                  {isCorrectingTypo ? 'Merapikan teks…' : 'Berhasil!'}
                </Text>
              </LinearGradient>

              {/* Teks terdeteksi */}
              <View
                className="rounded-2xl bg-surface p-4"
                style={{ borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
                  <Text className="font-ui-bold text-[10px]" style={{ color: '#10b981' }}>
                    TEKS TERDETEKSI
                  </Text>
                  {isCorrectingTypo ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 'auto' }} />
                  ) : null}
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
                  <StatChip label={`${paragraphCount} paragraf`} color="#10b981" tint="rgba(16,185,129,0.1)" />
                  <StatChip
                    label="Font otomatis"
                    color={colors.primary}
                    tint="rgba(124,58,237,0.08)"
                  />
                  <StatChip label="Siap AI" color={colors.primary} tint="rgba(124,58,237,0.08)" />
                </View>
              </View>

              {/* Preprocessing */}
              <View
                className="rounded-2xl bg-surface p-4"
                style={{ borderWidth: 1, borderColor: colors.border }}>
                <Text className="font-ui-bold text-[10px] text-text-muted">
                  PREPROCESSING OTOMATIS
                </Text>

                <View className="mt-3.5" style={{ gap: 10 }}>
                  {PREPROCESSING_STEPS.map((step, index) => {
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

              <Pressable onPress={openReader} accessibilityRole="button">
                <PrimaryButtonSurface>
                  <ArrowRight size={18} color="#ffffff" />
                  <Text className="font-ui-bold text-[15px] text-white">Buka dan Baca</Text>
                </PrimaryButtonSurface>
              </Pressable>

              <Pressable
                onPress={() => {
                  setPhase('idle');
                  setDetected('');
                  setStepsDone(0);
                }}
                accessibilityRole="button"
                className="py-1">
                <Text className="text-center font-ui-bold text-xs text-text-muted">
                  ← Pindai dokumen lain
                </Text>
              </Pressable>
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
                  label="Kamera"
                />
                <SourceTab
                  active={tab === 'upload'}
                  onPress={() => setTab('upload')}
                  icon={<Upload size={15} color={tab === 'upload' ? '#ffffff' : colors.textMuted} />}
                  label="Unggah File"
                />
              </View>

              {/* Pratinjau */}
              <LinearGradient
                colors={[...VIEWFINDER]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 210,
                  borderRadius: 24,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(124,58,237,0.45)',
                }}>
                {tab === 'camera' && isFocused ? (
                  <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
                ) : null}

                <View
                  className="absolute h-full w-full items-center justify-center"
                  pointerEvents="none">
                  {/* Empat siku panduan bingkai */}
                  <CornerBracket style={{ top: 16, left: 16 }} corners="tl" />
                  <CornerBracket style={{ top: 16, right: 16 }} corners="tr" />
                  <CornerBracket style={{ bottom: 16, left: 16 }} corners="bl" />
                  <CornerBracket style={{ bottom: 16, right: 16 }} corners="br" />

                  {tab === 'camera' ? (
                    <>
                      <ScanLine size={38} color="rgba(255,255,255,0.28)" />
                      <Text className="mt-2.5 font-ui text-xs text-white/[0.28]">
                        Arahkan ke dokumen
                      </Text>
                    </>
                  ) : (
                    <>
                      <Upload size={38} color="rgba(255,255,255,0.28)" />
                      <Text className="mt-2.5 font-ui text-xs text-white/[0.28]">
                        PDF, JPG, atau PNG
                      </Text>
                    </>
                  )}
                </View>
              </LinearGradient>

              {/* Tips */}
              <View
                className="rounded-2xl bg-surface p-4"
                style={{ borderWidth: 1, borderColor: colors.border }}>
                <Text className="font-ui-bold text-[10px] text-text-muted">TIPS SCAN TERBAIK</Text>
                <View className="mt-3.5" style={{ gap: 10 }}>
                  {SCAN_TIPS.map((tip, index) => {
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

              <Pressable
                onPress={tab === 'camera' ? handleScan : handleUpload}
                disabled={busy}
                accessibilityRole="button">
                <PrimaryButtonSurface dimmed={busy}>
                  {busy ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : tab === 'camera' ? (
                    <CameraIcon size={18} color="#ffffff" />
                  ) : (
                    <Upload size={18} color="#ffffff" />
                  )}
                  <Text className="font-ui-bold text-[15px] text-white">
                    {phase === 'scanning'
                      ? 'Memproses…'
                      : isCorrectingTypo
                        ? 'Memperbaiki typo (AI)…'
                        : tab === 'camera'
                          ? 'Mulai Scan'
                          : 'Pilih Gambar'}
                  </Text>
                </PrimaryButtonSurface>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
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
    <Pressable
      className="flex-1"
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}>
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
    </Pressable>
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
