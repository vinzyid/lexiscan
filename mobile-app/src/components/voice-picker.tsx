import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Check, Wifi } from 'lucide-react-native';
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
  const preview = (identifier: string | null) => {
    void speakOut(t.settings.voiceSample, {
      language,
      rate: getReadingLevel(readingLevel).speechRate,
      voice: identifier,
    });
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
      <Text className="font-ui-medium text-[13px] leading-5 text-text-muted">
        {t.settings.voiceNone}
      </Text>
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
                  : voice?.enhanced
                    ? t.settings.voiceEnhanced
                    : t.settings.voiceStandard}
              </Text>
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
    </View>
  );
}
