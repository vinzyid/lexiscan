import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BackHandler, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, HandHelping } from 'lucide-react-native';
import { create } from 'zustand';

import { useT } from '../i18n';
import { useSpeech } from '../speech/use-speech';
import { GRADIENTS } from '../theme/palettes';
import { useThemeColors } from '../theme/theme-provider';
import { Portal } from './portal';
import { PressableScale } from './pressable-scale';
import { SpeakButton } from './speak-button';

/**
 * Tur pendamping: layar diredupkan, tombol yang sedang dibahas dibiarkan
 * terang, dan gelembung di dekatnya menjelaskan GUNANYA.
 *
 * Ditujukan ke guru atau orang tua yang mendampingi saat mendaftar. Panduan
 * berupa daftar teks sudah dicoba dan tidak dibaca: pendamping perlu melihat
 * tombolnya di layar yang sebenarnya, bukan membayangkannya dari kalimat.
 *
 * Sasaran tur ditandai dengan `TourTarget` di layar masing-masing. Langkah yang
 * sasarannya tidak ada (mis. tombol suara saat suara dimatikan) dilewati.
 */

/** Tahap tur. Tiap tahap hidup di layarnya sendiri. */
export type TourStage = 'tabs' | 'reader';

export const useTourStore = create<{
  stage: TourStage | null;
  start: () => void;
  setStage: (stage: TourStage | null) => void;
}>()((set) => ({
  stage: null,
  start: () => set({ stage: 'tabs' }),
  setStage: (stage) => set({ stage }),
}));

const targets = new Map<string, React.RefObject<View | null>>();

/**
 * Menandai elemen yang bisa disorot tur. Tidak mengubah tata letak isinya.
 * Tanpa `id` ia hanya pembungkus biasa, untuk komponen yang sebagian
 * pemakaiannya saja yang ikut tur.
 */
export function TourTarget({
  id,
  style,
  children,
}: {
  id?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const ref = useRef<View>(null);

  useEffect(() => {
    if (!id) return;

    targets.set(id, ref);

    return () => {
      if (targets.get(id) === ref) targets.delete(id);
    };
  }, [id]);

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

export type TourStep = {
  /** `null` untuk kartu di tengah layar tanpa sorotan, mis. salam pembuka. */
  target: string | null;
  title: string;
  body: string;
};

type Rect = { x: number; y: number; width: number; height: number };

/** Sasaran yang baru terpasang (mis. sesudah pindah layar) ditunggu sebentar. */
const MEASURE_RETRIES = 12;
const MEASURE_INTERVAL_MS = 80;
const HOLE_PADDING = 6;
const DIM = 'rgba(17, 12, 40, 0.74)';

export function SpotlightTour({
  steps,
  counterOffset = 0,
  counterTotal,
  onFinish,
}: {
  steps: TourStep[];
  /** Nomor langkah pertama tahap ini di hitungan seluruh tur. */
  counterOffset?: number;
  counterTotal?: number;
  /** `true` kalau sampai di langkah terakhir, `false` kalau dilewati. */
  onFinish: (completed: boolean) => void;
}) {
  const t = useT();
  const colors = useThemeColors();
  const { stop } = useSpeech();

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  /** Hasil ukur, beserta langkah pemiliknya: hasil langkah lain berarti belum siap. */
  const [measured, setMeasured] = useState<{ index: number; hole: Rect } | null>(null);
  const [root, setRoot] = useState<Rect | null>(null);
  const rootRef = useRef<View>(null);

  const step = steps[index];
  const target = step?.target ?? null;
  const ready = target === null ? root !== null : measured?.index === index;
  const hole = target !== null && measured?.index === index ? measured.hole : null;

  const goTo = useCallback(
    (next: number, dir: 1 | -1) => {
      stop();
      setDirection(dir);

      if (next >= steps.length) onFinish(true);
      // Mundur dari langkah pertama yang sasarannya hilang: maju saja.
      else if (next < 0) setIndex((current) => current + 1);
      else setIndex(next);
    },
    [onFinish, steps.length, stop],
  );

  const skip = useCallback(() => {
    stop();
    onFinish(false);
  }, [onFinish, stop]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      skip();

      return true;
    });

    return () => sub.remove();
  }, [skip]);

  /*
   * Posisi diukur di jendela, lalu dikurangi posisi lapisan ini sendiri: di
   * sebagian HP Android jendela dihitung mulai di bawah bilah status, di HP
   * lain tidak, dan selisih keduanya menggeser sorotannya.
   */
  useEffect(() => {
    if (target === null || !root) return;

    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;

    const measure = () => {
      const node = targets.get(target)?.current;
      if (!node) {
        tries += 1;
        if (tries < MEASURE_RETRIES) timer = setTimeout(measure, MEASURE_INTERVAL_MS);
        else goTo(index + direction, direction);

        return;
      }

      node.measureInWindow((x, y, width, height) => {
        if (!alive) return;

        if (width === 0 || height === 0) {
          tries += 1;
          if (tries < MEASURE_RETRIES) timer = setTimeout(measure, MEASURE_INTERVAL_MS);
          else goTo(index + direction, direction);

          return;
        }

        setMeasured({
          index,
          hole: {
            x: x - root.x - HOLE_PADDING,
            y: y - root.y - HOLE_PADDING,
            width: width + HOLE_PADDING * 2,
            height: height + HOLE_PADDING * 2,
          },
        });
      });
    };

    timer = setTimeout(measure, MEASURE_INTERVAL_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [target, root, index, direction, goTo]);

  if (!step) return null;

  const total = counterTotal ?? steps.length;
  const number = counterOffset + index + 1;
  const isLast = number === total;

  // Gelembung di sisi yang lebih lega: di bawah sasaran yang ada di separuh
  // atas layar, di atas sasaran yang ada di separuh bawah.
  const below = hole !== null && root !== null && hole.y + hole.height / 2 < root.height / 2;

  const bubblePosition: ViewStyle =
    hole === null || root === null
      ? { top: 0, bottom: 0, justifyContent: 'center' }
      : below
        ? { top: hole.y + hole.height + 14 }
        : { bottom: root.height - hole.y + 14 };

  return (
    <Portal>
      <View
        ref={rootRef}
        style={StyleSheet.absoluteFill}
        onLayout={() =>
          rootRef.current?.measureInWindow((x, y, width, height) =>
            setRoot({ x, y, width, height }),
          )
        }>
        {/* Empat potong redup di sekeliling sorotan, sehingga yang disorot
            tetap terlihat dengan warna aslinya. */}
        {hole && ready ? (
          <>
            <View style={[styles.dim, { top: 0, left: 0, right: 0, height: Math.max(0, hole.y) }]} />
            <View style={[styles.dim, { top: hole.y + hole.height, left: 0, right: 0, bottom: 0 }]} />
            <View
              style={[styles.dim, { top: hole.y, height: hole.height, left: 0, width: Math.max(0, hole.x) }]}
            />
            <View
              style={[
                styles.dim,
                { top: hole.y, height: hole.height, left: hole.x + hole.width, right: 0 },
              ]}
            />
            {/* Bingkai sorotan. Ia juga menahan ketukan: selama tur, tombol
                yang disorot hanya untuk dilihat. */}
            <View
              style={{
                position: 'absolute',
                left: hole.x,
                top: hole.y,
                width: hole.width,
                height: hole.height,
                borderRadius: 18,
                borderWidth: 3,
                borderColor: '#fbbf24',
              }}
            />
          </>
        ) : (
          <View style={[styles.dim, StyleSheet.absoluteFill]} />
        )}

        {ready ? (
          <Animated.View
            key={index}
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(120)}
            style={[{ position: 'absolute', left: 16, right: 16 }, bubblePosition]}>
            <View
              className="rounded-[24px] bg-surface p-5"
              style={{
                shadowColor: '#000000',
                shadowOpacity: 0.25,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 12,
              }}>
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-primary/10">
                  <HandHelping size={18} color={colors.primary} />
                </View>
                <Text className="flex-1 font-ui-semibold text-[12px] text-text-muted">
                  {t.tour.counter(number, total)}
                </Text>
                <SpeakButton
                  text={`${step.title}. ${step.body}`}
                  speechKey={`tour:${number}`}
                  size={16}
                />
              </View>

              <Text className="mt-3 font-ui-bold text-[19px] leading-7 text-text-main">
                {step.title}
              </Text>
              <Text className="mt-1.5 font-ui-medium text-[15px] leading-6 text-text-muted">
                {step.body}
              </Text>

              <View className="mt-4 flex-row items-center" style={{ gap: 8 }}>
                {!isLast ? (
                  <PressableScale
                    onPress={skip}
                    accessibilityRole="button"
                    accessibilityLabel={t.tour.skip}
                    scaleTo={0.95}
                    className="h-12 justify-center px-2">
                    <Text className="font-ui-bold text-[15px] text-text-muted">{t.tour.skip}</Text>
                  </PressableScale>
                ) : null}

                <View className="flex-1" />

                {index > 0 ? (
                  <PressableScale
                    onPress={() => goTo(index - 1, -1)}
                    accessibilityRole="button"
                    accessibilityLabel={t.tour.back}
                    scaleTo={0.93}
                    className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-alt">
                    <ArrowLeft size={18} color={colors.textMuted} />
                  </PressableScale>
                ) : null}

                <PressableScale
                  onPress={() => goTo(index + 1, 1)}
                  accessibilityRole="button"
                  accessibilityLabel={isLast ? t.tour.done : t.tour.next}
                  scaleTo={0.96}
                  className="overflow-hidden rounded-2xl">
                  <LinearGradient
                    colors={[...GRADIENTS.activePill.colors]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 48,
                      paddingHorizontal: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <Text className="font-ui-bold text-[16px] text-white">
                      {isLast ? t.tour.done : t.tour.next}
                    </Text>
                    {!isLast ? <ArrowRight size={16} color="#ffffff" strokeWidth={3} /> : null}
                  </LinearGradient>
                </PressableScale>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dim: { position: 'absolute', backgroundColor: DIM },
});
