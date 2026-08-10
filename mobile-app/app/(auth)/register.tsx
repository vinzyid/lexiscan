import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';

import { AiApiError } from '../../src/api/ai';
import { AuthField } from '../../src/components/auth-field';
import { Blob, ScreenBackdrop, Sparkle } from '../../src/components/figma-decor';
import { LexiMascot } from '../../src/components/illustrations';
import { PressableScale } from '../../src/components/pressable-scale';
import { ReadingLevelPicker } from '../../src/components/reading-level-picker';
import { SpeakButton } from '../../src/components/speak-button';
import { useT } from '../../src/i18n';
import { useStopSpeechOnUnmount } from '../../src/speech/use-speech';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useOCRStore } from '../../src/store/useStore';
import { GRADIENTS } from '../../src/theme/palettes';
import type { ReadingLevelId } from '../../src/theme/reading-levels';
import { useThemeColors } from '../../src/theme/theme-provider';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const t = useT();
  const signUp = useAuthStore((s) => s.signUp);
  const dismissAuthPrompt = useOCRStore((s) => s.dismissAuthPrompt);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  /*
   * Sengaja null di awal, bukan 'mengeja'. Kalau sudah ada yang terpilih,
   * pendamping bisa melewatinya tanpa sadar — padahal justru inilah pertanyaan
   * yang menentukan seluruh tampilan aplikasi bagi anak ini.
   */
  const [readingLevel, setReadingLevel] = useState<ReadingLevelId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useStopSpeechOnUnmount();

  const submit = async () => {
    if (!name.trim() || !username.trim() || !password || !readingLevel) {
      setError(t.auth.fillEverything);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signUp({ name, username, password, readingLevel });
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof AiApiError ? e.message : t.auth.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  /** Ditandai supaya layar ini tidak muncul lagi setiap kali aplikasi dibuka. */
  const skipForNow = () => {
    dismissAuthPrompt();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[...GRADIENTS.hero.colors]}
            locations={[...GRADIENTS.hero.locations]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: insets.top + 20, overflow: 'hidden' }}>
            <Blob size={110} opacity={0.06} style={{ position: 'absolute', top: -26, right: -10 }} />
            <Sparkle size={9} style={{ position: 'absolute', top: 36, right: 66 }} />

            <View className="items-center px-5 pb-7">
              <LexiMascot size={64} />
              <View className="mt-3 flex-row items-center" style={{ gap: 10 }}>
                <Text className="font-ui-bold text-[21px] text-white">{t.auth.registerTitle}</Text>
                <SpeakButton
                  text={`${t.auth.registerTitle}. ${t.auth.registerSubtitle}`}
                  speechKey="register:title"
                  onDark
                  size={16}
                />
              </View>
              <Text className="mt-1 text-center font-ui-medium text-[14px] text-white/60">
                {t.auth.registerSubtitle}
              </Text>
            </View>
          </LinearGradient>

          <View className="px-5 pt-5">
            {/* Bukan hiasan: pilihan kemampuan membaca di bawah menentukan
                ukuran huruf dan suara, dan yang paling tahu jawabannya adalah
                orang yang mendampingi. */}
            <View
              className="mb-5 flex-row items-center rounded-2xl border border-primary/20 bg-primary/[0.06] p-4"
              style={{ gap: 12 }}>
              <View className="h-11 w-11 items-center justify-center rounded-[16px] bg-primary/10">
                <Users size={20} color={colors.primary} />
              </View>
              <Text className="flex-1 font-ui-bold text-[14px] leading-5 text-text-main">
                {t.auth.companionBanner}
              </Text>
              <SpeakButton
                text={t.auth.companionBanner}
                speechKey="register:companion"
                size={16}
              />
            </View>

            <AuthField
              label={t.auth.nameLabel}
              placeholder={t.auth.namePlaceholder}
              speechKey="register:name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />

            <AuthField
              label={t.auth.usernameLabel}
              hint={t.auth.usernameHint}
              placeholder={t.auth.usernamePlaceholder}
              speechKey="register:username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              returnKeyType="next"
            />

            <AuthField
              label={t.auth.passwordLabel}
              placeholder={t.auth.passwordPlaceholder}
              speechKey="register:password"
              password
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              returnKeyType="done"
            />

            <View className="mb-2 mt-3 flex-row items-center" style={{ gap: 8 }}>
              <Text className="flex-1 font-ui-bold text-[15px] text-text-main">
                {t.auth.readingLevelLabel}
              </Text>
              <SpeakButton
                text={t.auth.readingLevelLabel}
                speechKey="register:reading-level"
                size={16}
              />
            </View>
            <Text className="mb-3 font-ui-medium text-[13px] text-text-muted">
              {t.auth.readingLevelHint}
            </Text>

            <ReadingLevelPicker value={readingLevel} onChange={setReadingLevel} />

            {error ? (
              <View className="mt-4 rounded-2xl bg-primary/[0.06] px-4 py-3">
                <Text className="font-ui-medium text-[14px] leading-6 text-text-main">{error}</Text>
              </View>
            ) : null}

            <PressableScale
              onPress={submit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={t.auth.registerAction}
              scaleTo={0.98}
              className="mt-5 overflow-hidden rounded-2xl">
              <LinearGradient
                colors={[...GRADIENTS.activePill.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 60, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="font-ui-bold text-[17px] text-white">
                  {loading ? t.auth.registerLoading : t.auth.registerAction}
                </Text>
              </LinearGradient>
            </PressableScale>

            <View className="mt-6 flex-row items-center justify-center" style={{ gap: 6 }}>
              <Text className="font-ui-medium text-[14px] text-text-muted">
                {t.auth.haveAccount}
              </Text>
              <PressableScale
                onPress={() => router.replace('/(auth)/login')}
                accessibilityRole="link"
                accessibilityLabel={t.auth.toLogin}
                className="h-11 justify-center px-1">
                <Text className="font-ui-bold text-[14px] text-primary">{t.auth.toLogin}</Text>
              </PressableScale>
            </View>

            <PressableScale
              onPress={skipForNow}
              accessibilityRole="button"
              accessibilityLabel={`${t.auth.skip}. ${t.auth.skipHint}`}
              scaleTo={0.98}
              className="mt-3 h-12 items-center justify-center rounded-2xl">
              <Text className="font-ui-bold text-[14px] text-text-muted">{t.auth.skip}</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
