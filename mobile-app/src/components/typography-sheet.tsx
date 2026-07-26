import { Modal, View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { X } from 'lucide-react-native';

import { TYPE_LEVELS } from '../theme/palettes';
import { useOCRStore } from '../store/useStore';
import { useThemeColors } from '../theme/theme-provider';
import { DyslexicText } from './dyslexic-text';

/**
 * Sheet "Adaptive Typography": tiga preset ukuran/spasi dengan pratinjau
 * langsung, plus sakelar Bicolor Words & Reading Ruler.
 */
export function TypographySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors();
  const { typeLevelId, setTypeLevelId, bicolorMode, toggleBicolorMode, rulerMode, toggleRulerMode } =
    useOCRStore();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Tutup" />
        <View className="max-h-[88%] rounded-t-[32px] bg-background px-5 pb-8 pt-6">
          <View className="mb-5 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="mb-1 font-opendyslexic-bold text-xl text-text-main">
                Adaptive Typography
              </Text>
              <Text className="font-opendyslexic text-[11px] text-primary">
                Sesuaikan teks untuk kenyamananmu
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Tutup pengaturan tipografi"
              className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
              <X size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {TYPE_LEVELS.map((level) => {
              const selected = level.id === typeLevelId;

              return (
                <Pressable
                  key={level.id}
                  onPress={() => setTypeLevelId(level.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className={`mb-3 rounded-3xl border p-4 ${
                    selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                  }`}>
                  <View className="mb-1 flex-row items-start justify-between">
                    <Text
                      className={`font-opendyslexic-bold text-sm ${selected ? 'text-primary' : 'text-text-main'}`}>
                      {selected ? `✓ ${level.name}` : level.name}
                    </Text>
                    <View className="flex-row">
                      <View className="mr-2 rounded-lg bg-surface-alt px-2 py-1">
                        <Text className="font-opendyslexic text-[10px] text-text-muted">
                          {level.fontSize}px
                        </Text>
                      </View>
                      <View className="rounded-lg bg-surface-alt px-2 py-1">
                        <Text className="font-opendyslexic text-[10px] text-text-muted">
                          {level.lineHeightRatio.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text className="mb-3 font-opendyslexic text-[10px] text-text-muted">{level.desc}</Text>
                  <DyslexicText levelOverride={level}>Membaca jadi lebih mudah.</DyslexicText>
                </Pressable>
              );
            })}

            <ToggleRow
              emoji="🌈"
              title="Bicolor Words"
              desc="Warna bergantian membantu pelacakan"
              value={bicolorMode}
              onValueChange={toggleBicolorMode}
              trackColor={colors.primary}
            />
            <ToggleRow
              emoji="📏"
              title="Reading Ruler"
              desc="Garis penanda posisi bacaan"
              value={rulerMode}
              onValueChange={toggleRulerMode}
              trackColor={colors.primary}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ToggleRow({
  emoji,
  title,
  desc,
  value,
  onValueChange,
  trackColor,
}: {
  emoji: string;
  title: string;
  desc: string;
  value: boolean;
  onValueChange: () => void;
  trackColor: string;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-3xl border border-border bg-surface p-4">
      <View className="flex-1 pr-3">
        <Text className="mb-0.5 font-opendyslexic-bold text-xs text-text-main">
          {emoji} {title}
        </Text>
        <Text className="font-opendyslexic text-[10px] text-text-muted">{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={title}
        trackColor={{ false: '#D6D3CC', true: trackColor }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
