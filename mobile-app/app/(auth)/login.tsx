import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { AiApiError } from '../../src/api/ai';
import { AuthField } from '../../src/components/auth-field';
import { Blob, ScreenBackdrop, Sparkle } from '../../src/components/figma-decor';
import { LexiMascot } from '../../src/components/illustrations';
import { PressableScale } from '../../src/components/pressable-scale';
import { SpeakButton } from '../../src/components/speak-button';
import { useT } from '../../src/i18n';
import { useStopSpeechOnUnmount } from '../../src/speech/use-speech';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useOCRStore } from '../../src/store/useStore';
import { GRADIENTS } from '../../src/theme/palettes';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const signIn = useAuthStore((s) => s.signIn);
  const dismissAuthPrompt = useOCRStore((s) => s.dismissAuthPrompt);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useStopSpeechOnUnmount();

  const submit = async () => {
    if (!username.trim() || !password) {
      setError(t.auth.fillEverything);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(username, password);
      // replace, bukan push: layar masuk tidak boleh bisa dikunjungi lagi
      // dengan tombol kembali setelah berhasil.
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
            style={{ paddingTop: insets.top + 24, overflow: 'hidden' }}>
            <Blob size={110} opacity={0.06} style={{ position: 'absolute', top: -26, right: -10 }} />
            <Sparkle size={9} style={{ position: 'absolute', top: 40, right: 70 }} />
            <Sparkle size={6} style={{ position: 'absolute', bottom: 30, left: 40 }} />

            <View className="items-center px-5 pb-8">
              <LexiMascot size={72} />
              <View className="mt-3 flex-row items-center" style={{ gap: 10 }}>
                <Text className="font-ui-bold text-[22px] text-white">{t.auth.loginTitle}</Text>
                <SpeakButton
                  text={`${t.auth.loginTitle}. ${t.auth.loginSubtitle}`}
                  speechKey="login:title"
                  onDark
                  size={16}
                />
              </View>
              <Text className="mt-1 font-ui-medium text-[14px] text-white/60">
                {t.auth.loginSubtitle}
              </Text>
            </View>
          </LinearGradient>

          <View className="px-5 pt-6">
            <AuthField
              label={t.auth.usernameLabel}
              placeholder={t.auth.usernamePlaceholder}
              speechKey="login:username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
            />

            <AuthField
              label={t.auth.passwordLabel}
              placeholder={t.auth.passwordPlaceholder}
              speechKey="login:password"
              password
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            {error ? (
              <View className="mb-4 rounded-2xl bg-primary/[0.06] px-4 py-3">
                <Text className="font-ui-medium text-[14px] leading-6 text-text-main">{error}</Text>
              </View>
            ) : null}

            <PressableScale
              onPress={submit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={t.auth.loginAction}
              scaleTo={0.98}
              className="overflow-hidden rounded-2xl">
              <LinearGradient
                colors={[...GRADIENTS.activePill.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 60, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="font-ui-bold text-[17px] text-white">
                  {loading ? t.auth.loginLoading : t.auth.loginAction}
                </Text>
              </LinearGradient>
            </PressableScale>

            <View className="mt-6 flex-row items-center justify-center" style={{ gap: 6 }}>
              <Text className="font-ui-medium text-[14px] text-text-muted">{t.auth.noAccount}</Text>
              <PressableScale
                onPress={() => router.replace('/(auth)/register')}
                accessibilityRole="link"
                accessibilityLabel={t.auth.toRegister}
                className="h-11 justify-center px-1">
                <Text className="font-ui-bold text-[14px] text-primary">{t.auth.toRegister}</Text>
              </PressableScale>
            </View>

            {/*
             * Melewati pendaftaran harus selalu mungkin. Fitur bacanya tetap
             * jalan tanpa akun; yang hilang hanya penyesuaian otomatis, dan
             * memaksa orang membuat akun sebelum sempat melihat gunanya justru
             * menghalangi orang yang paling membutuhkannya.
             */}
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
