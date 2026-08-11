import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { useT } from '../i18n';
import { useThemeColors } from '../theme/theme-provider';
import { PressableScale } from './pressable-scale';
import { SpeakButton } from './speak-button';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  /** Keterangan kecil di bawah kolom, mis. aturan penulisan nama pengguna. */
  hint?: string;
  password?: boolean;
  /** Penanda unik untuk tombol bacakan; harus beda antar kolom di satu layar. */
  speechKey: string;
};

/**
 * Satu kolom isian di layar masuk/daftar.
 *
 * Bedanya dari TextInput biasa ada tiga, dan ketiganya soal aksesibilitas:
 *
 * 1. Labelnya bisa dibacakan. Ini yang membuat pendaftaran mungkin diikuti anak
 *    yang belum bisa membaca sendiri.
 * 2. Kolomnya setinggi 64px dengan huruf 18px — jauh di atas ukuran bawaan,
 *    karena yang mengisinya sedang mengetik sambil mengeja.
 * 3. Kata sandi bisa ditampilkan. Menyembunyikan karakter membuat pengguna
 *    disleksia tidak punya cara memeriksa ejaannya sendiri, dan kesalahan
 *    ketik yang tidak terlihat itulah sebab paling sering gagal masuk.
 */
export function AuthField({ label, hint, password, speechKey, ...rest }: Props) {
  const colors = useThemeColors();
  const t = useT();
  const [revealed, setRevealed] = useState(false);

  const spoken = hint ? `${label}. ${hint}` : label;

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center" style={{ gap: 8 }}>
        <Text className="flex-1 font-ui-bold text-[15px] text-text-main">{label}</Text>
        <SpeakButton text={spoken} speechKey={speechKey} size={16} />
      </View>

      {/* Radius 24 & garis 2px mengikuti kolom isian di Figma (node 126:2220) —
          kolom di layar pendaftaran memang lebih tumpul dan lebih tegas
          garisnya daripada kartu-kartu lain di aplikasi. */}
      <View
        className="flex-row items-center rounded-3xl border-2 border-border/10 bg-surface-alt px-4"
        style={{ height: 66, gap: 8 }}>
        <TextInput
          {...rest}
          accessibilityLabel={label}
          secureTextEntry={password && !revealed}
          placeholderTextColor={colors.textMuted}
          className="flex-1 font-read text-text-main"
          style={{ fontSize: 18, letterSpacing: 0.5 }}
        />

        {password ? (
          <PressableScale
            onPress={() => setRevealed((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? t.auth.hidePassword : t.auth.showPassword}
            scaleTo={0.9}
            className="h-11 w-11 items-center justify-center rounded-[16px] bg-primary/10">
            {revealed ? (
              <EyeOff size={18} color={colors.primary} />
            ) : (
              <Eye size={18} color={colors.primary} />
            )}
          </PressableScale>
        ) : null}
      </View>

      {hint ? (
        <Text className="mt-1.5 font-ui-medium text-[13px] text-text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
