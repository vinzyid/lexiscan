import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import {
  BellRing,
  BookOpen,
  Check,
  GraduationCap,
  Languages,
  Leaf,
  LifeBuoy,
  LogIn,
  LogOut,
  Palette,
  SquarePen,
  Type,
  UserRound,
  Volume2,
} from 'lucide-react-native';

import { useOCRStore } from '../../src/store/useStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { GRADIENTS, THEMES, TYPE_LEVELS } from '../../src/theme/palettes';
import type { ReadingLevelId } from '../../src/theme/reading-levels';
import { useThemeColors } from '../../src/theme/theme-provider';
import { LANGUAGES, useT } from '../../src/i18n';
import { DyslexicText } from '../../src/components/dyslexic-text';
import { PressableScale } from '../../src/components/pressable-scale';
import { ReadingLevelPicker } from '../../src/components/reading-level-picker';
import { VoicePicker } from '../../src/components/voice-picker';
import { SettingsGroup, SettingsRow, SettingsSection, SettingsSheet } from '../../src/components/settings-kit';
import { useStopSpeechOnBlur } from '../../src/speech/use-speech';
import { Blob, HexDecor, Ring, ScreenBackdrop, Sparkle } from '../../src/components/figma-decor';
import { FootprintCard } from '../../src/components/footprint-card';
import { FeedbackForm } from '../../src/components/feedback-form';
import { LexiMascot } from '../../src/components/illustrations';
import { disableDailyTip, enableDailyTip } from '../../src/notifications/daily-tip';

/**
 * Layar Atur — mengikuti frame "ProfileScreen" di Figma.
 *
 * BENTUKNYA BERUBAH, ISINYA TIDAK BERKURANG. Versi sebelumnya menaruh semua
 * pilihan berjajar di satu halaman yang sangat panjang; Figma menggantinya
 * dengan daftar baris pendek yang membuka lembar bawah. Pilihan yang tidak
 * punya baris di Figma — bahasa, kemampuan membaca, jejak karbon — tetap ada,
 * memakai bentuk baris yang sama, karena membuang fitur demi kemiripan gambar
 * bukan yang diminta.
 *
 * Yang memang tidak dibuat: tiga ubin statistik dan baris "Statistik Belajar".
 * Aplikasi ini tidak mencatat sesi baca, jumlah kata, maupun hari aktif, dan
 * menampilkan angka yang tidak dihitung dari apa pun lebih buruk daripada
 * tidak menampilkannya.
 */

type Sheet = 'theme' | 'type' | 'voice' | 'language' | 'reading' | 'footprint' | 'help' | 'name';

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
    dailyTipEnabled,
    setDailyTipEnabled,
  } = useOCRStore();

  const reader = useAuthStore((s) => s.reader);
  const signOut = useAuthStore((s) => s.signOut);
  const pushPreference = useAuthStore((s) => s.pushPreference);

  useStopSpeechOnBlur();

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [logoutAsking, setLogoutAsking] = useState(false);
  const [draftName, setDraftName] = useState('');

  const close = () => setSheet(null);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const activeTheme = THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];

  /**
   * Baris kedua di kartu profil: jenjang sekolah, persis seperti Figma
   * ("Kelas 10 · SMA Negeri 1"). Nama sekolahnya tidak pernah ditanyakan
   * aplikasi ini, jadi yang ditampilkan hanya yang benar-benar diketahui.
   */
  const schoolLine = reader?.school_level
    ? t.schoolLevels[reader.school_level].name
    : t.readingLevels[readingLevel].name;

  const changeReadingLevel = (id: ReadingLevelId) => {
    applyReadingLevelPreset(id);
    void pushPreference({
      reading_level: id,
      type_level: null,
      tts_enabled: null,
      tts_auto_play: null,
      syllable_spacing: null,
    });
  };

  /**
   * Sakelar notifikasi, dan satu-satunya sakelar di layar ini yang bisa
   * MENOLAK dinyalakan: kalau izin notifikasi ditolak di tingkat sistem, tidak
   * ada yang bisa dilakukan aplikasi, dan sakelar menyala yang tidak pernah
   * berbunyi lebih menyesatkan daripada sakelar yang kembali mati disertai
   * penjelasan.
   */
  const changeDailyTip = async (next: boolean) => {
    if (!next) {
      setDailyTipEnabled(false);
      await disableDailyTip();

      return;
    }

    const scheduled = await enableDailyTip({
      title: t.settings.rowDailyTip,
      body: t.dashboard.tipOfDay,
    });

    setDailyTipEnabled(scheduled);
    if (!scheduled) Alert.alert(t.settings.rowDailyTip, t.settings.dailyTipDenied);
  };

  const saveName = () => {
    const trimmed = draftName.trim();
    if (trimmed.length < 2) return;

    void pushPreference({ name: trimmed });
    close();
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ── Kartu profil ────────────────────────────────────────────────── */}
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
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {/* Tanpa akun, maskotnya yang tampil — bukan inisial karangan
                    yang seolah-olah milik seseorang. */}
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
                <View className="flex-row items-center rounded-[10px] border border-white/[0.15] bg-white/10 px-2 py-0.5" style={{ gap: 4 }}>
                  <GraduationCap size={11} color="rgba(255,255,255,0.65)" />
                  <Text className="font-ui-bold text-xs text-white/65">{t.settings.role}</Text>
                </View>
              </View>

              <Text className="mt-1.5 font-ui-bold text-[21px] text-white" numberOfLines={1}>
                {reader ? reader.name : t.settings.guestName}
              </Text>
              <Text className="mt-0.5 font-ui text-[13px] text-white/55" numberOfLines={1}>
                {reader ? schoolLine : t.settings.guestSubtitle}
              </Text>
            </View>

            {/* Tombol Edit di Figma; tanpa akun ia berubah jadi ajakan masuk,
                karena tidak ada profil yang bisa disunting. */}
            {reader ? (
              <PressableScale
                onPress={() => {
                  setDraftName(reader.name);
                  setSheet('name');
                }}
                accessibilityRole="button"
                accessibilityLabel={t.settings.rowName}
                scaleTo={0.95}
                className="h-9 flex-row items-center rounded-[12px] bg-white/[0.14] px-3"
                style={{ gap: 6 }}>
                <SquarePen size={13} color="#ffffff" />
                <Text className="font-ui-bold text-xs text-white">{t.settings.editAction}</Text>
              </PressableScale>
            ) : (
              <PressableScale
                onPress={() => router.push('/(auth)/welcome')}
                accessibilityRole="button"
                accessibilityLabel={t.settings.loginAction}
                scaleTo={0.95}
                className="h-9 flex-row items-center rounded-[12px] bg-white/[0.14] px-3"
                style={{ gap: 6 }}>
                <LogIn size={13} color="#ffffff" />
                <Text className="font-ui-bold text-xs text-white">{t.settings.loginAction}</Text>
              </PressableScale>
            )}
          </View>
        </LinearGradient>

        <View className="px-5">
          {/* ── Tampilan ─────────────────────────────────────────────────── */}
          <SettingsSection eyebrow={t.settings.displayEyebrow} title={t.settings.displayTitle} />

          <SettingsGroup>
            <SettingsRow
              Icon={Palette}
              title={t.settings.rowTheme}
              value={t.themes[themeId]}
              divider={false}
              dot={activeTheme.swatches[0]}
              onPress={() => setSheet('theme')}
            />
            <SettingsRow
              Icon={Type}
              title={t.settings.rowDyslexia}
              value={`${t.typeLevels[typeLevelId].name} — ${t.typeLevels[typeLevelId].desc}`}
              onPress={() => setSheet('type')}
            />
            <SettingsRow
              Icon={BookOpen}
              title={t.settings.rowReading}
              value={t.readingLevels[readingLevel].name}
              onPress={() => setSheet('reading')}
            />
          </SettingsGroup>

          {/* ── Preferensi ───────────────────────────────────────────────── */}
          <SettingsSection eyebrow={t.settings.prefsEyebrow} title={t.settings.prefsTitle} />

          <SettingsGroup>
            <SettingsRow
              Icon={BellRing}
              title={t.settings.rowDailyTip}
              value={dailyTipEnabled ? t.settings.dailyTipOn : t.settings.dailyTipOff}
              divider={false}
              toggle={{ value: dailyTipEnabled, onValueChange: (next) => void changeDailyTip(next) }}
            />
            <SettingsRow
              Icon={Volume2}
              title={t.settings.rowVoice}
              value={useOCRStore.getState().ttsEnabled ? t.settings.dailyTipOn.split(' · ')[0] : t.settings.dailyTipOff}
              onPress={() => setSheet('voice')}
            />
            <SettingsRow
              Icon={Languages}
              title={t.settings.rowLanguage}
              value={LANGUAGES.find((item) => item.id === language)?.name}
              onPress={() => setSheet('language')}
            />
            <SettingsRow
              Icon={Leaf}
              title={t.settings.rowFootprint}
              value={t.settings.rowFootprintDesc}
              onPress={() => setSheet('footprint')}
            />
          </SettingsGroup>

          {/* ── Akun ─────────────────────────────────────────────────────── */}
          <SettingsSection eyebrow={t.settings.accountEyebrow} title={t.settings.profileTitle} />

          <SettingsGroup>
            {reader ? (
              <SettingsRow
                Icon={UserRound}
                title={t.settings.rowName}
                value={reader.name}
                divider={false}
                onPress={() => {
                  setDraftName(reader.name);
                  setSheet('name');
                }}
              />
            ) : null}
            <SettingsRow
              Icon={LifeBuoy}
              title={t.settings.rowHelp}
              value={t.settings.rowHelpDesc}
              divider={Boolean(reader)}
              onPress={() => setSheet('help')}
            />
          </SettingsGroup>

          {/* ── Kartu tentang aplikasi ───────────────────────────────────── */}
          <LinearGradient
            colors={[...GRADIENTS.hero.colors]}
            locations={[...GRADIENTS.hero.locations]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ marginTop: 28, borderRadius: 24, overflow: 'hidden', padding: 18 }}>
            <Blob size={110} opacity={0.06} style={{ position: 'absolute', top: -30, right: -20 }} />

            <View className="flex-row items-center" style={{ gap: 14 }}>
              <LexiMascot size={52} />
              <View className="flex-1">
                <Text className="font-ui-bold text-[19px] text-white">LexiScan</Text>
                <Text className="mt-0.5 font-ui text-[12px] text-white/55">
                  {t.settings.aboutTagline}
                </Text>

                <View className="mt-2 flex-row" style={{ gap: 6 }}>
                  {[`v${version}`, ...t.settings.aboutTags.slice(1)].map(
                    (chip) => (
                      <View key={chip} className="rounded-lg bg-white/[0.14] px-2 py-0.5">
                        <Text className="font-ui-bold text-[10px] text-white/80">{chip}</Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            </View>

            <Text className="mt-3.5 font-ui-medium text-[12px] leading-[19px] text-white/55">
              {t.settings.aboutBody}
            </Text>
          </LinearGradient>

          {/* ── Keluar ───────────────────────────────────────────────────── */}
          {reader ? (
            <PressableScale
              onPress={() => setLogoutAsking(true)}
              accessibilityRole="button"
              accessibilityLabel={t.settings.logoutAction}
              scaleTo={0.98}
              className="mt-4 h-14 flex-row items-center justify-center rounded-2xl border border-danger/30 bg-danger/[0.08]"
              style={{ gap: 8 }}>
              <LogOut size={17} color="#ef4444" />
              <Text className="font-ui-bold text-[15px]" style={{ color: '#ef4444' }}>
                {t.settings.logoutAction}
              </Text>
            </PressableScale>
          ) : null}

          <Text className="mt-5 text-center font-ui-medium text-[11px] text-text-muted">
            {t.settings.footer(version)}
          </Text>
        </View>
      </ScrollView>

      {/* ── Lembar: Tema Warna ─────────────────────────────────────────────── */}
      <SettingsSheet visible={sheet === 'theme'} title={t.settings.rowTheme} onClose={close}>
        <View style={{ gap: 10 }}>
          {THEMES.map((theme) => {
            const selected = theme.id === themeId;

            return (
              <PressableScale
                key={theme.id}
                onPress={() => setThemeId(theme.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t.themes[theme.id]}
                scaleTo={0.98}
                className="overflow-hidden rounded-2xl border-2"
                style={{ borderColor: selected ? colors.primary : 'transparent' }}>
                <LinearGradient
                  colors={[...theme.cardGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: theme.preview.fill,
                      borderWidth: 1,
                      borderColor: theme.preview.stroke,
                    }}
                  />
                  <View className="flex-1">
                    <Text
                      className="font-ui-bold text-[15px]"
                      style={{ color: theme.tokens.textMain }}>
                      {t.themes[theme.id]}
                    </Text>
                    <View className="mt-1.5 flex-row" style={{ gap: 5 }}>
                      {theme.swatches.map((swatch, index) => (
                        <View
                          key={index}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: swatch,
                          }}
                        />
                      ))}
                    </View>
                  </View>

                  {selected ? (
                    <View
                      className="h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary }}>
                      <Check size={13} color="#ffffff" strokeWidth={3} />
                    </View>
                  ) : null}
                </LinearGradient>
              </PressableScale>
            );
          })}
        </View>
      </SettingsSheet>

      {/* ── Lembar: Mode Disleksia ─────────────────────────────────────────── */}
      <SettingsSheet visible={sheet === 'type'} title={t.settings.rowDyslexia} onClose={close}>
        <View style={{ gap: 12 }}>
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
                className={`rounded-2xl border-2 p-4 ${
                  selected ? 'border-primary bg-primary/[0.06]' : 'border-border/10 bg-surface'
                }`}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  {selected ? (
                    <View
                      className="h-[18px] w-[18px] items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary }}>
                      <Check size={11} color="#ffffff" strokeWidth={3} />
                    </View>
                  ) : null}

                  <Text
                    className={`flex-1 font-ui-bold text-[15px] ${
                      selected ? 'text-primary' : 'text-text-main'
                    }`}>
                    {t.typeLevels[level.id].name}
                  </Text>

                  {/* Angka pastinya, seperti di Figma: "18px · spasi 5px". */}
                  <Text className="font-ui-medium text-[11px] text-text-muted">
                    {level.fontSize}px · {t.settings.spacingChip.toLowerCase()} {level.spacingLabel}
                  </Text>
                </View>

                <Text className="mt-1.5 font-ui-medium text-[12px] leading-[18px] text-text-muted">
                  {t.typeLevels[level.id].desc}
                </Text>

                {/* Pratinjau hidup — kalimat yang sama dipakai ketiga kartu,
                    supaya yang berbeda hanya bentuk tulisannya. */}
                <View className="mt-3">
                  <DyslexicText levelOverride={level}>{t.typography.preview}</DyslexicText>
                </View>
              </PressableScale>
            );
          })}
        </View>
      </SettingsSheet>

      {/* ── Lembar: Suara ──────────────────────────────────────────────────── */}
      <SettingsSheet visible={sheet === 'voice'} title={t.settings.rowVoice} onClose={close}>
        <VoiceSheetBody />
      </SettingsSheet>

      {/* ── Lembar: Bahasa ─────────────────────────────────────────────────── */}
      <SettingsSheet visible={sheet === 'language'} title={t.settings.rowLanguage} onClose={close}>
        <View style={{ gap: 10 }}>
          {LANGUAGES.map((item) => {
            const selected = item.id === language;

            return (
              <PressableScale
                key={item.id}
                onPress={() => setLanguage(item.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={item.name}
                scaleTo={0.98}
                className={`flex-row items-center rounded-2xl border p-4 ${
                  selected ? 'border-primary/30 bg-primary/[0.08]' : 'border-border/10 bg-surface'
                }`}
                style={{ gap: 12 }}>
                <Languages size={18} color={selected ? colors.primary : colors.textMuted} />
                <View className="flex-1">
                  <Text
                    className={`font-ui-bold text-[15px] ${
                      selected ? 'text-primary' : 'text-text-main'
                    }`}>
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 font-ui-medium text-[12px] text-text-muted">
                    {item.english}
                  </Text>
                </View>
                {selected ? <Check size={18} color={colors.primary} strokeWidth={3} /> : null}
              </PressableScale>
            );
          })}

          <Text className="mt-1 font-ui-medium text-[13px] leading-5 text-text-muted">
            {t.settings.languageNote}
          </Text>
        </View>
      </SettingsSheet>

      {/* ── Lembar: Kemampuan membaca ──────────────────────────────────────── */}
      <SettingsSheet visible={sheet === 'reading'} title={t.settings.rowReading} onClose={close}>
        <Text className="mb-4 font-ui-medium text-[13px] leading-5 text-text-muted">
          {t.settings.readingNote}
        </Text>
        <ReadingLevelPicker value={readingLevel} onChange={changeReadingLevel} />
      </SettingsSheet>

      {/* ── Lembar: Jejak karbon ───────────────────────────────────────────── */}
      <SettingsSheet visible={sheet === 'footprint'} title={t.settings.rowFootprint} onClose={close}>
        <FootprintCard />
      </SettingsSheet>

      {/* ── Lembar: Bantuan ────────────────────────────────────────────────── */}
      <SettingsSheet visible={sheet === 'help'} title={t.settings.rowHelp} onClose={close}>
        <FeedbackForm />
      </SettingsSheet>

      {/* ── Lembar: Ubah nama ──────────────────────────────────────────────── */}
      <SettingsSheet visible={sheet === 'name'} title={t.settings.nameSheetTitle} onClose={close}>
        <View
          className="flex-row items-center rounded-3xl border-2 border-border/10 bg-surface-alt px-4"
          style={{ height: 66 }}>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            placeholder={t.auth.namePlaceholder}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t.auth.nameLabel}
            autoCapitalize="words"
            className="flex-1 font-read text-text-main"
            style={{ fontSize: 18, letterSpacing: 0.5 }}
          />
        </View>

        <PressableScale
          onPress={saveName}
          accessibilityRole="button"
          accessibilityLabel={t.settings.nameSave}
          scaleTo={0.98}
          className="mt-4 overflow-hidden rounded-2xl">
          <LinearGradient
            colors={[...GRADIENTS.activePill.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-ui-bold text-[16px] text-white">{t.settings.nameSave}</Text>
          </LinearGradient>
        </PressableScale>
      </SettingsSheet>

      {/* ── Dialog: keluar dari akun ───────────────────────────────────────── */}
      <SettingsSheet
        visible={logoutAsking}
        title={t.settings.logoutTitle}
        onClose={() => setLogoutAsking(false)}>
        <View className="items-center pb-2">
          <View className="h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
            <LogOut size={26} color="#ef4444" />
          </View>

          <Text className="mt-4 text-center font-ui-medium text-[14px] leading-[22px] text-text-muted">
            {t.settings.logoutBody}
          </Text>
        </View>

        <View className="mt-5 flex-row" style={{ gap: 12 }}>
          <PressableScale
            onPress={() => setLogoutAsking(false)}
            accessibilityRole="button"
            accessibilityLabel={t.settings.cancel}
            scaleTo={0.97}
            wrapperStyle={{ flex: 1 }}
            className="h-14 items-center justify-center rounded-2xl bg-surface-alt">
            <Text className="font-ui-bold text-[15px] text-text-main">{t.settings.cancel}</Text>
          </PressableScale>

          <PressableScale
            onPress={() => {
              setLogoutAsking(false);
              void signOut();
            }}
            accessibilityRole="button"
            accessibilityLabel={t.settings.logoutConfirm}
            scaleTo={0.97}
            wrapperStyle={{ flex: 1 }}
            className="h-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
            <Text className="font-ui-bold text-[15px]" style={{ color: '#ef4444' }}>
              {t.settings.logoutConfirm}
            </Text>
          </PressableScale>
        </View>
      </SettingsSheet>
    </View>
  );
}

/**
 * Isi lembar Suara.
 *
 * Komponen tersendiri, bukan bagian layarnya, supaya sakelar-sakelar di
 * dalamnya berlangganan store hanya selama lembarnya terbuka — layar Atur
 * sendiri tidak perlu ikut dirender ulang tiap salah satunya diubah.
 */
function VoiceSheetBody() {
  const t = useT();
  const {
    ttsEnabled,
    setTtsEnabled,
    ttsAutoPlay,
    setTtsAutoPlay,
    speakButtonLabels,
    setSpeakButtonLabels,
    syllableSpacing,
    setSyllableSpacing,
  } = useOCRStore();

  const pushPreference = useAuthStore((s) => s.pushPreference);

  const rows: { title: string; desc: string; value: boolean; set: (next: boolean) => void }[] = [
    {
      title: t.settings.ttsTitle,
      desc: t.settings.ttsDesc,
      value: ttsEnabled,
      set: (next) => {
        setTtsEnabled(next);
        void pushPreference(
          next ? { tts_enabled: true } : { tts_enabled: false, tts_auto_play: false },
        );
      },
    },
    {
      title: t.settings.autoPlayTitle,
      desc: t.settings.autoPlayDesc,
      value: ttsAutoPlay,
      set: (next) => {
        setTtsAutoPlay(next);
        void pushPreference(
          next ? { tts_auto_play: true, tts_enabled: true } : { tts_auto_play: false },
        );
      },
    },
    {
      title: t.settings.speakLabelsTitle,
      desc: t.settings.speakLabelsDesc,
      value: speakButtonLabels,
      set: setSpeakButtonLabels,
    },
    {
      title: t.settings.syllableTitle,
      desc: t.settings.syllableDesc,
      value: syllableSpacing,
      set: (next) => {
        setSyllableSpacing(next);
        void pushPreference({ syllable_spacing: next });
      },
    },
  ];

  return (
    <View>
      <SettingsGroup>
        {rows.map((row, index) => (
          <SettingsRow
            key={row.title}
            Icon={Volume2}
            title={row.title}
            value={row.desc}
            divider={index > 0}
            toggle={{ value: row.value, onValueChange: row.set }}
          />
        ))}
      </SettingsGroup>

      <Text className="mt-3 font-ui-medium text-[13px] leading-5 text-text-muted">
        {t.settings.voiceOfflineNote}
      </Text>

      {ttsEnabled ? (
        <View className="mt-5">
          <Text className="mb-3 font-ui-bold text-[15px] text-text-main">
            {t.settings.voicePickerTitle}
          </Text>
          <VoicePicker />
        </View>
      ) : null}
    </View>
  );
}
