import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';

import { useT } from '../i18n';
import { useThemeColors } from '../theme/theme-provider';
import type { ReadingLevelId } from '../theme/reading-levels';
import { ArtWordIsolation, IlluCanRead, IlluNeedVoice } from './illustrations';
import { PressableScale } from './pressable-scale';

type Props = {
  value: ReadingLevelId | null;
  onChange: (id: ReadingLevelId) => void;
};

/**
 * Langkah 3 pendaftaran — kemampuan membaca (Figma: node 126:4440 & 126:4463).
 *
 * BEDANYA DENGAN `ReadingLevelPicker` DI PENGATURAN, DAN KENAPA KEDUANYA ADA.
 * Yang di Pengaturan memperlihatkan CONTOH bentuk teksnya ("Ma-ta-ha-ri" lawan
 * "Matahari") karena di sana pengguna sedang membandingkan hasil yang sudah
 * pernah dilihatnya. Di sini contoh itu belum berarti apa-apa — aplikasinya
 * belum pernah dipakai — jadi Figma menggantinya dengan pernyataan orang
 * pertama dan satu gambar besar. Menyatukan keduanya berarti salah satu layar
 * memakai bentuk yang bukan untuknya.
 *
 * URUTANNYA TERBALIK dari `READING_LEVELS`: yang paling mandiri di atas, persis
 * seperti Figma. Yang paling butuh bantuan ditaruh paling bawah supaya berdekatan
 * dengan keterangan suara otomatis yang muncul begitu ia dipilih.
 */
const ORDER: ReadingLevelId[] = ['lancar', 'mengeja', 'belum'];

const ART: Record<ReadingLevelId, ReactNode> = {
  lancar: <IlluCanRead size={60} />,
  /* Ilustrasi Word Isolation dipakai ulang — kata yang diangkat keluar
     paragraf memang persis yang dialami orang yang sedang mengeja. */
  mengeja: <ArtWordIsolation size={60} />,
  belum: <IlluNeedVoice size={60} />,
};

export function ReadingChoicePicker({ value, onChange }: Props) {
  const t = useT();
  const colors = useThemeColors();

  return (
    <View style={{ gap: 14 }}>
      {ORDER.map((id) => {
        const copy = t.auth.readingChoice[id];
        const selected = id === value;

        return (
          <PressableScale
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${copy.title}. ${copy.desc}`}
            scaleTo={0.98}
            className={`flex-row items-center rounded-3xl border-2 p-5 ${
              selected ? 'border-primary bg-primary/[0.08]' : 'border-border/10 bg-surface-alt'
            }`}
            style={{ gap: 16 }}>
            {ART[id]}

            <View className="flex-1">
              <Text
                className={`font-ui-bold text-[16px] leading-6 ${
                  selected ? 'text-primary' : 'text-text-main'
                }`}>
                {copy.title}
              </Text>
              <Text className="mt-0.5 font-ui-medium text-[12px] leading-[18px] text-text-muted">
                {copy.desc}
              </Text>
            </View>

            {selected ? <Check size={20} color={colors.primary} strokeWidth={3} /> : null}
          </PressableScale>
        );
      })}

      {/*
       * Hanya untuk 'belum'. Pilihan itu satu-satunya yang mengubah perilaku
       * aplikasi tanpa diminta lagi — paragraf mulai berbunyi sendiri — dan
       * kejutan seperti itu harus diberitahukan di tempat pilihannya dibuat,
       * bukan ditemukan sendiri nanti di layar Baca.
       */}
      {value === 'belum' ? (
        <View
          className="flex-row items-center rounded-2xl border border-primary/20 bg-primary/[0.08] px-4 py-3"
          style={{ gap: 12 }}>
          <Sparkles size={18} color={colors.primary} />
          <Text className="flex-1 font-ui-semibold text-[12px] leading-[18px] text-primary">
            {t.auth.voiceAutoNote}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
