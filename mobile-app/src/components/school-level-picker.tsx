import { Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useT } from '../i18n';
import { GRADIENTS } from '../theme/palettes';
import { SCHOOL_LEVELS, type SchoolLevelId } from '../theme/school-levels';
import { IlluSchoolLevel } from './illustrations';
import { PressableScale } from './pressable-scale';

type Props = {
  value: SchoolLevelId | null;
  onChange: (id: SchoolLevelId) => void;
};

/**
 * Langkah 2 pendaftaran — jenjang sekolah (Figma: node 126:3043).
 *
 * Kartunya bergambar dan bukan daftar teks, dan itu bukan hiasan: pertanyaan
 * ini muncul sebelum pengguna sempat memberi tahu bahwa ia belum bisa membaca,
 * jadi tiap pilihan harus bisa dikenali dari bentuknya lebih dulu.
 *
 * Tidak ada tombol bacakan di sini, berbeda dengan `ReadingLevelPicker`. Mesin
 * suaranya belum tentu menyala pada tahap ini — preferensinya baru ditetapkan
 * di langkah berikutnya — dan tombol yang diketuk tanpa berbunyi lebih
 * membingungkan daripada tidak ada tombol sama sekali.
 */
export function SchoolLevelPicker({ value, onChange }: Props) {
  const t = useT();

  return (
    <View className="flex-row flex-wrap" style={{ gap: 12 }}>
      {SCHOOL_LEVELS.map((level) => {
        const copy = t.schoolLevels[level.id];
        const selected = level.id === value;

        return (
          <PressableScale
            key={level.id}
            onPress={() => onChange(level.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${copy.name}. ${copy.age}`}
            scaleTo={0.97}
            /*
             * Persentase, bukan lebar tetap 181px seperti di Figma: layar
             * terkecil yang didukung 320px, dan pada lebar itu dua kartu 181px
             * tidak muat sehingga satu kartu terlempar ke barisnya sendiri.
             */
            wrapperStyle={level.wide ? { width: '100%' } : { width: '47.5%', flexGrow: 1 }}
            className={`items-center rounded-3xl border-2 px-3 py-4 ${
              selected ? 'border-primary bg-primary/[0.08]' : 'border-border/10 bg-surface-alt'
            }`}>
            {/* Centang hanya muncul saat terpilih — di Figma kartu jenjang tidak
                punya lingkaran kosong seperti kartu kemampuan membaca. */}
            {selected ? (
              <LinearGradient
                colors={[...GRADIENTS.activePill.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Check size={12} color="#ffffff" strokeWidth={3} />
              </LinearGradient>
            ) : null}

            <IlluSchoolLevel id={level.id} size={64} />

            <Text
              className={`mt-1.5 text-center font-ui-bold text-[14px] ${
                selected ? 'text-primary' : 'text-text-main'
              }`}>
              {copy.name}
            </Text>

            <Text className="mt-0.5 text-center font-ui-medium text-[11px] text-text-muted">
              {copy.age}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
