import { useEffect, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { Check, ExternalLink, Wifi } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useT } from '../i18n';
import { speak as speakOut } from '../speech/speech-service';
import { voicesFor, type VoiceOption } from '../speech/voices';
import { useOCRStore, type LanguageId } from '../store/useStore';
import { GRADIENTS } from '../theme/palettes';
import { getReadingLevel } from '../theme/reading-levels';
import { useThemeColors } from '../theme/theme-provider';
import { PressableScale } from './pressable-scale';

/**
 * Memilih suara mesin TTS yang dipakai membacakan teks.
 *
 * KENAPA HARUS PENGGUNA YANG MENDENGAR SENDIRI. Daftar suara berbeda di setiap
 * HP — tergantung mesin TTS yang terpasang dan data suara yang sudah diunduh —
 * dan identifier-nya ("id-id-x-idd-local") tidak memberi tahu apa pun tentang
 * bunyinya. Aplikasi bisa menebak yang terbaik lewat kualitas yang dilaporkan
 * mesin, tapi tebakan itu sering meleset. Karena itu tiap baris di sini
 * LANGSUNG BERBUNYI saat diketuk: pilihannya dinilai dengan telinga, bukan
 * dengan membaca nama berkas.
 */
/**
 * Tiga kecepatan yang ditawarkan.
 *
 * Angkanya menyamai `speechRate` di ketiga preset kemampuan membaca, jadi
 * memilih di sini berarti memindahkan diri ke kecepatan preset lain — bukan
 * memasukkan nilai yang belum pernah diuji ke siapa pun.
 */
const SPEECH_RATES = [
  { id: 'slow', value: 0.75 },
  { id: 'medium', value: 0.85 },
  { id: 'normal', value: 1 },
] as const;

export function VoicePicker() {
  const t = useT();
  const colors = useThemeColors();
  const language = useOCRStore((s) => s.language);
  const selected = useOCRStore((s) => s.voiceIds[s.language]);
  const setVoiceId = useOCRStore((s) => s.setVoiceId);
  const readingLevel = useOCRStore((s) => s.readingLevel);

  /*
   * Bahasanya ikut disimpan bersama daftarnya, bukan dikosongkan lebih dulu di
   * dalam efek. Mengosongkan state secara langsung di badan useEffect memicu
   * render berantai — dan membandingkan bahasa yang tersimpan dengan bahasa
   * yang sedang aktif sudah cukup untuk tahu daftarnya masih milik bahasa lama.
   */
  const customRate = useOCRStore((s) => s.speechRate);
  const setSpeechRate = useOCRStore((s) => s.setSpeechRate);
  const presetRate = getReadingLevel(readingLevel).speechRate;
  const rate = customRate ?? presetRate;

  const [loaded, setLoaded] = useState<{ language: LanguageId; list: VoiceOption[] } | null>(null);

  useEffect(() => {
    let alive = true;

    void voicesFor(language).then((list) => {
      if (alive) setLoaded({ language, list });
    });

    return () => {
      alive = false;
    };
  }, [language]);

  const voices = loaded?.language === language ? loaded.list : null;

  /** Contoh kalimat dibacakan dengan kecepatan yang benar-benar dipakai nanti. */
  const preview = (identifier: string | null, atRate = rate) => {
    void speakOut(t.settings.voiceSample, { language, rate: atRate, voice: identifier });
  };

  const choose = (identifier: string | null) => {
    setVoiceId(language, identifier);
    preview(identifier);
  };

  if (voices === null) {
    return (
      <Text className="font-ui-medium text-[13px] text-text-muted">{t.settings.voiceLoading}</Text>
    );
  }

  /*
   * HP tanpa satu pun suara untuk bahasa ini. Bukan kegagalan aplikasi, dan
   * pesannya menyebut jalan keluarnya — data suara diunduh dari pengaturan HP,
   * bukan dari sini.
   */
  if (voices.length === 0) {
    return (
      <View style={{ gap: 10 }}>
        <Text className="font-ui-medium text-[13px] leading-5 text-text-muted">
          {t.settings.voiceNone}
        </Text>

        {/*
          Pintasan ke setelan Teks-ke-ucapan bawaan Android. `sendIntent` ada di
          inti React Native, jadi tidak menambah modul native — penting, karena
          modul native baru membuat pembaruan OTA tidak bisa dipakai sampai APK
          dibangun ulang. Di iOS suara sudah ikut sistem dan tidak ada layar
          setara, jadi tombolnya tidak ditampilkan.
        */}
        {Platform.OS === 'android' ? (
          <PressableScale
            onPress={() => {
              void Linking.sendIntent('com.android.settings.TTS_SETTINGS').catch(() => {
                /*
                 * Sebagian pabrikan mengganti nama activity-nya. Gagal membuka
                 * bukan alasan menampilkan layar merah — petunjuk langkah
                 * manualnya sudah tertulis di atas.
                 */
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={t.settings.voiceOpenSettings}
            scaleTo={0.98}
            className="h-12 flex-row items-center justify-center rounded-2xl bg-primary/10"
            style={{ gap: 8 }}>
            <ExternalLink size={16} color={colors.primary} />
            <Text className="font-ui-bold text-[14px] text-primary">
              {t.settings.voiceOpenSettings}
            </Text>
          </PressableScale>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {[null, ...voices.map((voice) => voice.identifier)].map((identifier, index) => {
        const voice = identifier === null ? null : voices[index - 1];
        const active = identifier === null ? selected === undefined : selected === identifier;

        return (
          <PressableScale
            key={identifier ?? 'auto'}
            onPress={() => choose(identifier)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={
              identifier === null ? t.settings.voiceAuto : t.settings.voiceName(index)
            }
            scaleTo={0.98}
            className={`flex-row items-center rounded-2xl border p-4 ${
              active ? 'border-primary/30 bg-primary/[0.08]' : 'border-border/10 bg-surface'
            }`}
            style={{ gap: 10 }}>
            {active ? (
              <LinearGradient
                colors={[...GRADIENTS.activePill.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Check size={12} color="#ffffff" strokeWidth={3} />
              </LinearGradient>
            ) : (
              <View className="h-[22px] w-[22px] rounded-full border-2 border-border/20" />
            )}

            <View className="flex-1">
              <Text
                className={`font-ui-bold text-[15px] ${active ? 'text-primary' : 'text-text-main'}`}>
                {identifier === null ? t.settings.voiceAuto : t.settings.voiceName(index)}
              </Text>

              <Text className="mt-0.5 font-ui-medium text-[12px] text-text-muted">
                {identifier === null
                  ? t.settings.voiceAutoDesc
                  : voice?.network
                    ? t.settings.voiceNetwork
                    : voice?.enhanced
                      ? t.settings.voiceEnhanced
                      : t.settings.voiceStandard}
              </Text>

              {/*
                Nama asli dari mesin TTS, ditampilkan kecil-kecil. Tidak untuk
                dibaca sehari-hari — gunanya saat suaranya bermasalah: hanya
                dari sinilah ketahuan HP ini sebenarnya punya suara apa saja,
                dan tanpa itu diagnosisnya cuma tebak-tebakan.
              */}
              {identifier !== null ? (
                <Text className="mt-0.5 text-[10px] text-text-muted/60" selectable>
                  {identifier}
                </Text>
              ) : null}
            </View>

            {/* Penanda butuh internet — satu-satunya sifat suara yang bisa
                mengejutkan pengguna nanti, saat sinyalnya hilang. */}
            {voice?.network ? <Wifi size={16} color={colors.textMuted} /> : null}
          </PressableScale>
        );
      })}

      <Text className="mt-1 font-ui-medium text-[13px] leading-5 text-text-muted">
        {t.settings.voicePickerHint}
      </Text>

      {/*
        Kecepatan ditaruh di sini, bukan di seksi terpisah, karena ia dan pilihan
        suara di atas menjawab keluhan yang sama — "suaranya kurang jelas" — dan
        jawabannya sering ada di salah satu dari keduanya. Mengubahnya langsung
        membunyikan contoh, sama seperti memilih suara.
      */}
      <Text className="mt-4 font-ui-bold text-[15px] text-text-main">{t.settings.rateTitle}</Text>

      <View className="mt-2 flex-row" style={{ gap: 8 }}>
        {SPEECH_RATES.map((option) => {
          const active = Math.abs(rate - option.value) < 0.01;

          return (
            <PressableScale
              key={option.id}
              onPress={() => {
                setSpeechRate(option.value);
                preview(selected ?? null, option.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t.settings.rates[option.id]}
              scaleTo={0.97}
              wrapperStyle={{ flex: 1 }}
              className={`h-11 items-center justify-center rounded-2xl border ${
                active ? 'border-primary/30 bg-primary/[0.08]' : 'border-border/10 bg-surface'
              }`}>
              <Text
                className={`font-ui-bold text-[13px] ${
                  active ? 'text-primary' : 'text-text-muted'
                }`}>
                {t.settings.rates[option.id]}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
