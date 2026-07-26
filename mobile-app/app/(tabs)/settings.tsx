import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';

import { useOCRStore } from '../../src/store/useStore';
import { THEMES, TYPE_LEVELS } from '../../src/theme/palettes';
import { DyslexicText } from '../../src/components/dyslexic-text';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { themeId, setThemeId, typeLevelId, setTypeLevelId } = useOCRStore();

  return (
    <ScrollView
      className="flex-1 bg-background px-5"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}>
      <Text className="mb-1 font-opendyslexic-bold text-2xl text-text-main">Pengaturan 🎨</Text>
      <Text className="mb-7 font-opendyslexic text-xs text-text-muted">
        Sesuaikan tampilan agar paling nyaman dibaca
      </Text>

      <Text className="mb-2 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-warm">
        🎨 TEMA WARNA RAMAH DISLEKSIA
      </Text>
      <Text className="mb-4 font-opendyslexic text-[10px] leading-4 text-text-muted">
        Latar putih terang bisa menyebabkan kelelahan mata. Pilih warna yang paling nyaman.
      </Text>

      {THEMES.map((theme) => {
        const selected = theme.id === themeId;

        return (
          <Pressable
            key={theme.id}
            onPress={() => setThemeId(theme.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Tema ${theme.name}`}
            className={`mb-3 flex-row items-center rounded-3xl border p-4 ${
              selected ? 'border-primary' : 'border-border'
            }`}
            style={{ backgroundColor: theme.swatches[0] }}>
            <Text className="mr-3 text-lg">{theme.emoji}</Text>
            <View className="flex-1">
              <Text
                className="mb-2 font-opendyslexic-bold text-xs"
                style={{ color: theme.isDark ? '#ECEAF6' : '#2D2D2D' }}>
                {theme.name}
              </Text>
              <View className="flex-row">
                {theme.swatches.map((swatch) => (
                  <View
                    key={swatch}
                    className="mr-1.5 h-3.5 w-3.5 rounded-full border"
                    style={{ backgroundColor: swatch, borderColor: 'rgba(0,0,0,0.12)' }}
                  />
                ))}
              </View>
            </View>
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${
                selected ? 'bg-primary' : 'bg-black/5'
              }`}>
              {selected ? <Check size={13} color="#FFFFFF" /> : null}
            </View>
          </Pressable>
        );
      })}

      <Text className="mb-4 mt-6 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-warm">
        📖 MODE TIPOGRAFI DEFAULT
      </Text>

      {TYPE_LEVELS.map((level) => {
        const selected = level.id === typeLevelId;

        return (
          <Pressable
            key={level.id}
            onPress={() => setTypeLevelId(level.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Tipografi ${level.name}`}
            className={`mb-3 rounded-3xl border p-4 ${
              selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
            }`}>
            <View className="mb-1 flex-row items-start justify-between">
              <Text
                className={`font-opendyslexic-bold text-sm ${selected ? 'text-primary' : 'text-text-main'}`}>
                {selected ? `✓ ${level.name}` : level.name}
              </Text>
              <View className="flex-row">
                <Badge label="Font" value={`${level.fontSize}px`} />
                <Badge label="Spasi" value={level.lineHeightRatio.toFixed(2)} />
              </View>
            </View>
            <Text className="mb-3 font-opendyslexic text-[10px] text-text-muted">{level.desc}</Text>
            <DyslexicText levelOverride={level}>Membaca jadi lebih nyaman.</DyslexicText>
          </Pressable>
        );
      })}

      <View className="mt-4 rounded-3xl border border-border bg-surface p-5">
        <View className="mb-2 flex-row items-center">
          <Text className="mr-3 text-2xl">🦉</Text>
          <View>
            <Text className="font-opendyslexic-bold text-sm text-text-main">LexiScan v1.0</Text>
            <Text className="font-opendyslexic text-[10px] text-warm">
              Dirancang untuk pembaca disleksia
            </Text>
          </View>
        </View>
        <Text className="font-opendyslexic text-[10px] leading-4 text-text-muted">
          LexiScan menggunakan prinsip aksesibilitas berbasis riset untuk menciptakan pengalaman membaca
          yang nyaman dan efektif bagi semua orang.
        </Text>
      </View>
    </ScrollView>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <View className="ml-2 items-center rounded-lg bg-surface-alt px-2 py-1">
      <Text className="font-opendyslexic text-[8px] uppercase tracking-wider text-text-muted">{label}</Text>
      <Text className="font-opendyslexic-bold text-[10px] text-text-main">{value}</Text>
    </View>
  );
}
