import { View } from 'react-native';
import { Square, Volume2 } from 'lucide-react-native';

import { useSpeech } from '../speech/use-speech';
import { useT } from '../i18n';
import { useThemeColors } from '../theme/theme-provider';
import { PressableScale } from './pressable-scale';

type Props = {
  /** Teks ASLI yang dibacakan — jangan kirim teks yang sudah dipenggal suku kata. */
  text: string;
  /** Penanda unik sumber bunyi, mis. `paragraph:3`. Menentukan tombol mana yang menyala. */
  speechKey: string;
  /** Untuk latar gelap (header, kartu gradien): ikonnya jadi putih. */
  onDark?: boolean;
  size?: number;
};

/**
 * Tombol "bacakan ini". Menekan sekali membacakan, menekan lagi menghentikan.
 *
 * Tidak menggambar apa pun kalau fitur suara sedang dimatikan. Dosen PLB
 * menegaskan suara harus bersifat opsional — dan bagi pengguna yang sudah
 * lancar membaca, tombol yang tidak pernah dipakai hanya menambah keramaian di
 * layar yang justru harus tenang.
 */
export function SpeakButton({ text, speechKey, onDark, size = 18 }: Props) {
  const colors = useThemeColors();
  const t = useT();
  const { enabled, toggle, speakingKey } = useSpeech();

  if (!enabled) return null;

  const speaking = speakingKey === speechKey;
  const tint = onDark ? '#ffffff' : colors.primary;

  return (
    <PressableScale
      silent
      onPress={() => toggle(text, speechKey)}
      accessibilityRole="button"
      accessibilityLabel={speaking ? t.speech.stopLabel : t.speech.playLabel}
      accessibilityState={{ selected: speaking }}
      scaleTo={0.9}
      /*
       * 44x44 adalah ambang sasaran sentuh yang bisa dikenai tanpa membidik.
       * Tombol ini justru paling sering dipakai pengguna yang paling kesulitan
       * membidik, jadi ukurannya tidak boleh menyusut demi kerapian.
       */
      className={`h-11 w-11 items-center justify-center rounded-[16px] ${
        onDark ? 'bg-white/[0.15]' : speaking ? 'bg-primary/20' : 'bg-primary/10'
      }`}>
      <View>
        {speaking ? (
          <Square size={size - 3} color={tint} fill={tint} />
        ) : (
          <Volume2 size={size} color={tint} />
        )}
      </View>
    </PressableScale>
  );
}
