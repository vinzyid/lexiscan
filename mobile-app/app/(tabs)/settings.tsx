import { ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Languages, LogIn, LogOut } from 'lucide-react-native';

import { useOCRStore } from '../../src/store/useStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { GRADIENTS, THEMES, TYPE_LEVELS, type ThemeDef } from '../../src/theme/palettes';
import type { ReadingLevelId } from '../../src/theme/reading-levels';
import { useThemeColors } from '../../src/theme/theme-provider';
import { LANGUAGES, useT } from '../../src/i18n';
import { DyslexicText } from '../../src/components/dyslexic-text';
import { PressableScale } from '../../src/components/pressable-scale';
import { ReadingLevelPicker } from '../../src/components/reading-level-picker';
import { SpeakButton } from '../../src/components/speak-button';
import { VoicePicker } from '../../src/components/voice-picker';
import { useStopSpeechOnBlur } from '../../src/speech/use-speech';
import { Blob, HexDecor, Ring, ScreenBackdrop, Sparkle } from '../../src/components/figma-decor';
import { FootprintCard } from '../../src/components/footprint-card';
import { FeedbackForm } from '../../src/components/feedback-form';
import { LexiMascot } from '../../src/components/illustrations';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const t = useT();
  const {
    themeId,
    setThemeId,
    typeLevelId,
    setTypeLevelId,
    language,
    setLanguage,
    readingLevel,
    applyReadingLevelPreset,
    syllableSpacing,
    setSyllableSpacing,
    ttsEnabled,
    setTtsEnabled,
    ttsAutoPlay,
    setTtsAutoPlay,
  } = useOCRStore();

  const reader = useAuthStore((s) => s.reader);
  const signOut = useAuthStore((s) => s.signOut);
  const pushPreference = useAuthStore((s) => s.pushPreference);

  useStopSpeechOnBlur();

  /*
   * Perubahan disimpan dua kali: ke perangkat lewat store, lalu ke akun lewat
   * server. Yang kedua boleh gagal tanpa mengganggu — pengaturannya sudah
   * berlaku di HP ini, dan yang hilang hanya kemampuannya ikut pindah kalau
   * penggunanya berganti HP.
   */
  const changeReadingLevel = (id: ReadingLevelId) => {
    applyReadingLevelPreset(id);
    void pushPreference({
      reading_level: id,
      /*
       * Preferensi manual dikosongkan berbarengan, dan itu memang maksudnya:
       * memilih tingkat baru berarti minta dipasangkan preset yang baru. Kalau
       * pilihan lama tetap tersimpan di server, ia akan menimpa preset itu lagi
       * pada login berikutnya.
       */
      type_level: null,
      tts_enabled: null,
      tts_auto_play: null,
      syllable_spacing: null,
    });
  };

  const changeTts = (value: boolean) => {
    setTtsEnabled(value);
    void pushPreference(
      value
        ? { tts_enabled: true }
        : { tts_enabled: false, tts_auto_play: false },
    );
  };

  const changeAutoPlay = (value: boolean) => {
    setTtsAutoPlay(value);
    void pushPreference(value ? { tts_auto_play: true, tts_enabled: true } : { tts_auto_play: false });
  };

  const changeSyllableSpacing = (value: boolean) => {
    setSyllableSpacing(value);
    void pushPreference({ syllable_spacing: value });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />

      {/* keyboardShouldPersistTaps: tanpa ini ketukan pertama pada tombol Kirim
          hanya menutup papan ketik, dan laporannya seakan tidak terkirim. */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
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
                {/* Huruf awal nama akun; tanpa akun, maskotnya yang tampil
                    supaya tidak ada inisial yang seolah-olah milik seseorang. */}
                {reader ? (
                  <Text className="font-ui-bold text-2xl text-white">
                    {reader.name.trim().slice(0, 1).toUpperCase()}
                  </Text>
                ) : (
                  <LexiMascot size={44} />
                )}
              </LinearGradient>
              {reader ? (
                <View
                  className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white"
                  style={{ backgroundColor: '#10b981' }}>
                  <Check size={10} color="#ffffff" strokeWidth={3} />
                </View>
              ) : null}
            </View>

            <View className="flex-1">
              <View className="flex-row">
                <View className="rounded-[10px] border border-white/[0.15] bg-white/10 px-2 py-0.5">
                  <Text className="font-ui-bold text-xs text-white/65">
                    {reader ? t.readingLevels[reader.reading_level].name : t.settings.role}
                  </Text>
                </View>
              </View>
              <Text className="mt-1.5 font-ui-bold text-[21px] text-white" numberOfLines={1}>
                {reader ? reader.name : t.settings.guestName}
              </Text>
              <Text className="mt-0.5 font-ui text-[13px] text-white/55" numberOfLines={1}>
                {reader ? `@${reader.username}` : t.settings.guestSubtitle}
              </Text>

              <View className="mt-2.5 flex-row" style={{ gap: 8 }}>
                {reader ? (
                  <PressableScale
                    onPress={() => void signOut()}
                    accessibilityRole="button"
                    accessibilityLabel={t.settings.logoutLabel}
                    scaleTo={0.95}
                    className="h-9 flex-row items-center rounded-[12px] bg-white/[0.14] px-3"
                    style={{ gap: 6 }}>
                    <LogOut size={13} color="#ffffff" />
                    <Text className="font-ui-bold text-xs text-white">
                      {t.settings.logoutAction}
                    </Text>
                  </PressableScale>
                ) : (
                  <PressableScale
                    onPress={() => router.push('/(auth)/welcome')}
                    accessibilityRole="button"
                    accessibilityLabel={t.settings.loginAction}
                    scaleTo={0.95}
                    className="h-9 flex-row items-center rounded-[12px] bg-white/[0.18] px-3"
                    style={{ gap: 6 }}>
                    <LogIn size={13} color="#ffffff" />
                    <Text className="font-ui-bold text-xs text-white">
                      {t.settings.loginAction}
                    </Text>
                  </PressableScale>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        <View className="px-4 pt-5">
          {/* Bahasa paling atas: ia mengubah seluruh isi layar ini. */}
          <SectionHeading eyebrow={t.settings.languageEyebrow} title={t.settings.languageTitle} />

          <View className="mt-4 flex-row" style={{ gap: 10 }}>
            {LANGUAGES.map((option) => {
              const selected = option.id === language;

              return (
                <PressableScale
                  key={option.id}
                  onPress={() => setLanguage(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.english}
                  scaleTo={0.97}
                  wrapperStyle={{ flex: 1 }}
                  className={`h-[62px] flex-1 flex-row items-center rounded-2xl border px-4 ${
                    selected ? 'border-primary/30 bg-primary/[0.08]' : 'border-border/10 bg-surface'
                  }`}
                  style={{ gap: 10 }}>
                  <Languages size={20} color={selected ? colors.primary : colors.textMuted} />
                  <Text
                    className={`flex-1 font-ui-bold text-[15px] ${
                      selected ? 'text-primary' : 'text-text-main'
                    }`}>
                    {option.name}
                  </Text>
                  {selected ? (
                    <LinearGradient
                      colors={[...GRADIENTS.activePill.colors]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Check size={12} color="#ffffff" strokeWidth={3} />
                    </LinearGradient>
                  ) : null}
                </PressableScale>
              );
            })}
          </View>

          <Text className="mt-2.5 font-ui-medium text-[13px] text-text-muted">
            {t.settings.languageNote}
          </Text>

          {/* ── Kemampuan membaca ───────────────────────────────────────── */}
          <View className="pt-7">
            <SectionHeading
              eyebrow={t.settings.readingEyebrow}
              title={t.settings.readingTitle}
              speechKey="settings:reading"
            />
          </View>

          <Text className="mt-2.5 font-ui-medium text-[13px] leading-5 text-text-muted">
            {t.settings.readingNote}
          </Text>

          <View className="mt-4">
            <ReadingLevelPicker value={readingLevel} onChange={changeReadingLevel} />
          </View>

          {/* ── Suara ───────────────────────────────────────────────────── */}
          <View className="pt-7">
            <SectionHeading
              eyebrow={t.settings.voiceEyebrow}
              title={t.settings.voiceTitle}
              speechKey="settings:voice"
            />
          </View>

          <View className="mt-4" style={{ gap: 10 }}>
            {/*
              Sakelar ini wajib ada dan tidak boleh dikunci oleh tingkat
              kemampuan membaca. Dosen PLB menegaskan fitur suara harus tetap
              opsional: penyesuaian yang dipaksakan justru membuat pengguna
              yang sudah lancar membaca merasa terganggu.
            */}
            <ToggleRow
              title={t.settings.ttsTitle}
              desc={t.settings.ttsDesc}
              value={ttsEnabled}
              onValueChange={changeTts}
            />
            <ToggleRow
              title={t.settings.autoPlayTitle}
              desc={t.settings.autoPlayDesc}
              value={ttsAutoPlay}
              onValueChange={changeAutoPlay}
              // Tidak masuk akal menyalakan pembacaan otomatis saat suaranya
              // sendiri mati; dibuat redup, bukan disembunyikan, supaya
              // hubungannya dengan sakelar di atas tetap terlihat.
              disabled={!ttsEnabled}
            />
            <ToggleRow
              title={t.settings.syllableTitle}
              desc={t.settings.syllableDesc}
              value={syllableSpacing}
              onValueChange={changeSyllableSpacing}
            />
          </View>

          <Text className="mt-2.5 font-ui-medium text-[13px] leading-5 text-text-muted">
            {t.settings.voiceOfflineNote}
          </Text>

          {/*
            Pemilih suara hanya muncul saat suaranya menyala. Menawarkan
            pilihan yang tiap ketukannya berbunyi kepada orang yang baru saja
            mematikan suara adalah persis kebalikan dari yang ia minta.
          */}
          {ttsEnabled ? (
            <>
              <Text className="mb-3 mt-6 font-ui-bold text-[15px] text-text-main">
                {t.settings.voicePickerTitle}
              </Text>
              <VoicePicker />
            </>
          ) : null}

          {/* ── Tema warna ──────────────────────────────────────────────── */}
          <View className="pt-7">
            <SectionHeading eyebrow={t.settings.themeEyebrow} title={t.settings.themeTitle} />
          </View>

          <View className="mt-4" style={{ gap: 10 }}>
            {THEMES.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                name={t.themes[theme.id]}
                selected={theme.id === themeId}
                onPress={() => setThemeId(theme.id)}
              />
            ))}
          </View>

          {/* ── Tipografi default ───────────────────────────────────────── */}
          <View className="pt-7">
            <SectionHeading eyebrow={t.settings.typeEyebrow} title={t.settings.typeTitle} />
          </View>

          <View className="mt-4" style={{ gap: 10 }}>
            {TYPE_LEVELS.map((level) => {
              const selected = level.id === typeLevelId;

              return (
                <PressableScale
                  key={level.id}
                  onPress={() => setTypeLevelId(level.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t.settings.typeEyebrow} ${t.typeLevels[level.id].name}. ${t.typeLevels[level.id].desc}`}
                  scaleTo={0.98}
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
                        {t.typeLevels[level.id].name}
                      </Text>
                    </View>

                    <View className="flex-row" style={{ gap: 6 }}>
                      <MetricChip label={t.settings.fontChip} value={`${level.fontSize}px`} />
                      <MetricChip label={t.settings.spacingChip} value={level.spacingLabel} />
                    </View>
                  </View>

                  <Text className="mt-2 font-ui-medium text-[13px] text-text-muted">
                    {t.typeLevels[level.id].desc}
                  </Text>

                  <View className="mt-3 border-t border-border/10 pt-3">
                    <DyslexicText levelOverride={level}>{t.typography.previewSettings}</DyslexicText>
                  </View>
                </PressableScale>
              );
            })}
          </View>

          {/* ── Jejak karbon AI ─────────────────────────────────────────── */}
          <View className="pt-7">
            <SectionHeading eyebrow={t.footprint.eyebrow} title={t.footprint.title} />
          </View>

          <FootprintCard />

          {/* ── Masukan & laporan pindai gagal ──────────────────────────── */}
          <View className="pt-7">
            <SectionHeading eyebrow={t.feedback.eyebrow} title={t.feedback.title} />
          </View>

          <FeedbackForm />

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
                  <Text className="font-ui-medium text-[13px] text-white/60">
                    {t.settings.aboutTagline}
                  </Text>
                  <View className="mt-2 flex-row" style={{ gap: 6 }}>
                    {t.settings.aboutTags.map((tag) => (
                      <View key={tag} className="rounded-[10px] bg-white/[0.12] px-2 py-0.5">
                        <Text className="font-ui-bold text-xs text-white/80">{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </LinearGradient>

            <View className="bg-surface p-4">
              <Text className="font-ui-medium text-sm leading-[23px] text-text-muted">
                {t.settings.aboutBody}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  /** Judul seksi: bilah gradien 6x24 + label kecil di atas judul. */
  function SectionHeading({
    eyebrow,
    title,
    speechKey,
  }: {
    eyebrow: string;
    title: string;
    /** Diisi hanya untuk seksi yang perlu bisa dibacakan; sisanya tetap polos. */
    speechKey?: string;
  }) {
    return (
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <LinearGradient
          colors={[...GRADIENTS.activePill.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ width: 6, height: 24, borderRadius: 3 }}
        />
        <View className="flex-1">
          <Text className="font-ui-bold text-xs text-text-muted">{eyebrow}</Text>
          <Text className="font-ui-bold text-[17px] text-text-main">{title}</Text>
        </View>
        {speechKey ? (
          <SpeakButton text={`${eyebrow}. ${title}`} speechKey={speechKey} size={16} />
        ) : null}
      </View>
    );
  }

  /** Satu baris sakelar: judul, keterangan, dan Switch di kanan. */
  function ToggleRow({
    title,
    desc,
    value,
    onValueChange,
    disabled,
  }: {
    title: string;
    desc: string;
    value: boolean;
    onValueChange: (next: boolean) => void;
    disabled?: boolean;
  }) {
    return (
      <View
        className="flex-row items-center rounded-2xl border border-border/10 bg-surface p-4"
        style={{ gap: 12, opacity: disabled ? 0.45 : 1 }}>
        <View className="flex-1">
          <Text className="font-ui-bold text-[15px] text-text-main">{title}</Text>
          <Text className="mt-1 font-ui-medium text-[13px] leading-5 text-text-muted">{desc}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          accessibilityLabel={`${title}. ${desc}`}
          trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
          thumbColor="#ffffff"
        />
      </View>
    );
  }

  /** Chip "Font 18px" / "Spasi 5px" di kartu preset tipografi. */
  function MetricChip({ label, value }: { label: string; value: string }) {
    return (
      <View className="items-center rounded-[10px] px-2 py-0.5" style={{ backgroundColor: colors.surfaceAlt }}>
        <Text className="font-ui-medium text-[11px] text-text-muted">{label}</Text>
        <Text className="font-ui-bold text-[13px] text-text-main">{value}</Text>
      </View>
    );
  }
}

/** Kartu pemilih tema; latarnya memakai gradien warna tema itu sendiri. */
function ThemeCard({
  theme,
  name,
  selected,
  onPress,
}: {
  theme: ThemeDef;
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  const ink = theme.preview.stroke;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={name}
      scaleTo={0.98}>
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
          <Text className="font-ui-bold text-[15px]" style={{ color: theme.isDark ? '#e8e8f8' : ink }}>
            {name}
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
    </PressableScale>
  );
}

/**
 * Kotak 48x38 di kiri kartu tema: mini-halaman berisi judul, blok sorot, dan
 * beberapa baris teks, memakai warna tema yang bersangkutan.
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
