import { View, Text, Pressable } from 'react-native';
import { Home, Camera, BookOpen, Settings } from 'lucide-react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { useThemeColors } from '../theme/theme-provider';

const TABS = {
  index: { Icon: Home, label: 'Beranda' },
  scanner: { Icon: Camera, label: 'Pindai' },
  reader: { Icon: BookOpen, label: 'Baca' },
  settings: { Icon: Settings, label: 'Pengaturan' },
} as const;

/**
 * Tab bar mockup v1: tab aktif jadi pil ungu berisi ikon + label, tab lain
 * hanya ikon redup. Cuma satu label yang tampil supaya bar tetap tenang.
 */
export function PillTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const colors = useThemeColors();

  return (
    <View
      className="flex-row items-center justify-around border-t border-border bg-background px-3 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name as keyof typeof TABS];
        if (!tab) return null;

        const { Icon, label } = tab;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, params: route.params, merge: true });
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={onPress}
            hitSlop={8}
            className={`flex-row items-center justify-center rounded-full ${
              isFocused ? 'bg-primary px-4 py-2.5' : 'px-3 py-2.5'
            }`}>
            <Icon size={isFocused ? 17 : 20} color={isFocused ? '#FFFFFF' : colors.textMuted} />
            {isFocused ? (
              <Text className="ml-2 font-opendyslexic-bold text-[11px] text-white">{label}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
