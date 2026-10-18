import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import * as DocumentPicker from 'expo-document-picker';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { ArrowLeft } from 'lucide-react-native';

import { correctTypo } from '../src/api/ai';
import { PressableScale } from '../src/components/pressable-scale';
import { meanSd } from '../src/energy/power';
import { useThemeColors } from '../src/theme/theme-provider';
import { fileStamp, shareTextFile } from '../src/utils/share-file';

/**
 * Uji akurasi dan kecepatan OCR: layar tersembunyi untuk tim, dibuka dari
 * layar Uji Energi. Teksnya sengaja tidak masuk `src/i18n`.
 *
 * Tim memotret 20-30 halaman cetak (bukan dokumen anak), mengetik teks
 * aslinya di laptop, lalu membandingkannya dengan hasil ekspor layar ini
 * memakai jiwer (CER dan WER). Hasil OCR memang tidak pernah dikirim ke
 * server, jadi satu-satunya jalan mengumpulkannya adalah dari HP sendiri.
 *
 * Foto dibaca dengan panggilan ML Kit yang sama dengan jalur unggah gambar di
 * layar Pindai. Panggilan pertama memuat model ke memori dan jauh lebih
 * lambat, jadi ada satu pemanasan yang tidak ikut dicatat.
 */

const CONDITIONS = ['buku_sd', 'fotokopi', 'cahaya_redup', 'huruf_kecil'] as const;
type Condition = (typeof CONDITIONS)[number];

const CONDITION_LABEL: Record<Condition, string> = {
  buku_sd: 'Buku SD',
  fotokopi: 'Fotokopi',
  cahaya_redup: 'Cahaya redup',
  huruf_kecil: 'Huruf kecil',
};

/**
 * Jarak minimum antarpanggilan perbaikan AI: paling banyak 17 per menit,
 * masih di bawah batas server 20 per menit untuk endpoint AI. Jawaban dari
 * cache server bisa datang dalam puluhan milidetik, jadi tanpa jeda ini
 * permintaan ke-21 akan ditolak.
 */
const CORRECT_PERIOD_MS = 3_500;

type Page = { uri: string; name: string; condition: Condition };

type PageResult = Page & {
  ocrMs: number;
  rawText: string;
  correctedText: string | null;
  correctMs: number | null;
  error: string | null;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fmt = (value: number, digits = 0) => value.toFixed(digits).replace('.', ',');

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default function OcrTestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  const [condition, setCondition] = useState<Condition>('buku_sd');
  const [pages, setPages] = useState<Page[]>([]);
  const [withCorrection, setWithCorrection] = useState(true);
  const [results, setResults] = useState<PageResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const cancelled = useRef(false);

  useEffect(
    () => () => {
      cancelled.current = true;
      deactivateKeepAwake('ocr-test');
    },
    [],
  );

  const pickImages = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    setPages((previous) => [
      ...previous,
      ...result.assets.map((asset) => ({ uri: asset.uri, name: asset.name, condition })),
    ]);
  };

  const run = async () => {
    if (!pages.length) return;

    cancelled.current = false;
    setRunning(true);
    setResults([]);
    await activateKeepAwakeAsync('ocr-test');

    try {
      setStatus('Memanaskan ML Kit...');
      await TextRecognition.recognize(pages[0].uri);

      const collected: PageResult[] = [];

      for (const [index, page] of pages.entries()) {
        if (cancelled.current) return;
        setStatus(`Halaman ${index + 1} dari ${pages.length}: OCR...`);

        const result: PageResult = {
          ...page,
          ocrMs: 0,
          rawText: '',
          correctedText: null,
          correctMs: null,
          error: null,
        };

        try {
          const started = performance.now();
          const ocr = await TextRecognition.recognize(page.uri);
          result.ocrMs = performance.now() - started;
          result.rawText = ocr?.text?.trim() ?? '';
        } catch (e) {
          result.error = `OCR: ${e instanceof Error ? e.message : String(e)}`;
        }

        if (withCorrection && result.rawText) {
          setStatus(`Halaman ${index + 1} dari ${pages.length}: perbaikan AI...`);
          const started = performance.now();

          try {
            result.correctedText = await correctTypo(result.rawText);
            result.correctMs = performance.now() - started;
          } catch (e) {
            result.error = `Perbaikan AI: ${e instanceof Error ? e.message : String(e)}`;
          }

          await wait(Math.max(0, CORRECT_PERIOD_MS - (performance.now() - started)));
        }

        collected.push(result);
        setResults([...collected]);
      }

      setStatus('Selesai. Bagikan hasilnya ke laptop.');
    } catch (e) {
      setStatus(`Gagal: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      deactivateKeepAwake('ocr-test');
      setRunning(false);
    }
  };

  const deviceLine = `${Device.manufacturer ?? '?'} ${Device.modelName ?? '?'}, Android ${Device.osVersion ?? '?'}`;

  const timed = results.filter((r) => !r.error?.startsWith('OCR'));
  const ocrStats = meanSd(timed.map((r) => r.ocrMs));
  const ocrMedian = median(timed.map((r) => r.ocrMs));

  const exportJson = () => {
    const payload = {
      device: deviceLine,
      exported_at: new Date().toISOString(),
      note: 'ocr_ms diukur di HP sekitar satu panggilan TextRecognition.recognize, setelah satu pemanasan',
      pages: results.map((r) => ({
        file: r.name,
        condition: r.condition,
        ocr_ms: Math.round(r.ocrMs),
        raw_text: r.rawText,
        corrected_text: r.correctedText,
        correct_ms: r.correctMs === null ? null : Math.round(r.correctMs),
        error: r.error,
      })),
    };

    void shareTextFile(`uji-ocr_${fileStamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  };

  const chip = (selected: boolean) =>
    `h-10 items-center justify-center rounded-2xl px-3 ${selected ? 'bg-primary' : 'bg-surface-alt'}`;
  const chipText = (selected: boolean) =>
    `font-ui-bold text-[13px] ${selected ? 'text-white' : 'text-text-main'}`;

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
          <Text className="font-ui-bold text-[22px] text-text-main">Uji OCR</Text>
        </View>

        <Text className="mt-4 font-ui-medium text-[14px] leading-6 text-text-muted">
          Pilih kondisi, lalu tambahkan foto halaman untuk kondisi itu. Ulangi untuk kondisi lain.
          Jangan memakai dokumen anak. Ketik teks asli tiap halaman di laptop sebagai acuan.
        </Text>
        <Text className="mt-2 font-ui-medium text-[13px] text-text-muted">{deviceLine}</Text>

        <View className="mt-5 rounded-3xl bg-surface p-4" style={{ gap: 12 }}>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {CONDITIONS.map((value) => (
              <PressableScale
                key={value}
                onPress={() => setCondition(value)}
                disabled={running}
                accessibilityRole="radio"
                accessibilityState={{ selected: condition === value }}
                className={chip(condition === value)}>
                <Text className={chipText(condition === value)}>{CONDITION_LABEL[value]}</Text>
              </PressableScale>
            ))}
          </View>

          <PressableScale
            onPress={pickImages}
            disabled={running}
            accessibilityRole="button"
            className="h-12 items-center justify-center rounded-2xl bg-surface-alt">
            <Text className="font-ui-bold text-[15px] text-text-main">
              Tambah foto: {CONDITION_LABEL[condition]}
            </Text>
          </PressableScale>

          <Text className="font-ui-medium text-[13px] leading-5 text-text-muted">
            {pages.length} foto.{' '}
            {CONDITIONS.map((value) => {
              const count = pages.filter((p) => p.condition === value).length;
              return count ? `${CONDITION_LABEL[value]} ${count}. ` : '';
            }).join('')}
          </Text>

          <View className="flex-row" style={{ gap: 8 }}>
            <PressableScale
              onPress={() => setWithCorrection((value) => !value)}
              disabled={running}
              accessibilityRole="switch"
              accessibilityState={{ checked: withCorrection }}
              wrapperStyle={{ flex: 1 }}
              className={chip(withCorrection)}>
              <Text className={chipText(withCorrection)}>
                Perbaikan AI {withCorrection ? 'ikut' : 'tidak ikut'}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => {
                setPages([]);
                setResults([]);
                setStatus(null);
              }}
              disabled={running || !pages.length}
              accessibilityRole="button"
              className={chip(false)}>
              <Text className={chipText(false)}>Kosongkan</Text>
            </PressableScale>
          </View>

          <PressableScale
            onPress={run}
            disabled={running || !pages.length}
            accessibilityRole="button"
            className={`h-14 items-center justify-center rounded-2xl ${
              running || !pages.length ? 'bg-surface-alt' : 'bg-primary'
            }`}>
            <Text
              className={`font-ui-bold text-[16px] ${
                running || !pages.length ? 'text-text-muted' : 'text-white'
              }`}>
              {running ? 'Sedang membaca...' : `Jalankan ${pages.length} foto`}
            </Text>
          </PressableScale>

          {status ? (
            <Text className="font-ui-medium text-[14px] text-text-muted">{status}</Text>
          ) : null}
        </View>

        {results.length > 0 ? (
          <View className="mt-5 rounded-3xl bg-surface p-4">
            <Text className="font-ui-bold text-[17px] text-text-main">
              Hasil ({results.length} foto)
            </Text>
            <Text className="mt-2 font-ui-medium text-[14px] leading-6 text-text-main">
              Waktu ML Kit: {fmt(ocrStats.mean)} ± {fmt(ocrStats.sd)} ms, median {fmt(ocrMedian)} ms
            </Text>

            {results.map((r, i) => (
              <View key={`${r.uri}-${i}`} className="mt-2 border-t border-surface-alt pt-2">
                <Text className="font-ui-bold text-[13px] text-text-main">
                  {i + 1}. {r.name} ({CONDITION_LABEL[r.condition]})
                </Text>
                <Text className="font-ui-medium text-[12px] text-text-muted">
                  OCR {fmt(r.ocrMs)} ms, {r.rawText.length} karakter
                  {r.correctMs !== null ? `, perbaikan AI ${fmt(r.correctMs)} ms` : ''}
                  {r.error ? `\n${r.error}` : ''}
                </Text>
              </View>
            ))}

            <PressableScale
              onPress={exportJson}
              disabled={running}
              accessibilityRole="button"
              className="mt-4 h-12 items-center justify-center rounded-2xl bg-surface-alt">
              <Text className="font-ui-bold text-[15px] text-text-main">Bagikan hasil (JSON)</Text>
            </PressableScale>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
