import { Modal, View, Text, Pressable } from 'react-native';
import { X } from 'lucide-react-native';

import { splitSyllables } from '../utils/syllables';
import { useThemeColors } from '../theme/theme-provider';

/**
 * Word Isolation: satu kata ditampilkan besar dan terpisah dari kalimatnya,
 * lalu dipecah jadi suku kata supaya lebih mudah dibunyikan.
 */
export function WordSheet({
  word,
  onClose,
  onExplain,
}: {
  word: string | null;
  onClose: () => void;
  /** Buka AI Explain This untuk kata ini; sheet ini ditutup lebih dulu. */
  onExplain?: (word: string) => void;
}) {
  const colors = useThemeColors();
  const syllables = word ? splitSyllables(word) : [];

  return (
    <Modal visible={!!word} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={onClose}>
        <View className="w-full rounded-[32px] bg-surface p-6">
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="font-opendyslexic-bold text-[10px] uppercase tracking-widest text-primary">
              🔍 KATA TERPILIH
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Tutup"
              className="h-8 w-8 items-center justify-center rounded-full bg-surface-alt">
              <X size={14} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text
            className="mb-6 text-center font-opendyslexic-bold text-text-main"
            style={{ fontSize: 40, lineHeight: 56, letterSpacing: 1.5 }}>
            {word}
          </Text>

          <Text className="mb-3 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-text-muted">
            SUKU KATA
          </Text>
          <View className="flex-row flex-wrap justify-center">
            {syllables.map((syllable, index) => (
              <View key={index} className="mb-2 mr-2 rounded-2xl bg-primary/10 px-4 py-2.5">
                <Text
                  className="font-opendyslexic-bold text-primary"
                  style={{ fontSize: 20, letterSpacing: 1 }}>
                  {syllable}
                </Text>
              </View>
            ))}
          </View>

          <Text className="mt-4 text-center font-opendyslexic text-[10px] text-text-muted">
            Baca satu suku kata dulu, baru sambung jadi satu kata.
          </Text>

          {word && onExplain ? (
            <Pressable
              onPress={() => onExplain(word)}
              accessibilityRole="button"
              className="mt-4 rounded-2xl bg-primary/10 py-3">
              <Text className="text-center font-opendyslexic-bold text-xs text-primary">
                💡 Tanya Lexi arti kata ini
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}
