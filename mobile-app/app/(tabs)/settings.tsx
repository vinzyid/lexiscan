import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';

import { useOCRStore } from '../../src/store/useStore';
import { GRADIENTS, THEMES, TYPE_LEVELS, type ThemeDef } from '../../src/theme/palettes';
import { useThemeColors } from '../../src/theme/theme-provider';
import { DyslexicText } from '../../src/components/dyslexic-text';
import { Blob, HexDecor, Ring, ScreenBackdrop, Sparkle } from '../../src/components/figma-decor';
import { LexiMascot } from '../../src/components/illustrations';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { themeId, setThemeId, typeLevelId, setTypeLevelId } = useOCRStore();

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* ── Kartu profil ──────────────────────────────────────────────── */}
        <LinearGradient
          colors={[...GRADIENTS.profileHeader.colors]}
          locations={[...GRADIENTS.profileHeader.locations]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 8, overflow: 'hidden' }}>
          <Ring size={110} style={{ position: 'absolute', top: -20, right: -24 }} />
          <Blob size={90} opacity={0.05} style={{ position: 'absolute', bottom: -30, left: -18 }} />
          <HexDecor size={20} style={{ position: 'absolute', top: 30, right: 96 }} />
          <Sparkle size={8} style={{ position: 'absolute', top: 22, right: 150 }} />
          <Sparkle size={7} style={{ position: 'absolute', bottom: 40, right: 42 }} />
          <Sparkle size={6} style={{ position: 'absolute', bottom: 22, left: 128 }} />

          <View className="flex-row items-center px-5 pb-6 pt-5" style={{ gap: 16 }}>
            <View>
              <LinearGradient
                colors={[...GRADIENTS.profileAvatar.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text className="font-ui-bold text-2xl text-white">R</Text>
              </LinearGradient>
              {/* Lencana terverifikasi di sudut avatar */}
              <View
                className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white"
                style={{ backgroundColor: '#10b981' }}>
                <Check size={10} color="#ffffff" strokeWidth={3} />
              </View>
            </View>

            <View className="flex-1">
              <View className="flex-row">
                <View className="rounded-[10px] border border-white/[0.15] bg-white/10 px-2 py-0.5">
                  <Text className="font-ui-bold text-[9.5px] text-white/65">PELAJAR</Text>
                </View>
              </View>
              <Text className="mt-1.5 font-ui-bold text-[21px] text-white">Rama Putra</Text>
              <Text className="mt-0.5 font-ui text-[12.5px] text-white/50">
                Kelas 10 · SMA Negeri 1
              </Text>
              <View className="mt-2.5 flex-row" style={{ gap: 8 }}>
                {['Gratis', 'Riset Ilmiah', 'Inklusif'].map((tag) => (
                  <View key={tag} className="rounded-[10px] bg-white/[0.12] px-2 py-0.5">
                    <Text className="font-ui-bold text-[9.5px] text-white/80">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </LinearGradient>

        <View className="px-4 pt-5">
          {/* ── Tema warna ──────────────────────────────────────────────── */}
          <SectionHeading eyebrow="TEMA WARNA" title="Ramah untuk mata disleksia" />

          <View className="mt-4" style={{ gap: 10 }}>
            {THEMES.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={theme.id === themeId}
                onPress={() => setThemeId(theme.id)}
              />
            ))}
          </View>

          {/* ── Tipografi default ───────────────────────────────────────── */}
          <View className="pt-7">
            <SectionHeading eyebrow="TIPOGRAFI DEFAULT" title="Mode baca default" />
          </View>

          <View className="mt-4" style={{ gap: 10 }}>
            {TYPE_LEVELS.map((level) => {
              const selected = level.id === typeLevelId;

              return (
                <Pressable
                  key={level.id}
                  onPress={() => setTypeLevelId(level.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Tipografi ${level.name}`}
                  className={`rounded-2xl border p-4 ${
                    selected ? 'border-primary/25 bg-primary/[0.07]' : 'border-border/10 bg-surface'
                  }`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      {selected ? (
                        <LinearGradient
                          colors={[...GRADIENTS.activePill.colors]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <Check size={11} color="#ffffff" strokeWidth={3} />
                        </LinearGradient>
                      ) : null}
                      <Text
                        className={`font-ui-bold text-sm ${
                          selected ? 'text-primary' : 'text-text-main'
                        }`}>
                        {level.name}
                      </Text>
                    </View>

                    <View className="flex-row" style={{ gap: 6 }}>
                      <MetricChip label="Font" value={`${level.fontSize}px`} />
                      <MetricChip label="Spasi" value={level.spacingLabel} />
                    </View>
                  </View>

                  <Text className="mt-2 font-ui-medium text-[11px] text-text-muted">
                    {level.desc}
                  </Text>

                  <View className="mt-3 border-t border-border/10 pt-3">
                    <DyslexicText levelOverride={level}>Membaca jadi lebih nyaman.</DyslexicText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ── Tentang aplikasi ────────────────────────────────────────── */}
          <View className="mt-7 overflow-hidden rounded-3xl">
            <LinearGradient
              colors={[...GRADIENTS.hero.colors]}
              locations={[...GRADIENTS.hero.locations]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, overflow: 'hidden' }}>
              <Blob size={85} opacity={0.06} style={{ position: 'absolute', top: -20, right: 8 }} />
              <Sparkle size={9} style={{ position: 'absolute', top: 18, right: 60 }} />
              <Sparkle size={8} style={{ position: 'absolute', bottom: 16, right: 26 }} />

              <View className="flex-row items-center" style={{ gap: 14 }}>
                <LexiMascot size={52} />
                <View className="flex-1">
                  <Text className="font-ui-bold text-lg text-white">LexiScan</Text>
                  <Text className="font-ui text-xs text-white/55">
                    Asisten baca untuk disleksia
                  </Text>
                  <View className="mt-2 flex-row" style={{ gap: 6 }}>
                    {['v1.0', 'Gratis', 'Inklusif'].map((tag) => (
                      <View key={tag} className="rounded-[10px] bg-white/[0.12] px-2 py-0.5">
                        <Text className="font-ui-bold text-[10px] text-white/80">{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </LinearGradient>

            <View className="bg-surface p-4">
              <Text className="font-ui text-xs leading-[21px] text-text-muted">
                LexiScan menggunakan prinsip aksesibilitas berbasis riset ilmiah untuk menciptakan
                pengalaman membaca yang nyaman dan efektif bagi semua orang.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  /** Judul seksi: bilah gradien 6x24 + label kecil di atas judul. */
  function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <LinearGradient
          colors={[...GRADIENTS.activePill.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ width: 6, height: 24, borderRadius: 3 }}
        />
        <View>
          <Text className="font-ui-bold text-[10px] text-text-muted">{eyebrow}</Text>
          <Text className="font-ui-bold text-[15px] text-text-main">{title}</Text>
        </View>
      </View>
    );
  }

  /** Chip "Font 18px" / "Spasi 5px" di kartu preset tipografi. */
  function MetricChip({ label, value }: { label: string; value: string }) {
    return (
      <View className="items-center rounded-[10px] px-2 py-0.5" style={{ backgroundColor: colors.surfaceAlt }}>
        <Text className="font-ui-medium text-[9px] text-text-muted">{label}</Text>
        <Text className="font-ui-bold text-[11px] text-text-main">{value}</Text>
      </View>
    );
  }
}

/**
 * Kartu pemilih tema: latar memakai gradien warna tema itu sendiri, sehingga
 * pengguna bisa melihat langsung suasana tiap palet tanpa menerapkannya.
 */
function ThemeCard({
  theme,
  selected,
  onPress,
}: {
  theme: ThemeDef;
  selected: boolean;
  onPress: () => void;
}) {
  const ink = theme.preview.stroke;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Tema ${theme.name}`}>
      <LinearGradient
        colors={[...theme.cardGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 68,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 16,
          borderRadius: 16,
          borderWidth: 1,
          // Terpilih: garis ungu penuh. Tidak terpilih: tinta tema @ 8%.
          borderColor: selected ? '#7c3aed' : hexWithAlpha(ink, 0.08),
        }}>
        <ThemePreview theme={theme} ink={ink} />

        <View className="flex-1">
          <Text className="font-ui-bold text-sm" style={{ color: theme.isDark ? '#e8e8f8' : ink }}>
            {theme.name}
          </Text>
          <View className="mt-1.5 flex-row" style={{ gap: 8 }}>
            {theme.swatches.map((swatch, index) => (
              <View
                key={index}
                style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: swatch }}
              />
            ))}
          </View>
        </View>

        {selected ? (
          <LinearGradient
            colors={[...GRADIENTS.activePill.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Check size={14} color="#ffffff" strokeWidth={3} />
          </LinearGradient>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

/**
 * Kotak 48x38 di kiri kartu tema: mini-halaman berisi judul, blok sorot, dan
 * beberapa baris teks — memakai warna tema yang bersangkutan, sehingga
 * pengguna melihat contoh nyata tiap palet.
 */
function ThemePreview({ theme, ink }: { theme: ThemeDef; ink: string }) {
  const muted = theme.swatches[0];

  return (
    <View
      style={{
        width: 48,
        height: 38,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: theme.preview.fill,
        borderWidth: 1,
        borderColor: hexWithAlpha(ink, 0.08),
      }}>
      {/* Judul */}
      <Bar x={5.1} y={4.8} w={20.8} h={2.8} color="rgba(124,58,237,0.5)" />
      {/* Blok sorot berisi dua baris */}
      <Bar x={5.1} y={10.5} w={37.9} h={13.3} color="rgba(124,58,237,0.12)" radius={2} />
      <Bar x={8.8} y={13.3} w={15.2} h={2.8} color="rgba(255,255,255,0.6)" />
      <Bar x={8.8} y={18.1} w={11.4} h={2.4} color="rgba(255,255,255,0.4)" />
      {/* Baris teks biasa */}
      <Bar x={5.1} y={26.6} w={17.1} h={2.8} color={muted} />
      <Bar x={24.9} y={26.6} w={17.1} h={2.8} color={muted} />
      <Bar x={5.1} y={32.3} w={11.4} h={1.9} color={muted} />
    </View>
  );
}

function Bar({
  x,
  y,
  w,
  h,
  color,
  radius = 1.4,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  radius?: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: radius,
        backgroundColor: color,
      }}
    />
  );
}

/** `#rrggbb` + alpha → `rgba(...)`, karena RN tidak menerima hex 8 digit di semua platform. */
function hexWithAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
