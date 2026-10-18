import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import * as DocumentPicker from 'expo-document-picker';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { ArrowLeft } from 'lucide-react-native';

import { BatteryMeter, type BatterySample } from '../modules/battery-meter';
import { postJson } from '../src/api/ai';
import { PressableScale } from '../src/components/pressable-scale';
import {
  currentDivisor,
  hasCurrentSensor,
  meanSd,
  milliJoulesToMilliWattHours,
  phaseStats,
  type PhaseStats,
} from '../src/energy/power';
import { speak, stop } from '../src/speech/speech-service';
import { useThemeColors } from '../src/theme/theme-provider';
import { fileStamp, shareTextFile } from '../src/utils/share-file';

/**
 * Uji energi di HP: layar tersembunyi untuk tim, bukan untuk pengguna.
 *
 * Dibuka dengan menekan lama teks versi di bagian bawah layar Atur. Teksnya
 * sengaja tidak masuk `src/i18n`: layar ini alat ukur internal tim dan tidak
 * pernah dilihat siswa atau pendamping.
 *
 * Gunanya menjawab "klaim green computing belum berdasarkan pengukuran
 * langsung". Satu putaran mengukur lima keadaan berturut-turut dengan layar
 * yang sama:
 *
 *   1. diam, sebagai garis dasar yang dikurangkan dari semua keadaan lain;
 *   2. OCR berulang pada satu foto halaman;
 *   3. suara yang terus membacakan teks halaman itu;
 *   4. AI baru: Sederhanakan teks halaman itu dengan penanda yang selalu
 *      berbeda, jadi server pasti memanggil model;
 *   5. AI dari cache: teks halaman yang sama terus, jadi server menjawab dari
 *      simpanan.
 *
 * Tahap 3-5 memakai teks hasil OCR dari foto yang sama, dibaca sekali saat
 * foto dipilih. Fotonya tetap untuk semua putaran, jadi bebannya tetap
 * identik antarputaran tanpa teks buatan. Tidak ada teks cadangan: foto yang
 * teksnya terlalu sedikit ditolak, supaya hasilnya tidak pernah diam-diam
 * berasal dari campuran teks halaman dan teks contoh.
 *
 * Selisih 4 dan 5 adalah penghematan cache yang terukur di HP. Energi di pusat
 * data penyedia AI tidak bisa diukur dari luar, jadi bagian itu tetap diambil
 * dari taksiran yang dikirim server, dan ditampilkan terpisah.
 *
 * Sensor arus Android memperbarui nilainya sekitar sekali per detik (sebagian
 * merek lebih lambat), jadi tiap keadaan diukur cukup lama dan diulang dalam
 * beberapa putaran. Satu bacaan sesaat tidak berarti apa-apa.
 */

type Phase = 'idle' | 'ocr' | 'tts' | 'aiMiss' | 'aiHit';

const PHASES: Phase[] = ['idle', 'ocr', 'tts', 'aiMiss', 'aiHit'];

const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Diam (layar menyala)',
  ocr: 'OCR berulang',
  tts: 'Suara membacakan',
  aiMiss: 'AI baru (memanggil model)',
  aiHit: 'AI dari cache',
};

const SAMPLE_INTERVAL_MS = 500;
/** Jeda sebelum mulai mencatat, supaya sisa beban keadaan sebelumnya reda. */
const SETTLE_MS = 5_000;
const DURATIONS = [30, 60, 120] as const;

/**
 * Satu permintaan AI tiap 6 detik, sama untuk AI baru maupun cache. Iramanya
 * harus sama supaya yang dibandingkan hanya isi jawabannya, dan 10 per menit
 * masih di bawah batas server (20 per menit untuk endpoint AI).
 */
const AI_PERIOD_MS = 6_000;

/**
 * Batas panjang teks halaman. Di bawah 200 karakter (kira-kira satu paragraf
 * pendek) beban suara dan AI terlalu kecil untuk mewakili halaman buku. Di
 * atas 3.900 karakter Android menolak teksnya untuk TTS (batasnya 4.000), dan
 * sisa ruangnya untuk penanda unik tahap AI baru.
 */
const MIN_PAGE_CHARS = 200;
const MAX_PAGE_CHARS = 3_900;

/** Hasil satu permintaan AI, untuk membuktikan ia memang baru atau dari cache. */
type AiCall = { cached: boolean | null; serverWh: number; failed: boolean };

type PhaseRun = { samples: BatterySample[]; runs: number; calls: AiCall[] };

type Round = {
  divisor: 1 | 1000;
  stats: Record<Phase, PhaseStats>;
  runs: Record<Phase, number>;
  calls: { aiMiss: AiCall[]; aiHit: AiCall[] };
  samples: Record<Phase, BatterySample[]>;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fmt = (value: number, digits = 1) => value.toFixed(digits).replace('.', ',');

async function simplifyOnce(text: string): Promise<AiCall> {
  try {
    const json = await postJson('/api/simplify-text', { text, level: 'L3' });
    const footprint = json?.footprint;

    return {
      cached: typeof footprint?.cached === 'boolean' ? footprint.cached : null,
      serverWh: Number(footprint?.cached ? footprint?.avoided_energy_wh : footprint?.energy_wh) || 0,
      failed: false,
    };
  } catch {
    return { cached: null, serverWh: 0, failed: true };
  }
}

export default function EnergyTestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  const [imageUri, setImageUri] = useState<string | null>(null);
  // null selama foto belum dipilih atau masih dibaca.
  const [pageText, setPageText] = useState<string | null>(null);
  const [readingPage, setReadingPage] = useState(false);
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(60);
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState<Round[]>([]);
  const cancelled = useRef(false);

  // Dibaca ulang berkala supaya peringatan charger hilang begitu kabelnya dicabut.
  const [probe, setProbe] = useState<BatterySample | null>(() => BatteryMeter?.sample() ?? null);

  useEffect(() => {
    if (!BatteryMeter || running) return;

    const meter = BatteryMeter;
    const timer = setInterval(() => setProbe(meter.sample()), 2_000);

    return () => clearInterval(timer);
  }, [running]);

  const blocker = !BatteryMeter
    ? 'APK ini belum punya modul pengukur baterai. Pasang APK versi 1.3.0 atau lebih baru.'
    : probe && !hasCurrentSensor(probe)
      ? 'HP ini tidak menyediakan sensor arus baterai. Coba HP lain.'
      : probe?.plugged
        ? 'Cabut charger dulu. Saat mengisi daya, sensor membaca arus pengisian, bukan pemakaian.'
        : !imageUri
          ? 'Pilih satu foto halaman buku. Fotonya dipakai untuk tahap OCR, dan teksnya untuk tahap suara dan AI.'
          : readingPage || pageText === null
            ? 'Membaca teks foto...'
            : pageText.length < MIN_PAGE_CHARS
              ? `Teks di foto ini hanya ${pageText.length} karakter. Pilih halaman dengan minimal ${MIN_PAGE_CHARS} karakter (sekitar satu paragraf).`
              : pageText.length > MAX_PAGE_CHARS
                ? `Teks di foto ini ${pageText.length} karakter, melebihi batas suara Android. Pilih halaman yang lebih pendek atau potong fotonya.`
                : null;

  useEffect(
    () => () => {
      cancelled.current = true;
      void stop();
      deactivateKeepAwake('energy');
    },
    [],
  );

  const pickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setPageText(null);
    setReadingPage(true);

    try {
      setPageText((await TextRecognition.recognize(uri))?.text?.trim() ?? '');
    } catch {
      setPageText('');
    } finally {
      setReadingPage(false);
    }
  };

  /** Mencatat sensor selama durasi terpilih sambil `work` berjalan berulang. */
  const measure = async (
    phase: Phase,
    work: ((calls: AiCall[]) => Promise<void>) | null,
  ): Promise<PhaseRun> => {
    const meter = BatteryMeter;
    if (!meter) return { samples: [], runs: 0, calls: [] };

    setStatus(`${PHASE_LABEL[phase]}: menunggu ${SETTLE_MS / 1000} detik...`);
    await wait(SETTLE_MS);

    const samples: BatterySample[] = [];
    const calls: AiCall[] = [];
    let runs = 0;
    let active = true;

    setStatus(`${PHASE_LABEL[phase]}: mengukur ${duration} detik...`);
    const timer = setInterval(() => samples.push(meter.sample()), SAMPLE_INTERVAL_MS);

    const loop = (async () => {
      while (active && work && !cancelled.current) {
        await work(calls);
        runs += 1;
      }
    })();

    await wait(duration * 1000);
    active = false;
    clearInterval(timer);
    await stop();
    await loop;

    return { samples, runs, calls };
  };

  /** Satu permintaan AI, lalu menunggu sampai irama 6 detiknya habis. */
  const pacedCall = (text: () => string) => async (calls: AiCall[]) => {
    const started = Date.now();
    calls.push(await simplifyOnce(text()));
    await wait(Math.max(0, AI_PERIOD_MS - (Date.now() - started)));
  };

  const runRound = async () => {
    if (!imageUri || !pageText || blocker) return;
    const text = pageText;

    cancelled.current = false;
    setRunning(true);
    await activateKeepAwakeAsync('energy');

    try {
      const idle = await measure('idle', null);
      const ocr = await measure('ocr', async () => {
        await TextRecognition.recognize(imageUri);
      });
      const tts = await measure(
        'tts',
        () =>
          new Promise<void>((resolve) => {
            void speak(text, { language: 'id', rate: 1, onSettled: resolve });
          }),
      );

      // Penanda unik per permintaan: kunci cache server adalah sidik teksnya,
      // jadi teks yang selalu berbeda memaksa server memanggil model.
      const roundId = Date.now();
      let missIndex = 0;
      const aiMiss = await measure(
        'aiMiss',
        pacedCall(() => `${text} (Uji ${roundId}-${(missIndex += 1)})`),
      );

      // Satu permintaan pemanasan di luar pengukuran, supaya teksnya sudah ada di
      // cache server sebelum tahap cache dimulai.
      setStatus('Mengisi cache server...');
      await simplifyOnce(text);
      const aiHit = await measure(
        'aiHit',
        pacedCall(() => text),
      );

      if (cancelled.current) return;

      const phases: Record<Phase, PhaseRun> = { idle, ocr, tts, aiMiss, aiHit };
      const divisor = currentDivisor(PHASES.flatMap((phase) => phases[phase].samples));

      setRounds((previous) => [
        ...previous,
        {
          divisor,
          stats: {
            idle: phaseStats(idle.samples, divisor),
            ocr: phaseStats(ocr.samples, divisor),
            tts: phaseStats(tts.samples, divisor),
            aiMiss: phaseStats(aiMiss.samples, divisor),
            aiHit: phaseStats(aiHit.samples, divisor),
          },
          runs: {
            idle: 0,
            ocr: ocr.runs,
            tts: tts.runs,
            aiMiss: aiMiss.runs,
            aiHit: aiHit.runs,
          },
          calls: { aiMiss: aiMiss.calls, aiHit: aiHit.calls },
          samples: {
            idle: idle.samples,
            ocr: ocr.samples,
            tts: tts.samples,
            aiMiss: aiMiss.samples,
            aiHit: aiHit.samples,
          },
        },
      ]);
      setStatus('Putaran selesai.');
    } catch (e) {
      setStatus(`Gagal: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      deactivateKeepAwake('energy');
      setRunning(false);
    }
  };

  /** Energi tambahan per kejadian, tiap putaran. Daya diam sudah dikurangkan. */
  const perRound = rounds.map((round) => {
    const { idle, ocr, tts, aiMiss, aiHit } = round.stats;
    const net = (stats: PhaseStats) => stats.meanMw - idle.meanMw;
    /** mJ per kejadian = daya bersih x lama / jumlah kejadian. */
    const perRun = (stats: PhaseStats, runs: number) => (runs ? (net(stats) * stats.seconds) / runs : 0);
    const succeeded = (calls: AiCall[]) => calls.filter((call) => !call.failed);
    const misses = succeeded(round.calls.aiMiss);

    return {
      idleMw: idle.meanMw,
      ocrNetMw: net(ocr),
      ttsNetMw: net(tts),
      ocrPerPageMj: perRun(ocr, round.runs.ocr),
      ttsPerMinuteMj: net(tts) * 60,
      aiMissPerCallMj: perRun(aiMiss, round.calls.aiMiss.length),
      aiHitPerCallMj: perRun(aiHit, round.calls.aiHit.length),
      ocrRuns: round.runs.ocr,
      missCalls: round.calls.aiMiss.length,
      hitCalls: round.calls.aiHit.length,
      missVerified: misses.filter((call) => call.cached === false).length,
      hitVerified: round.calls.aiHit.filter((call) => call.cached === true).length,
      failed: [...round.calls.aiMiss, ...round.calls.aiHit].filter((call) => call.failed).length,
      serverWhPerMiss: misses.length
        ? misses.reduce((sum, call) => sum + call.serverWh, 0) / misses.length
        : 0,
    };
  });

  const summarize = (pick: (r: (typeof perRound)[number]) => number) => meanSd(perRound.map(pick));
  const asMwh = (value: { mean: number; sd: number }) => ({
    mean: milliJoulesToMilliWattHours(value.mean),
    sd: milliJoulesToMilliWattHours(value.sd),
  });

  const summary = {
    idleMw: summarize((r) => r.idleMw),
    ocrNetMw: summarize((r) => r.ocrNetMw),
    ttsNetMw: summarize((r) => r.ttsNetMw),
    ocrPerPage: asMwh(summarize((r) => r.ocrPerPageMj)),
    ttsPerMinute: asMwh(summarize((r) => r.ttsPerMinuteMj)),
    aiMissPerCall: asMwh(summarize((r) => r.aiMissPerCallMj)),
    aiHitPerCall: asMwh(summarize((r) => r.aiHitPerCallMj)),
    aiSavedPerCall: asMwh(summarize((r) => r.aiMissPerCallMj - r.aiHitPerCallMj)),
    serverWhPerMiss: summarize((r) => r.serverWhPerMiss),
  };

  const totals = perRound.reduce(
    (sum, r) => ({
      missCalls: sum.missCalls + r.missCalls,
      hitCalls: sum.hitCalls + r.hitCalls,
      missVerified: sum.missVerified + r.missVerified,
      hitVerified: sum.hitVerified + r.hitVerified,
      failed: sum.failed + r.failed,
    }),
    { missCalls: 0, hitCalls: 0, missVerified: 0, hitVerified: 0, failed: 0 },
  );

  const deviceLine = `${Device.manufacturer ?? '?'} ${Device.modelName ?? '?'}, Android ${Device.osVersion ?? '?'}`;

  const exportCsv = () => {
    const columns: [string, (r: (typeof perRound)[number]) => number][] = [
      ['diam_mW', (r) => r.idleMw],
      ['ocr_bersih_mW', (r) => r.ocrNetMw],
      ['suara_bersih_mW', (r) => r.ttsNetMw],
      ['ocr_kali', (r) => r.ocrRuns],
      ['ocr_per_halaman_mJ', (r) => r.ocrPerPageMj],
      ['suara_per_menit_mJ', (r) => r.ttsPerMinuteMj],
      ['ai_baru_kali', (r) => r.missCalls],
      ['ai_baru_terbukti_baru', (r) => r.missVerified],
      ['ai_baru_per_panggilan_mJ', (r) => r.aiMissPerCallMj],
      ['ai_cache_kali', (r) => r.hitCalls],
      ['ai_cache_terbukti_cache', (r) => r.hitVerified],
      ['ai_cache_per_panggilan_mJ', (r) => r.aiHitPerCallMj],
      ['ai_gagal', (r) => r.failed],
      ['taksiran_server_Wh_per_panggilan_baru', (r) => r.serverWhPerMiss],
    ];

    const lines = [
      `# Uji energi LexiScan, ${deviceLine}, ${new Date().toISOString()}`,
      `# durasi per keadaan ${duration} detik, jeda ${SETTLE_MS / 1000} detik, sampel tiap ${SAMPLE_INTERVAL_MS} ms, AI tiap ${AI_PERIOD_MS / 1000} detik`,
      `# teks halaman dari OCR foto, ${pageText?.length ?? 0} karakter, dipakai untuk tahap suara dan AI: ${JSON.stringify(pageText ?? '')}`,
      `# kolom *_mW dan *_mJ terukur dari sensor baterai HP; kolom taksiran_server dari faktor energi di server`,
      ['putaran', ...columns.map(([name]) => name)].join(','),
      ...perRound.map((r, i) =>
        [i + 1, ...columns.map(([, pick]) => pick(r).toFixed(4))].join(','),
      ),
      '',
      'putaran,keadaan,elapsed_ms,current_now,voltage_mV,charge_counter_uAh,temp_dC,level_pct',
      ...rounds.flatMap((round, i) =>
        PHASES.flatMap((phase) =>
          round.samples[phase].map((s) =>
            [
              i + 1,
              phase,
              s.elapsedMs,
              s.currentNow,
              s.voltageMilliVolts,
              s.chargeCounterMicroAmpHours,
              s.temperatureDeciCelsius,
              s.levelPercent,
            ].join(','),
          ),
        ),
      ),
    ];

    void shareTextFile(`uji-energi_${fileStamp()}.csv`, lines.join('\n'), 'text/csv');
  };

  const row = (label: string, value: { mean: number; sd: number }, unit: string, digits = 1) => (
    <View className="flex-row justify-between py-1.5" key={label}>
      <Text className="flex-1 font-ui-medium text-[14px] text-text-muted">{label}</Text>
      <Text className="font-ui-bold text-[14px] text-text-main">
        {fmt(value.mean, digits)} ± {fmt(value.sd, digits)} {unit}
      </Text>
    </View>
  );

  const heading = (label: string) => (
    <Text className="mb-1 mt-4 font-ui-bold text-[13px] uppercase text-text-muted">{label}</Text>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <PressableScale
            onPress={() => router.back()}
            disabled={running}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            className="h-11 w-11 items-center justify-center rounded-2xl bg-surface-alt">
            <ArrowLeft size={20} color={colors.textMuted} />
          </PressableScale>
          <Text className="font-ui-bold text-[22px] text-text-main">Uji Energi</Text>
        </View>

        <Text className="mt-4 font-ui-medium text-[14px] leading-6 text-text-muted">
          Sebelum mulai: cabut charger, nyalakan Wi-Fi, matikan data seluler dan Bluetooth, tutup
          aplikasi lain, dan atur kecerahan layar ke nilai tetap. Jangan sentuh HP selama putaran
          berjalan. Ulangi minimal 3 putaran.
        </Text>
        <Text className="mt-2 font-ui-medium text-[13px] text-text-muted">{deviceLine}</Text>

        <PressableScale
          onPress={() => router.push('/lafal')}
          disabled={running}
          accessibilityRole="button"
          className="mt-3 h-11 items-center justify-center self-start rounded-2xl bg-surface-alt px-4">
          <Text className="font-ui-bold text-[14px] text-text-main">Uji lafal suku kata</Text>
        </PressableScale>

        <PressableScale
          onPress={() => router.push('/ocr-test')}
          disabled={running}
          accessibilityRole="button"
          className="mt-2 h-11 items-center justify-center self-start rounded-2xl bg-surface-alt px-4">
          <Text className="font-ui-bold text-[14px] text-text-main">Uji akurasi OCR</Text>
        </PressableScale>

        <View className="mt-5 rounded-3xl bg-surface p-4" style={{ gap: 12 }}>
          <PressableScale
            onPress={pickImage}
            disabled={running || readingPage}
            accessibilityRole="button"
            className="h-12 items-center justify-center rounded-2xl bg-surface-alt">
            <Text className="font-ui-bold text-[15px] text-text-main">
              {imageUri ? 'Ganti foto halaman' : 'Pilih foto halaman'}
            </Text>
          </PressableScale>

          {pageText ? (
            <Text className="font-ui-medium text-[13px] leading-5 text-text-muted" numberOfLines={3}>
              Teks halaman ({pageText.length} karakter): {pageText}
            </Text>
          ) : null}

          <View className="flex-row" style={{ gap: 8 }}>
            {DURATIONS.map((seconds) => (
              <PressableScale
                key={seconds}
                onPress={() => setDuration(seconds)}
                disabled={running}
                accessibilityRole="radio"
                accessibilityState={{ selected: duration === seconds }}
                wrapperStyle={{ flex: 1 }}
                className={`h-11 items-center justify-center rounded-2xl ${
                  duration === seconds ? 'bg-primary' : 'bg-surface-alt'
                }`}>
                <Text
                  className={`font-ui-bold text-[14px] ${
                    duration === seconds ? 'text-white' : 'text-text-main'
                  }`}>
                  {seconds} dtk
                </Text>
              </PressableScale>
            ))}
          </View>

          <Text className="font-ui-medium text-[13px] text-text-muted">
            Satu putaran sekitar {Math.ceil((PHASES.length * (duration + SETTLE_MS / 1000) + 10) / 60)}{' '}
            menit.
          </Text>

          {blocker ? (
            <Text className="font-ui-medium text-[14px] leading-6 text-text-main">{blocker}</Text>
          ) : null}

          <PressableScale
            onPress={runRound}
            disabled={running || blocker !== null}
            accessibilityRole="button"
            className={`h-14 items-center justify-center rounded-2xl ${
              running || blocker ? 'bg-surface-alt' : 'bg-primary'
            }`}>
            <Text
              className={`font-ui-bold text-[16px] ${
                running || blocker ? 'text-text-muted' : 'text-white'
              }`}>
              {running ? 'Sedang mengukur...' : `Mulai putaran ${rounds.length + 1}`}
            </Text>
          </PressableScale>

          {status ? (
            <Text className="font-ui-medium text-[14px] text-text-muted">{status}</Text>
          ) : null}
        </View>

        {rounds.length > 0 ? (
          <View className="mt-5 rounded-3xl bg-surface p-4">
            <Text className="font-ui-bold text-[17px] text-text-main">
              Hasil ({rounds.length} putaran)
            </Text>

            {heading('Terukur di HP')}
            {row('Daya saat diam', summary.idleMw, 'mW', 0)}
            {row('Tambahan daya OCR', summary.ocrNetMw, 'mW', 0)}
            {row('Tambahan daya suara', summary.ttsNetMw, 'mW', 0)}
            {row('Energi per halaman OCR', summary.ocrPerPage, 'mWh', 3)}
            {row('Energi per menit suara', summary.ttsPerMinute, 'mWh', 3)}
            {row('Per panggilan AI baru', summary.aiMissPerCall, 'mWh', 3)}
            {row('Per panggilan AI dari cache', summary.aiHitPerCall, 'mWh', 3)}
            {row('Dihemat cache per panggilan', summary.aiSavedPerCall, 'mWh', 3)}

            {heading('Taksiran pusat data (dari server)')}
            {row('Per panggilan AI baru', summary.serverWhPerMiss, 'Wh', 3)}

            {heading('Bukti panggilan AI')}
            <Text className="font-ui-medium text-[13px] leading-5 text-text-main">
              AI baru: {totals.missVerified} dari {totals.missCalls} terbukti memanggil model.
              {'\n'}AI dari cache: {totals.hitVerified} dari {totals.hitCalls} terbukti dari
              cache.
              {totals.failed ? `\n${totals.failed} permintaan gagal, dihitung tanpa hasil.` : ''}
            </Text>

            <Text className="mt-3 font-ui-medium text-[12px] leading-5 text-text-muted">
              Satuan arus terdeteksi: {rounds[0].divisor === 1000 ? 'mikroampere' : 'miliampere'}.
              OCR berjalan {perRound.map((r) => r.ocrRuns).join(', ')} kali per putaran.
            </Text>

            <PressableScale
              onPress={exportCsv}
              disabled={running}
              accessibilityRole="button"
              className="mt-4 h-12 items-center justify-center rounded-2xl bg-surface-alt">
              <Text className="font-ui-bold text-[15px] text-text-main">Bagikan data (CSV)</Text>
            </PressableScale>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
