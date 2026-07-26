import { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';

import { EXPLAIN_STYLES, getExplainStyle, type ExplainStyleId } from '../data/sample-document';
import { useThemeColors } from '../theme/theme-provider';

/**
 * Layar "AI Explain This": pilih gaya penjelasan dulu, lalu Lexi menjawab
 * dalam gelembung chat. Tombol "Coba Gaya Lain" mengembalikan ke pilihan.
 */
export function ExplainSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors();
  const [styleId, setStyleId] = useState<ExplainStyleId | null>(null);
  const active = styleId ? getExplainStyle(styleId) : null;

  const close = () => {
    setStyleId(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center border-b border-border px-4 pb-4 pt-14">
          <Pressable
            onPress={() => (active ? setStyleId(null) : close())}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={active ? 'Kembali ke pilihan gaya' : 'Tutup'}
            className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
            <ArrowLeft size={16} color={colors.textMuted} />
          </Pressable>
          <View>
            <Text className="font-opendyslexic text-base font-bold text-text-main">AI Explain This 💡</Text>
            <Text className="font-opendyslexic text-[10px] text-text-muted">
              {active ? 'Penjelasan dari Lexi' : 'Pilih gaya penjelasan'}
            </Text>
          </View>
        </View>

        {active ? (
          <ScrollView className="flex-1 px-4 pt-5" contentContainerClassName="pb-10">
            <View className="mb-4 self-start rounded-full bg-primary/10 px-4 py-2">
              <Text className="font-opendyslexic text-[11px] font-bold text-primary">
                {active.emoji} {active.name}
              </Text>
            </View>

            <View className="flex-row">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Text className="text-lg">🦉</Text>
              </View>
              <View className="flex-1 rounded-3xl rounded-tl-lg border border-border bg-surface p-4">
                {active.answer.map((para, index) => (
                  <Text
                    key={index}
                    className={`font-opendyslexic text-xs leading-6 text-text-main ${
                      index < active.answer.length - 1 ? 'mb-4' : ''
                    }`}>
                    {para}
                  </Text>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => setStyleId(null)}
              accessibilityRole="button"
              className="mt-6 rounded-2xl bg-primary/10 py-3.5">
              <Text className="text-center font-opendyslexic text-xs font-bold text-primary">
                ← Coba Gaya Lain
              </Text>
            </Pressable>

            <View className="mt-3 flex-row justify-center">
              {EXPLAIN_STYLES.filter((s) => s.id !== active.id).map((s) => (
                <Pressable key={s.id} onPress={() => setStyleId(s.id)} hitSlop={6} className="mx-2">
                  <Text className="font-opendyslexic text-[10px] text-text-muted">
                    {s.emoji} {s.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView className="flex-1 px-5 pt-8" contentContainerClassName="pb-10">
            <View className="mb-8 items-center">
              <Text className="mb-3 text-6xl">🦉</Text>
              <Text className="font-opendyslexic text-sm font-bold text-text-main">
                Mau Lexi jelasin gimana? 🙂
              </Text>
            </View>

            {EXPLAIN_STYLES.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setStyleId(s.id)}
                accessibilityRole="button"
                className="mb-3 flex-row items-center rounded-3xl border border-border bg-surface p-4">
                <Text className="mr-3 text-2xl">{s.emoji}</Text>
                <View className="flex-1">
                  <Text className="mb-0.5 font-opendyslexic text-xs font-bold text-text-main">{s.name}</Text>
                  <Text className="font-opendyslexic text-[10px] text-primary">{s.desc}</Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
