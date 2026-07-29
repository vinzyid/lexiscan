import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Camera, BookOpen, Settings } from 'lucide-react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { useThemeColors } from '../theme/theme-provider';
import { GRADIENTS } from '../theme/palettes';

const TABS = {
  index: { Icon: Home, label: 'Beranda' },
  scanner: { Icon: Camera, label: 'Pindai' },
  reader: { Icon: BookOpen, label: 'Baca' },
  settings: { Icon: Settings, label: 'Atur' },
} as const;

/**
 * Frame "Navigation" di Figma: bilah 65px bergaris tipis di atas, tab aktif
 * jadi pil gradien berisi ikon + label, tab lain hanya ikon redup.
 */
export function PillTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const colors = useThemeColors();

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

        const { Icon, label } = tab;
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

        const content = (
          <>
            <Icon size={18} color={isFocused ? '#ffffff' : colors.textMuted} strokeWidth={1.8} />
            {isFocused ? <Text className="font-ui-bold text-xs text-white">{label}</Text> : null}
          </>
        );

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={onPress}
            hitSlop={8}>
            {isFocused ? (
              <LinearGradient
                colors={[...GRADIENTS.navPill.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 36,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  borderRadius: 22,
                }}>
                {content}
              </LinearGradient>
            ) : (
              <View className="h-9 w-[75px] flex-row items-center justify-center rounded-[22px]">
                {content}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
