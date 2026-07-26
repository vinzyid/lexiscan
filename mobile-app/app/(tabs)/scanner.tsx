import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Check, Upload, Camera as CameraIcon, ScanLine, ChevronRight } from 'lucide-react-native';
import TextRecognition from '@react-native-ml-kit/text-recognition';

import { useOCRStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/theme/theme-provider';
import { getTypeLevel } from '../../src/theme/palettes';
import { PREPROCESSING_STEPS, SCAN_TIPS } from '../../src/data/sample-document';

type Phase = 'idle' | 'scanning' | 'done';

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

  const setRawText = useOCRStore((s) => s.setRawText);
  const typeLevel = getTypeLevel(useOCRStore((s) => s.typeLevelId));

  // Ceklis preprocessing dimunculkan bertahap supaya prosesnya terlihat, bukan melompat.
  useEffect(() => {
    if (phase !== 'done' || stepsDone >= PREPROCESSING_STEPS.length) return;
    const timer = setTimeout(() => setStepsDone((n) => n + 1), 260);
    return () => clearTimeout(timer);
  }, [phase, stepsDone]);

  const handleScan = async () => {
    if (!cameraRef.current) return;

    try {
      setPhase('scanning');
      const photo = await cameraRef.current.takePictureAsync();
      if (!photo?.uri) throw new Error('Kamera tidak mengembalikan gambar.');

      const result = await TextRecognition.recognize(photo.uri);
      const text = result?.text?.trim() ?? '';

      if (!text) {
        setPhase('idle');
        Alert.alert('Tidak ada teks', 'Coba dekatkan kamera dan pastikan cahaya cukup terang.');
        return;
      }

      setDetected(text);
      setStepsDone(0);
      setPhase('done');
    } catch (error) {
      setPhase('idle');
      Alert.alert('Gagal memindai', error instanceof Error ? error.message : 'Terjadi kesalahan.');
    }
  };

  const openReader = () => {
    setRawText(detected);
    router.push('/reader');
  };

  const resetScan = () => {
    setPhase('idle');
    setDetected('');
    setStepsDone(0);
  };

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="mb-4 text-5xl">📷</Text>
        <Text className="mb-6 text-center font-opendyslexic text-sm leading-6 text-text-main">
          LexiScan butuh izin kamera untuk memindai dokumen fisikmu.
        </Text>
        <Pressable
          onPress={requestPermission}
          accessibilityRole="button"
          className="rounded-2xl bg-primary px-6 py-3.5">
          <Text className="font-opendyslexic-bold text-sm text-white">Berikan Izin Kamera</Text>
        </Pressable>
      </View>
    );
  }

  const paragraphCount = detected.split(/\n{2,}|\n/).filter((line) => line.trim().length > 0).length;

  return (
    <ScrollView
      className="flex-1 bg-background px-4"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}>
      <View className="mb-5">
        <Text className="mb-1 font-opendyslexic-bold text-2xl text-text-main">Smart OCR Scan 📡</Text>
        <Text className="font-opendyslexic text-xs text-text-muted">
          Foto dokumen fisik → teks digital ramah disleksia
        </Text>
      </View>

      {phase === 'done' ? (
        <>
          <View className="mb-4 h-52 items-center justify-center rounded-3xl bg-[#111122]">
            <Text className="mb-3 text-5xl">✅</Text>
            <Text className="font-opendyslexic-bold text-sm text-success">Berhasil!</Text>
          </View>

          <View className="mb-4 rounded-3xl border border-border bg-surface p-5">
            <Text className="mb-3 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-primary">
              📄 TEKS TERDETEKSI
            </Text>
            <Text
              className="mb-4 font-opendyslexic text-text-main"
              numberOfLines={4}
              style={{ fontSize: 14, lineHeight: 14 * typeLevel.lineHeightRatio, letterSpacing: 0.4 }}>
              {detected}
            </Text>
            <View className="flex-row">
              <View className="mr-2 rounded-full bg-primary/10 px-3 py-1.5">
                <Text className="font-opendyslexic-bold text-[10px] text-primary">
                  {paragraphCount} paragraf
                </Text>
              </View>
              <View className="rounded-full bg-primary/10 px-3 py-1.5">
                <Text className="font-opendyslexic-bold text-[10px] text-primary">Tipografi otomatis</Text>
              </View>
            </View>
          </View>

          <View className="mb-5 rounded-3xl border border-border bg-surface p-5">
            <Text className="mb-4 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-primary">
              🔒 PREPROCESSING OTOMATIS
            </Text>
            {PREPROCESSING_STEPS.map((step, index) => {
              const done = index < stepsDone;
              return (
                <View key={step} className="mb-3 flex-row items-center" style={{ opacity: done ? 1 : 0.35 }}>
                  <View
                    className={`mr-3 h-5 w-5 items-center justify-center rounded-md ${
                      done ? 'bg-success' : 'bg-surface-alt'
                    }`}>
                    {done ? <Check size={12} color="#FFFFFF" /> : null}
                  </View>
                  <Text className="flex-1 font-opendyslexic text-xs text-text-main">{step}</Text>
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={openReader}
            accessibilityRole="button"
            className="mb-3 flex-row items-center justify-center rounded-2xl bg-primary py-4">
            <Text className="mr-2 font-opendyslexic-bold text-base text-white">Buka & Baca Sekarang</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={resetScan} accessibilityRole="button" className="rounded-2xl py-3">
            <Text className="text-center font-opendyslexic-bold text-xs text-text-muted">
              ← Pindai dokumen lain
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          {/* Pilihan sumber */}
          <View className="mb-5 flex-row rounded-2xl border border-border bg-surface p-1">
            <SourceTab
              active={tab === 'camera'}
              onPress={() => setTab('camera')}
              icon={<CameraIcon size={15} color={tab === 'camera' ? '#FFFFFF' : colors.textMuted} />}
              label="Kamera"
            />
            <SourceTab
              active={tab === 'upload'}
              onPress={() => setTab('upload')}
              icon={<Upload size={15} color={tab === 'upload' ? '#FFFFFF' : colors.textMuted} />}
              label="Unggah"
            />
          </View>

          {/* Pratinjau */}
          <View className="mb-5 aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#111122]">
            {tab === 'camera' ? (
              <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
                <View className="flex-1 items-center justify-center">
                  <View className="h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-white/50">
                    <ScanLine size={26} color="rgba(255,255,255,0.6)" />
                  </View>
                  <Text className="mt-4 font-opendyslexic text-xs text-white/70">Arahkan ke dokumen</Text>
                </View>
              </CameraView>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Upload size={44} color={colors.primary} />
                <Text className="mt-4 font-opendyslexic text-xs text-white/70">PDF, JPG, atau PNG</Text>
              </View>
            )}
          </View>

          {/* Tips */}
          <View className="mb-5 rounded-3xl border border-border bg-surface p-5">
            <Text className="mb-4 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-primary">
              TIPS SCAN TERBAIK
            </Text>
            {SCAN_TIPS.map((tip) => (
              <View key={tip} className="mb-3 flex-row items-center">
                <View className="mr-3 rounded-full bg-primary/10 p-1">
                  <Check size={11} color={colors.primary} />
                </View>
                <Text className="flex-1 font-opendyslexic text-xs text-text-main">{tip}</Text>
              </View>
            ))}
          </View>

          {tab === 'camera' ? (
            <Pressable
              onPress={handleScan}
              disabled={phase === 'scanning'}
              accessibilityRole="button"
              className={`flex-row items-center justify-center rounded-2xl py-4 ${
                phase === 'scanning' ? 'bg-primary/50' : 'bg-primary'
              }`}>
              {phase === 'scanning' ? <ActivityIndicator color="#FFFFFF" className="mr-3" /> : null}
              <Text className="font-opendyslexic-bold text-base text-white">
                {phase === 'scanning' ? 'Memproses…' : 'Mulai Scan 📸'}
              </Text>
            </Pressable>
          ) : (
            <View className="rounded-2xl border border-border bg-surface-alt py-4">
              <Text className="text-center font-opendyslexic text-xs text-text-muted">
                Unggah berkas belum aktif — gunakan tab Kamera dulu.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${active ? 'bg-primary' : ''}`}>
      {icon}
      <Text
        className={`ml-2 font-opendyslexic-bold text-sm ${active ? 'text-white' : 'text-text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
