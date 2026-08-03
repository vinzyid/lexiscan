import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Camera, BookOpen, Settings } from 'lucide-react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { useThemeColors } from '../theme/theme-provider';
import { GRADIENTS } from '../theme/palettes';
import { PressableScale } from './pressable-scale';
import { useT } from '../i18n';

const TABS = {
  index: { Icon: Home, key: 'home' },
  scanner: { Icon: Camera, key: 'scan' },
  reader: { Icon: BookOpen, key: 'read' },
  settings: { Icon: Settings, key: 'settings' },
} as const;

/**
 * Frame "Navigation" di Figma: bilah 65px bergaris tipis di atas, tab aktif
 * jadi pil gradien berisi ikon + label, tab lain hanya ikon redup.
 */
export function PillTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const colors = useThemeColors();
  const t = useT();

  /*
   * Di tema terang bilah ini sewarna kartu (lebih terang dari latar); di Mode
   * Gelap Figma justru memakai warna latar supaya bilah menyatu ke bawah.
   */
  const barColor = colors.isDark ? colors.background : colors.surface;

  return (
    <View
      className="flex-row items-center justify-center border-t px-3 pt-2"
      style={{
        gap: 4,
        backgroundColor: barColor,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 12),
      }}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name as keyof typeof TABS];
        if (!tab) return null;

        const { Icon, key } = tab;
        const label = t.tabs[key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, params: route.params, merge: true });
          }
        };

        return (
          <PressableScale
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={onPress}
            scaleTo={0.92}>
            {isFocused ? (
              <LinearGradient
                colors={[...GRADIENTS.navPill.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  borderRadius: 24,
                }}>
                <Icon size={19} color="#ffffff" strokeWidth={1.8} />
                <Text className="font-ui-bold text-[13px] text-white">{label}</Text>
              </LinearGradient>
            ) : (
              /* Tab tidak aktif tetap menampilkan namanya: ikon sendirian memaksa menebak. */
              <View className="h-12 w-[70px] items-center justify-center rounded-3xl">
                <Icon size={19} color={colors.textMuted} strokeWidth={1.8} />
                <Text className="mt-0.5 font-ui-medium text-[11px] text-text-muted">{label}</Text>
              </View>
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}
