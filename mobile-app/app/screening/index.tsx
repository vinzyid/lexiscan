import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Check,
  ClipboardList,
  Info,
  RotateCcw,
  ShieldCheck,
  Volume2,
} from 'lucide-react-native';

import { SCREENING_ITEMS } from '../../src/data/screening-items';
import {
  SCREENING_OBSERVATIONS,
  type MarkerLevel,
  type ScreeningDomain,
} from '../../src/theme/screening';
import { useT } from '../../src/i18n';
import { useSpeech, useStopSpeechOnUnmount } from '../../src/speech/use-speech';
import { useThemeColors } from '../../src/theme/theme-provider';
import { ScreenBackdrop } from '../../src/components/figma-decor';
import { PressableScale } from '../../src/components/pressable-scale';

/**
 * Cek Awal Risiko Disleksia — dipandu pendamping.
 *
 * SATU LAYAR, EMPAT TAHAP. Pengantar untuk pendamping, butir terpandu, lembar
 * observasi, lalu catatan hasil. Dipisah jadi berkas sendiri kalau nanti
 * butirnya bertambah banyak dan tiap tahap perlu ruangnya.
 *
 * YANG PALING PENTING DI BERKAS INI ADALAH APA YANG TIDAK ADA DI DALAMNYA.
 * Anak tidak menekan jawaban; ia bersuara, pendamping yang menandai seberapa
 * lancar. Tidak ada skor, tidak ada persentil, tidak ada kata "terdeteksi", dan
 * tidak ada benar/salah. Tiap butir hanya dicatat "lancar / ragu / belum", lalu
 * di akhir ditampilkan sebagai catatan supaya dibawa ke tenaga ahli. Begitu
 * salah satu dari itu ditambahkan, halaman ini berubah jadi penilai — dan itu
 * bukan tempatnya.
 */
type Stage = 'intro' | 'items' | 'observations' | 'result';

export default function ScreeningScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>('intro');
  const [index, setIndex] = useState(0);
  /** Satu entri per butir: hasil pengamatan pendamping atas jawaban anak. */
  const [marks, setMarks] = useState<MarkerLevel[]>([]);
  /** Tanda sehari-hari yang dicentang pendamping. */
  const [observed, setObserved] = useState<Set<string>>(new Set());

  useStopSpeechOnUnmount();

  const start = () => {
    setMarks([]);
    setObserved(new Set());
    setIndex(0);
    setStage('items');
  };

  const mark = (level: MarkerLevel) => {
    setMarks((prev) => {
      const next = [...prev];
      next[index] = level;
      return next;
    });

    if (index + 1 < SCREENING_ITEMS.length) {
      setIndex(index + 1);
    } else {
      setStage('observations');
    }
  };

  const toggleObservation = (id: string) => {
    setObserved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />

      {stage === 'intro' ? (
        <IntroScreen insetsTop={insets.top} onStart={start} onLater={() => router.back()} />
      ) : null}

      {stage === 'items' ? (
        <ItemScreen
          insetsTop={insets.top}
          index={index}
          marks={marks}
          onMark={mark}
          onBack={() => (index > 0 ? setIndex(index - 1) : setStage('intro'))}
        />
      ) : null}

      {stage === 'observations' ? (
        <ObserveScreen
          insetsTop={insets.top}
          observed={observed}
          onToggle={toggleObservation}
          onContinue={() => setStage('result')}
          onBack={() => setStage('items')}
        />
      ) : null}

      {stage === 'result' ? (
        <ResultScreen
          insetsTop={insets.top}
          marks={marks}
          observed={observed}
          onAgain={start}
          onDone={() => router.back()}
        />
      ) : null}
    </View>
  );
}

/* ── Pengantar (untuk pendamping) ────────────────────────────────────────── */

function IntroScreen({
  insetsTop,
  onStart,
  onLater,
}: {
  insetsTop: number;
  onStart: () => void;
  onLater: () => void;
}) {
  const t = useT();
  const colors = useThemeColors();

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insetsTop + 20, paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>
      <View className="mb-5 h-14 w-14 items-center justify-center rounded-3xl bg-primary/10">
        <ShieldCheck size={26} color={colors.primary} />
      </View>

      <Text className="font-ui-bold text-[25px] leading-[33px] text-text-main">
        {t.screening.introTitle}
      </Text>
      <Text className="mt-3 font-ui-medium text-[16px] leading-[24px] text-text-muted">
        {t.screening.introLead}
      </Text>

      <View className="mt-6 rounded-3xl border border-border/10 bg-surface p-5" style={{ gap: 14 }}>
        {t.screening.introPoints.map((point) => (
          <View key={point} className="flex-row" style={{ gap: 12 }}>
            <Info size={17} color={colors.primary} style={{ marginTop: 2 }} />
            <Text className="flex-1 font-ui-medium text-[15px] leading-[22px] text-text-main">
              {point}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-7" style={{ gap: 8 }}>
        <PressableScale
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel={t.screening.introStart}
          className="items-center rounded-2xl bg-primary py-4">
          <Text className="font-ui-bold text-[16px] text-white">{t.screening.introStart}</Text>
        </PressableScale>
        <PressableScale
          onPress={onLater}
          accessibilityRole="button"
          accessibilityLabel={t.screening.introLater}
          className="items-center rounded-2xl bg-primary/[0.08] py-4">
          <Text className="font-ui-bold text-[16px] text-primary">{t.screening.introLater}</Text>
        </PressableScale>
      </View>
    </ScrollView>
  );
}

/* ── Butir terpandu ──────────────────────────────────────────────────────── */

function ItemScreen({
  insetsTop,
  index,
  marks,
  onMark,
  onBack,
}: {
  insetsTop: number;
  index: number;
  marks: MarkerLevel[];
  onMark: (level: MarkerLevel) => void;
  onBack: () => void;
}) {
  const t = useT();
  const colors = useThemeColors();
  const { speak } = useSpeech();

  const item = SCREENING_ITEMS[index];
  const current = marks[index];

  /*
   * Tombol ini opsional: pendamping sudah bisa membaca kata pemicunya sendiri.
   * Tapi sebagian anak mau mendengar kata itu dulu sebelum menirukan, jadi
   * menyediakannya lebih ramah daripada memaksa pendamping menirukan suaranya.
   */
  const play = () => {
    if (item.trigger) speak(item.trigger, `screening:${item.id}`);
  };

  const choices: { level: MarkerLevel; label: string; tone: 'success' | 'warm' | 'danger' }[] = [
    { level: 'lancar', label: t.screening.markLancar, tone: 'success' },
    { level: 'ragu', label: t.screening.markRagu, tone: 'warm' },
    { level: 'belum', label: t.screening.markBelum, tone: 'danger' },
  ];

  const toneColor = (tone: 'success' | 'warm' | 'danger') =>
    tone === 'success' ? colors.success : tone === 'warm' ? colors.warm : colors.primaryDeep;

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insetsTop + 16, paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>
      <Text className="font-ui-bold text-[13px] text-text-muted">
        {t.screening.stepLabel(index + 1, SCREENING_ITEMS.length)}
      </Text>

      {/* Arahan untuk pendamping — ini yang dibaca dulu sebelum bertindak. */}
      <View className="mt-4 rounded-3xl border border-border/10 bg-surface p-5">
        <View className="mb-3 flex-row items-center self-start rounded-full bg-primary/[0.1] px-3 py-1" style={{ gap: 6 }}>
          <ClipboardList size={13} color={colors.primary} />
          <Text className="font-ui-bold text-[12px] text-primary">{t.screening.listenChip}</Text>
        </View>

        <Text className="font-ui-semibold text-[17px] leading-[25px] text-text-main">
          {item.instruction}
        </Text>

        {item.trigger ? (
          <View className="mt-4 flex-row items-center rounded-2xl border border-border/10 bg-background px-4 py-3" style={{ gap: 12 }}>
            {/*
             * KATA PEMICU WAJIB DITAMPILKAN UTUH — sengaja memakai `Text`, BUKAN
             * `DyslexicText`. Di layar Baca pemenggalan suku kata memang membantu,
             * tapi di sini justru merusak tesnya: yang diukur adalah kemampuan
             * anak MEMENGGAL SENDIRI, jadi kalau kata sudah dipisah "ma-lo-ra"
             * anak tinggal menirukan, dan butir kata non-kata malah membocorkan
             * jumlah sukukatanya. Jangan diganti ke `DyslexicText` demi
             * "konsistensi" — komponen itu ada untuk layar Baca, bukan di sini.
             * Suaranya pun sudah utuh, lihat `speech-service.ts`.
             */}
            <Text className="flex-1 font-ui-bold text-[21px] text-primary">{item.trigger}</Text>
            <PressableScale
              onPress={play}
              accessibilityRole="button"
              accessibilityLabel={t.screening.replay}
              scaleTo={0.9}
              className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Volume2 size={18} color={colors.primary} />
            </PressableScale>
          </View>
        ) : null}

        <Text className="mt-4 font-ui-medium text-[13px] leading-[19px] text-text-muted">
          {t.screening.expectLabel}: {item.expect}
        </Text>

        {/*
         * Catatan penjelas, terutama untuk kata non-kata. Tanpa ini, pendamping
         * wajar mengira anaknya salah karena katanya tidak dikenali.
         */}
        {item.note ? (
          <View className="mt-4 flex-row rounded-2xl border border-primary/20 bg-primary/[0.08] p-3" style={{ gap: 10 }}>
            <Info size={15} color={colors.primary} style={{ marginTop: 1 }} />
            <Text className="flex-1 font-ui-medium text-[13px] leading-[19px] text-primary">
              {item.note}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Penilaian pendamping. */}
      <Text className="mt-5 font-ui-bold text-[14px] text-text-main">{t.screening.howDidItGo}</Text>
      <View className="mt-3" style={{ gap: 10 }}>
        {choices.map((choice) => {
          const selected = current === choice.level;
          return (
            <PressableScale
              key={choice.level}
              onPress={() => onMark(choice.level)}
              accessibilityRole="button"
              accessibilityLabel={choice.label}
              className={`flex-row items-center justify-between rounded-2xl border-2 px-4 py-4 ${
                selected ? 'border-primary bg-primary/[0.08]' : 'border-border/10 bg-surface-alt'
              }`}>
              <Text className="font-ui-bold text-[17px] text-text-main">{choice.label}</Text>
              <View
                className="h-6 w-6 items-center justify-center rounded-full border-2"
                style={{ borderColor: toneColor(choice.tone) }}>
                {selected ? <View className="h-3 w-3 rounded-full" style={{ backgroundColor: toneColor(choice.tone) }} /> : null}
              </View>
            </PressableScale>
          );
        })}
      </View>

      <PressableScale
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t.screening.previous}
        className="mt-5 items-center rounded-2xl bg-primary/[0.08] py-3">
        <Text className="font-ui-bold text-[14px] text-primary">{t.screening.previous}</Text>
      </PressableScale>
    </ScrollView>
  );
}

/* ── Lembar observasi ────────────────────────────────────────────────────── */

function ObserveScreen({
  insetsTop,
  observed,
  onToggle,
  onContinue,
  onBack,
}: {
  insetsTop: number;
  observed: Set<string>;
  onToggle: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const t = useT();

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insetsTop + 20, paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>
      <Text className="font-ui-bold text-[23px] leading-[31px] text-text-main">
        {t.screening.obsTitle}
      </Text>
      <Text className="mt-3 font-ui-medium text-[15px] leading-[23px] text-text-muted">
        {t.screening.obsLead}
      </Text>

      <View className="mt-5" style={{ gap: 10 }}>
        {SCREENING_OBSERVATIONS.map((obs) => {
          const checked = observed.has(obs.id);
          return (
            <PressableScale
              key={obs.id}
              onPress={() => onToggle(obs.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={obs.label}
              className={`flex-row items-center rounded-2xl border-2 p-4 ${
                checked ? 'border-primary bg-primary/[0.08]' : 'border-border/10 bg-surface-alt'
              }`}
              style={{ gap: 12 }}>
              <View
                className={`h-6 w-6 items-center justify-center rounded-lg border-2 ${
                  checked ? 'border-primary bg-primary' : 'border-border/30 bg-surface'
                }`}>
                {checked ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
              </View>
              <Text className="flex-1 font-ui-medium text-[15px] leading-[22px] text-text-main">
                {obs.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <View className="mt-6" style={{ gap: 8 }}>
        <PressableScale
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel={t.screening.obsContinue}
          className="items-center rounded-2xl bg-primary py-4">
          <Text className="font-ui-bold text-[16px] text-white">{t.screening.obsContinue}</Text>
        </PressableScale>
        <PressableScale
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t.screening.previous}
          className="items-center rounded-2xl bg-primary/[0.08] py-4">
          <Text className="font-ui-bold text-[16px] text-primary">{t.screening.previous}</Text>
        </PressableScale>
      </View>
    </ScrollView>
  );
}

/* ── Catatan hasil ───────────────────────────────────────────────────────── */

function ResultScreen({
  insetsTop,
  marks,
  observed,
  onAgain,
  onDone,
}: {
  insetsTop: number;
  marks: MarkerLevel[];
  observed: Set<string>;
  onAgain: () => void;
  onDone: () => void;
}) {
  const t = useT();
  const colors = useThemeColors();

  /*
   * Dua sumber tanda digabung, dan keduanya sama-sama hanya "catatan":
   *  - dari kegiatan: domain yang jawabannya "ragu" atau "belum";
   *  - dari pengamatan: tanda sehari-hari yang dicentang pendamping.
   * Tidak ada yang dijumlahkan jadi skor. Yang dihitung hanya ada-tidaknya tanda
   * untuk memilih kata pengantar di layar hasil.
   */
  const flaggedDomains = new Set<ScreeningDomain>(
    SCREENING_ITEMS.filter((_, i) => marks[i] === 'ragu' || marks[i] === 'belum').map(
      (item) => item.domain,
    ),
  );
  const observedCount = observed.size;
  const hasSigns = flaggedDomains.size > 0 || observedCount > 0;

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insetsTop + 20, paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>
      <View
        className={`mb-5 h-14 w-14 items-center justify-center rounded-3xl ${
          hasSigns ? 'bg-warm/15' : 'bg-success/15'
        }`}>
        <AlertCircle size={26} color={hasSigns ? colors.warm : colors.success} />
      </View>

      <Text className="font-ui-bold text-[23px] leading-[31px] text-text-main">
        {hasSigns ? t.screening.resultFlagsTitle : t.screening.resultClearTitle}
      </Text>
      <Text className="mt-3 font-ui-medium text-[15px] leading-[23px] text-text-muted">
        {hasSigns ? t.screening.resultFlagsBody : t.screening.resultClearBody}
      </Text>

      {flaggedDomains.size > 0 ? (
        <View className="mt-5 rounded-3xl border border-border/10 bg-surface p-5" style={{ gap: 12 }}>
          <Text className="font-ui-bold text-[13px] uppercase text-text-muted" style={{ letterSpacing: 1 }}>
            {t.screening.resultTaskSection}
          </Text>
          {[...flaggedDomains].map((domain) => (
            <View key={domain} className="flex-row items-center" style={{ gap: 10 }}>
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.warm }} />
              <Text className="font-ui-semibold text-[16px] text-text-main">
                {t.screening.domainNames[domain]}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {observedCount > 0 ? (
        <View className="mt-3 rounded-3xl border border-border/10 bg-surface p-5" style={{ gap: 12 }}>
          <Text className="font-ui-bold text-[13px] uppercase text-text-muted" style={{ letterSpacing: 1 }}>
            {t.screening.resultObsSection}
          </Text>
          {SCREENING_OBSERVATIONS.filter((obs) => observed.has(obs.id)).map((obs) => (
            <View key={obs.id} className="flex-row" style={{ gap: 10 }}>
              <View className="mt-[7px] h-2 w-2 rounded-full" style={{ backgroundColor: colors.warm }} />
              <Text className="flex-1 font-ui-medium text-[15px] leading-[21px] text-text-main">
                {obs.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-4 rounded-3xl border border-primary/20 bg-primary/[0.08] p-5">
        <Text className="font-ui-semibold text-[15px] leading-[23px] text-primary">
          {t.screening.resultConsult}
        </Text>
      </View>

      <View className="mt-4 flex-row items-center rounded-2xl border border-border/10 bg-surface-alt px-4 py-3" style={{ gap: 10 }}>
        <ShieldCheck size={16} color={colors.textMuted} />
        <Text className="flex-1 font-ui-medium text-[13px] leading-[19px] text-text-muted">
          {t.screening.resultDisclaimer}
        </Text>
      </View>

      <View className="mt-7" style={{ gap: 8 }}>
        <PressableScale
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel={t.screening.resultDone}
          className="items-center rounded-2xl bg-primary py-4">
          <Text className="font-ui-bold text-[16px] text-white">{t.screening.resultDone}</Text>
        </PressableScale>
        <PressableScale
          onPress={onAgain}
          accessibilityRole="button"
          accessibilityLabel={t.screening.resultAgain}
          className="flex-row items-center justify-center rounded-2xl bg-primary/[0.08] py-4"
          style={{ gap: 8 }}>
          <RotateCcw size={16} color={colors.primary} />
          <Text className="font-ui-bold text-[16px] text-primary">{t.screening.resultAgain}</Text>
        </PressableScale>
      </View>
    </ScrollView>
  );
}
