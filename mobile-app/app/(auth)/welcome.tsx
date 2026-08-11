import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';

import { AiApiError } from '../../src/api/ai';
import { AuthField } from '../../src/components/auth-field';
import { Blob, Sparkle } from '../../src/components/figma-decor';
import { LexiMascot } from '../../src/components/illustrations';
import { PressableScale } from '../../src/components/pressable-scale';
import { ReadingChoicePicker } from '../../src/components/reading-choice-picker';
import { SchoolLevelPicker } from '../../src/components/school-level-picker';
import { SpeakButton } from '../../src/components/speak-button';
import { useT } from '../../src/i18n';
import { useStopSpeechOnUnmount } from '../../src/speech/use-speech';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useOCRStore } from '../../src/store/useStore';
import { GRADIENTS } from '../../src/theme/palettes';
import type { ReadingLevelId } from '../../src/theme/reading-levels';
import type { SchoolLevelId } from '../../src/theme/school-levels';

/**
 * Pendaftaran & masuk — satu layar, tiga langkah (Figma: frame "AuthScreen").
 *
 * KENAPA MENGGANTIKAN DUA LAYAR TERPISAH. Versi sebelumnya memakai layar Masuk
 * dan layar Daftar yang saling bertaut lewat tautan teks di bagian bawah;
 * seluruh pertanyaan pendaftaran menumpuk di satu halaman panjang. Yang paling
 * mungkin tersesat di sana justru penggunanya: nama, nama pengguna, kata sandi,
 * jenjang, dan kemampuan membaca tampil sekaligus, padahal tiga yang terakhir
 * adalah pertanyaan tentang dirinya, bukan isian formulir.
 *
 * Bentuk barunya memecahnya jadi satu pertanyaan per layar — dan menaruh
 * pilihan "Pengguna Baru / Sudah Punya Akun" di langkah pertama, sehingga yang
 * sudah punya akun berhenti di situ dan tidak pernah melihat dua langkah
 * sisanya.
 */

type Mode = 'new' | 'existing';

/** Jumlah langkah untuk pengguna baru; dipakai juga di label "LANGKAH x / 3". */
const TOTAL_STEPS = 3;

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const dismissAuthPrompt = useOCRStore((s) => s.dismissAuthPrompt);

  const [mode, setMode] = useState<Mode>('new');
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevelId | null>(null);
  const [readingLevel, setReadingLevel] = useState<ReadingLevelId | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useStopSpeechOnUnmount();

  const switchMode = (next: Mode) => {
    setMode(next);
    // Kembali ke langkah pertama, kalau tidak orang yang menekan "Sudah Punya
    // Akun" di langkah 3 akan melihat formulir masuk dengan titik langkah
    // ketiga menyala.
    setStep(0);
    setError(null);
  };

  const goBack = () => {
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  };

  const goNext = () => {
    setError(null);

    if (step === 0) {
      if (!name.trim() || !username.trim() || !password) {
        setError(t.auth.fillEverything);

        return;
      }

      setStep(1);

      return;
    }

    if (step === 1) {
      if (schoolLevel === null) {
        setError(t.auth.needSchool);

        return;
      }

      setStep(2);
    }
  };

  const submitRegister = async () => {
    if (readingLevel === null) {
      setError(t.auth.needReading);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signUp({ name, username, password, readingLevel, schoolLevel });
      // replace, bukan push: layar ini tidak boleh bisa dikunjungi lagi dengan
      // tombol kembali setelah akunnya jadi.
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof AiApiError ? e.message : t.auth.unexpectedError);

      /*
       * Dikembalikan ke langkah pertama HANYA untuk galat yang isiannya ada di
       * sana — nama pengguna terpakai, misalnya. Tanpa ini pesannya muncul di
       * langkah 3, di layar yang tidak punya satu pun kolom untuk memperbaikinya.
       */
      if (e instanceof AiApiError && /pengguna|username/i.test(e.message)) {
        setStep(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitLogin = async () => {
    if (!username.trim() || !password) {
      setError(t.auth.fillEverything);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(username, password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof AiApiError ? e.message : t.auth.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  /** Melewati pendaftaran; ditandai supaya layar ini tidak muncul lagi. */
  const skipForNow = () => {
    dismissAuthPrompt();
    router.replace('/(tabs)');
  };

  const stepName = [t.auth.stepHalo, t.auth.stepJenjang, t.auth.stepMembaca][step];

  const heading =
    mode === 'existing'
      ? { title: t.auth.welcomeBackTitle, subtitle: t.auth.welcomeBackSubtitle }
      : [
          { title: t.auth.askNameTitle, subtitle: t.auth.askNameSubtitle },
          { title: t.auth.askSchoolTitle, subtitle: t.auth.askSchoolSubtitle },
          { title: t.auth.askReadingTitle, subtitle: t.auth.askReadingSubtitle },
        ][step];

  const primaryLabel =
    mode === 'existing'
      ? loading
        ? t.auth.loginLoading
        : t.auth.loginAction
      : step === 2
        ? loading
          ? t.auth.registerLoading
          : t.auth.finish
        : t.auth.next;

  const onPrimary = () => {
    if (mode === 'existing') {
      void submitLogin();

      return;
    }

    if (step === 2) {
      void submitRegister();

      return;
    }

    goNext();
  };

  return (
    <View className="flex-1">
      {/* Gradien menutup seluruh layar, bukan hanya kepalanya: kartu putih di
          bawah tidak setinggi layar pada perangkat yang lebih panjang, dan sisa
          ruang di bawahnya harus tetap ungu, bukan warna latar tema. */}
      <LinearGradient
        colors={[...GRADIENTS.authHero.colors]}
        locations={[...GRADIENTS.authHero.locations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Blob size={180} opacity={0.07} style={{ position: 'absolute', top: -50, right: -50 }} />
      <Sparkle size={8} style={{ position: 'absolute', top: 177, left: 63 }} />
      <Sparkle size={6} style={{ position: 'absolute', top: 265, right: 55 }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── Kepala ────────────────────────────────────────────────────── */}
        <View className="items-center px-6 pb-6" style={{ paddingTop: insets.top + 24 }}>
          <LexiMascot size={100} />

          <View className="mt-2.5 flex-row items-center" style={{ gap: 10 }}>
            <Text className="font-ui-bold text-[32px] text-white" style={{ letterSpacing: -0.32 }}>
              LexiScan
            </Text>
            <SpeakButton
              text={`${heading.title}. ${heading.subtitle}`}
              speechKey={`auth:${mode}:${step}`}
              onDark
              size={16}
            />
          </View>

          <Text className="mt-1 font-ui text-[13px] text-white/55">{t.auth.appTagline}</Text>

          {/*
            Titik langkah hanya untuk pengguna baru. Yang sudah punya akun cuma
            melewati satu layar, dan memperlihatkan "LANGKAH 1 / 3" kepadanya
            menjanjikan dua langkah yang tidak akan pernah datang.
          */}
          {mode === 'new' ? (
            <>
              <View className="mt-6 flex-row items-center" style={{ gap: 8 }}>
                {/* Tiga keadaan, bukan dua: yang sudah dilewati lebih terang
                    daripada yang belum, supaya kemajuannya terlihat. */}
                {[0, 1, 2].map((index) => (
                  <View
                    key={index}
                    className={
                      index === step
                        ? 'h-2 w-7 rounded bg-white'
                        : index < step
                          ? 'h-2 w-2 rounded bg-white/50'
                          : 'h-2 w-2 rounded bg-white/20'
                    }
                  />
                ))}
              </View>

              <Text
                className="mt-1.5 font-ui-semibold text-[11px] text-white/40"
                style={{ letterSpacing: 0.77 }}>
                {t.auth.stepLabel(step + 1, TOTAL_STEPS, stepName)}
              </Text>
            </>
          ) : null}
        </View>

        {/* ── Kartu ─────────────────────────────────────────────────────── */}
        <View
          className="flex-1 bg-surface px-5"
          style={{
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            shadowColor: '#000000',
            shadowOpacity: 0.2,
            shadowRadius: 40,
            shadowOffset: { width: 0, height: -10 },
            elevation: 24,
          }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}>
            {/* Pemilih mode hanya di langkah pertama — sesudah itu pengguna
                sudah jelas sedang mendaftar. */}
            {step === 0 ? (
              <View
                className="mt-6 flex-row rounded-2xl bg-surface-alt p-1"
                style={{ gap: 4 }}
                accessibilityRole="tablist">
                {(['new', 'existing'] as const).map((id) => {
                  const active = mode === id;
                  const label = id === 'new' ? t.auth.tabNew : t.auth.tabExisting;

                  return (
                    <PressableScale
                      key={id}
                      onPress={() => switchMode(id)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={label}
                      scaleTo={0.98}
                      wrapperStyle={{ flex: 1 }}
                      className="overflow-hidden rounded-[14px]">
                      {active ? (
                        <LinearGradient
                          colors={[...GRADIENTS.activePill.colors]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ height: 39, alignItems: 'center', justifyContent: 'center' }}>
                          <Text className="font-ui-bold text-[12.5px] text-white">{label}</Text>
                        </LinearGradient>
                      ) : (
                        <View className="h-[39px] items-center justify-center">
                          <Text className="font-ui-bold text-[12.5px] text-text-muted">{label}</Text>
                        </View>
                      )}
                    </PressableScale>
                  );
                })}
              </View>
            ) : null}

            <Text className={`font-ui-bold text-[20px] leading-[30px] text-text-main ${
              step === 0 ? 'mt-5' : 'mt-6'
            }`}>
              {heading.title}
            </Text>
            <Text className="mb-5 mt-1.5 font-ui text-[13px] text-text-muted">
              {heading.subtitle}
            </Text>

            {/* ── Langkah 1 ───────────────────────────────────────────── */}
            {step === 0 ? (
              <>
                {/*
                  Nama lengkap hanya ditanyakan ke pengguna baru. Untuk yang
                  sudah punya akun, nama sudah tersimpan di server — menanyakannya
                  lagi hanya menambah satu kolom yang bisa salah ketik.
                */}
                {mode === 'new' ? (
                  <AuthField
                    label={t.auth.nameLabel}
                    placeholder={t.auth.namePlaceholderLong}
                    speechKey="auth:name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                    returnKeyType="next"
                  />
                ) : null}

                <AuthField
                  label={t.auth.usernameLabel}
                  hint={mode === 'new' ? t.auth.usernameHint : undefined}
                  placeholder={t.auth.usernamePlaceholder}
                  speechKey="auth:username"
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
                  speechKey="auth:password"
                  password
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={mode === 'new' ? 'new-password' : 'current-password'}
                  returnKeyType="go"
                  onSubmitEditing={onPrimary}
                />
              </>
            ) : null}

            {/* ── Langkah 2 ───────────────────────────────────────────── */}
            {step === 1 ? (
              <SchoolLevelPicker value={schoolLevel} onChange={setSchoolLevel} />
            ) : null}

            {/* ── Langkah 3 ───────────────────────────────────────────── */}
            {step === 2 ? (
              <ReadingChoicePicker value={readingLevel} onChange={setReadingLevel} />
            ) : null}

            {error ? (
              <View className="mt-4 rounded-2xl bg-primary/[0.06] px-4 py-3">
                <Text className="font-ui-medium text-[14px] leading-6 text-text-main">{error}</Text>
              </View>
            ) : null}

            {/*
             * Melewati pendaftaran harus selalu mungkin, dan hanya ditawarkan di
             * langkah pertama. Fitur bacanya tetap jalan tanpa akun; yang hilang
             * cuma penyesuaian otomatis, dan memaksa orang membuat akun sebelum
             * sempat melihat gunanya justru menghalangi orang yang paling
             * membutuhkannya.
             */}
            {step === 0 ? (
              <PressableScale
                onPress={skipForNow}
                accessibilityRole="button"
                accessibilityLabel={`${t.auth.skip}. ${t.auth.skipHint}`}
                scaleTo={0.98}
                className="mt-4 h-12 items-center justify-center rounded-2xl">
                <Text className="font-ui-bold text-[14px] text-text-muted">{t.auth.skip}</Text>
              </PressableScale>
            ) : null}
          </ScrollView>

          {/* ── Tombol bawah ──────────────────────────────────────────── */}
          <View
            className="flex-row items-center pt-5"
            style={{ gap: 12, paddingBottom: Math.max(insets.bottom, 20) }}>
            {mode === 'new' && step > 0 ? (
              <PressableScale
                onPress={goBack}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={t.auth.back}
                scaleTo={0.95}
                className="h-14 w-12 items-center justify-center rounded-2xl bg-surface-alt">
                <ArrowLeft size={20} color="#6b7280" />
              </PressableScale>
            ) : null}

            <PressableScale
              onPress={onPrimary}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={primaryLabel}
              scaleTo={0.98}
              wrapperStyle={{ flex: 1 }}
              className="overflow-hidden rounded-2xl">
              <LinearGradient
                colors={[...GRADIENTS.activePill.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 56,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                <Text className="font-ui-bold text-[17px] text-white">{primaryLabel}</Text>
                {!loading ? <ArrowRight size={18} color="#ffffff" strokeWidth={3} /> : null}
              </LinearGradient>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
