import { Modal, View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { X } from 'lucide-react-native';

import { TYPE_LEVELS } from '../theme/palettes';
import { useOCRStore } from '../store/useStore';
import { useThemeColors } from '../theme/theme-provider';
import { useT } from '../i18n';
import { DyslexicText } from './dyslexic-text';
import { PressableScale } from './pressable-scale';

/**
 * Sheet "Atur Tulisan": tiga preset ukuran/spasi dengan pratinjau langsung,
 * plus sakelar Kata Dua Warna & Penggaris Baca.
 */
export function TypographySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors();
  const t = useT();
  const { typeLevelId, setTypeLevelId, bicolorMode, toggleBicolorMode, rulerMode, toggleRulerMode } =
    useOCRStore();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel={t.common.close} />
        <View className="max-h-[88%] rounded-t-[32px] bg-background px-5 pb-8 pt-6">
          <View className="mb-5 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="mb-1 font-ui-bold text-xl text-text-main">{t.typography.title}</Text>
              <Text className="font-ui-medium text-[13px] text-primary">
                {t.typography.subtitle}
              </Text>
            </View>
            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.typography.closeLabel}
              scaleTo={0.9}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-alt">
              <X size={18} color={colors.textMuted} />
            </PressableScale>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {TYPE_LEVELS.map((level) => {
              const selected = level.id === typeLevelId;

              return (
                <PressableScale
                  key={level.id}
                  onPress={() => setTypeLevelId(level.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t.typeLevels[level.id].name}. ${t.typeLevels[level.id].desc}`}
                  scaleTo={0.98}
                  className={`mb-3 rounded-2xl border p-4 ${
                    selected ? 'border-primary bg-primary/5' : 'border-border/10 bg-surface'
                  }`}>
                  <View className="mb-1 flex-row items-start justify-between">
                    <Text
                      className={`font-ui-bold text-[15px] ${selected ? 'text-primary' : 'text-text-main'}`}>
                      {selected ? `✓ ${t.typeLevels[level.id].name}` : t.typeLevels[level.id].name}
                    </Text>
                    <View className="flex-row">
                      <View className="mr-2 rounded-lg bg-surface-alt px-2.5 py-1">
                        <Text className="font-ui-medium text-xs text-text-muted">
                          {level.fontSize}px
                        </Text>
                      </View>
                      <View className="rounded-lg bg-surface-alt px-2.5 py-1">
                        <Text className="font-ui-medium text-xs text-text-muted">
                          {level.spacingLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text className="mb-3 font-ui-medium text-[13px] text-text-muted">
                    {t.typeLevels[level.id].desc}
                  </Text>
                  <DyslexicText levelOverride={level}>{t.typography.preview}</DyslexicText>
                </PressableScale>
              );
            })}

            <ToggleRow
              emoji="🌈"
              title={t.typography.bicolorTitle}
              desc={t.typography.bicolorDesc}
              value={bicolorMode}
              onValueChange={toggleBicolorMode}
              trackColor={colors.primary}
            />
            <ToggleRow
              emoji="📏"
              title={t.typography.rulerTitle}
              desc={t.typography.rulerDesc}
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
    <View className="mb-3 flex-row items-center justify-between rounded-3xl border border-border/10 bg-surface p-4">
      <View className="flex-1 pr-3">
        <Text className="mb-0.5 font-ui-bold text-[15px] text-text-main">
          {emoji} {title}
        </Text>
        <Text className="font-ui-medium text-[13px] leading-[19px] text-text-muted">{desc}</Text>
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
