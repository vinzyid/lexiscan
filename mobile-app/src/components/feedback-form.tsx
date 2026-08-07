import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Check, MessageCircle, Paperclip, ScanLine, Send } from 'lucide-react-native';

import { AiApiError } from '../api/ai';
import { MAX_MESSAGE_CHARS, sendFeedback, type FeedbackType } from '../api/feedback';
import { useT } from '../i18n';
import { useOCRStore } from '../store/useStore';
import { GRADIENTS } from '../theme/palettes';
import { useThemeColors } from '../theme/theme-provider';
import { PressableScale } from './pressable-scale';

/** Menyamai `min:3` di backend, supaya pesannya muncul sebelum jaringan dipakai. */
const MIN_MESSAGE_CHARS = 3;

type Status = 'idle' | 'sending' | 'sent';

/**
 * Formulir masukan pengguna dan laporan halaman yang gagal dipindai.
 *
 * Sengaja ditaruh utuh di layar Pengaturan, bukan di balik menu: yang paling
 * mungkin melapor adalah pengguna yang baru saja kecewa, dan menyuruhnya
 * mencari-cari dulu berarti laporannya tidak akan pernah sampai.
 */
export function FeedbackForm() {
  const t = useT();
  const colors = useThemeColors();
  const rawText = useOCRStore((s) => s.rawText);

  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [attachSample, setAttachSample] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const sending = status === 'sending';
  const canAttach = rawText.trim().length > 0;

  if (status === 'sent') {
    return (
      <View className="mt-4 items-center rounded-2xl border border-border/10 bg-surface p-5">
        <View
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
          <Check size={22} color="#10b981" strokeWidth={3} />
        </View>
        <Text className="mt-3 font-ui-bold text-[17px] text-text-main">{t.feedback.sentTitle}</Text>
        <Text className="mt-1 text-center font-ui-medium text-[13px] text-text-muted">
          {t.feedback.sentBody}
        </Text>

        <PressableScale
          onPress={() => {
            // Formulirnya dikosongkan supaya laporan berikutnya tidak berangkat
            // dengan isi yang sama tanpa disadari.
            setMessage('');
            setAttachSample(false);
            setStatus('idle');
          }}
          accessibilityRole="button"
          accessibilityLabel={t.feedback.sendAnother}
          scaleTo={0.98}
          className="mt-4 h-10 items-center justify-center rounded-xl bg-primary/10 px-4">
          <Text className="font-ui-bold text-[13px] text-primary">{t.feedback.sendAnother}</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View className="mt-4 rounded-2xl border border-border/10 bg-surface p-4">
      <Text className="font-ui-medium text-[13px] leading-[21px] text-text-muted">
        {t.feedback.intro}
      </Text>

      {/* Jenis laporan */}
      <View className="mt-3 flex-row" style={{ gap: 10 }}>
        <TypePill
          id="feedback"
          label={t.feedback.typeFeedback}
          icon={MessageCircle}
        />
        <TypePill
          id="ocr_failure"
          label={t.feedback.typeOcrFailure}
          icon={ScanLine}
        />
      </View>

      {/* Isi pesan */}
      <TextInput
        value={message}
        onChangeText={(next) => {
          setMessage(next);
          setError(null);
        }}
        editable={!sending}
        multiline
        textAlignVertical="top"
        maxLength={MAX_MESSAGE_CHARS}
        placeholder={
          type === 'ocr_failure'
            ? t.feedback.placeholderOcrFailure
            : t.feedback.placeholderFeedback
        }
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={t.feedback.title}
        className="mt-3 rounded-xl border border-border/10 p-3 font-ui text-[14px] text-text-main"
        style={{ minHeight: 104, backgroundColor: colors.surfaceAlt }}
      />

      <Text className="mt-1.5 text-right font-ui-medium text-[11px] text-text-muted">
        {t.feedback.charCount(message.length, MAX_MESSAGE_CHARS)}
      </Text>

      {/*
       * Lampiran hanya ditawarkan untuk laporan pindai gagal: untuk masukan
       * biasa, mengirim isi bacaan orang ke server tidak ada gunanya.
       */}
      {type === 'ocr_failure' ? (
        <PressableScale
          onPress={() => canAttach && setAttachSample((on) => !on)}
          disabled={!canAttach || sending}
          accessibilityRole="switch"
          accessibilityState={{ checked: attachSample, disabled: !canAttach }}
          accessibilityLabel={t.feedback.attachTitle}
          scaleTo={0.99}
          className="mt-2 flex-row items-center rounded-xl border border-border/10 p-3"
          style={{ gap: 10, opacity: canAttach ? 1 : 0.55 }}>
          <Paperclip size={16} color={colors.textMuted} />
          <View className="flex-1">
            <Text className="font-ui-bold text-[13px] text-text-main">
              {t.feedback.attachTitle}
            </Text>
            <Text className="mt-0.5 font-ui-medium text-[12px] leading-[18px] text-text-muted">
              {canAttach ? t.feedback.attachDesc : t.feedback.attachEmpty}
            </Text>
          </View>

          <View
            className="h-6 w-6 items-center justify-center rounded-full border"
            style={{
              borderColor: attachSample ? 'transparent' : colors.border,
              backgroundColor: attachSample ? colors.primary : 'transparent',
            }}>
            {attachSample ? <Check size={13} color="#ffffff" strokeWidth={3} /> : null}
          </View>
        </PressableScale>
      ) : null}

      {error ? (
        <View className="mt-3 flex-row rounded-xl p-3" style={{ gap: 8, backgroundColor: 'rgba(220,122,60,0.10)' }}>
          <AlertCircle size={15} color="#dc7a3c" />
          <Text className="flex-1 font-ui-medium text-[13px] leading-[20px]" style={{ color: '#dc7a3c' }}>
            {error}
          </Text>
        </View>
      ) : null}

      <PressableScale
        onPress={submit}
        disabled={sending}
        accessibilityRole="button"
        accessibilityLabel={t.feedback.submitLabel}
        accessibilityState={{ disabled: sending }}
        scaleTo={0.98}
        className="mt-3 overflow-hidden rounded-xl">
        <LinearGradient
          colors={[...GRADIENTS.activePill.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 46,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: sending ? 0.7 : 1,
          }}>
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Send size={15} color="#ffffff" />
          )}
          <Text className="font-ui-bold text-[14px] text-white">
            {sending ? t.feedback.sending : t.feedback.submit}
          </Text>
        </LinearGradient>
      </PressableScale>

      <Text className="mt-2.5 text-center font-ui-medium text-[11px] leading-[17px] text-text-muted">
        {t.feedback.privacyNote}
      </Text>
    </View>
  );

  async function submit() {
    if (sending) {
      return;
    }

    if (message.trim().length < MIN_MESSAGE_CHARS) {
      setError(t.feedback.tooShort);

      return;
    }

    setError(null);
    setStatus('sending');

    try {
      await sendFeedback({
        type,
        message,
        sample: type === 'ocr_failure' && attachSample ? rawText : undefined,
      });
      setStatus('sent');
    } catch (err) {
      // AiApiError sudah membawa pesan siap tampil dari backend; sisanya berarti
      // kesalahan di aplikasi ini sendiri dan tidak layak ditunjukkan mentah.
      setError(err instanceof AiApiError ? err.message : t.feedback.unexpectedError);
      setStatus('idle');
    }
  }

  /** Tombol pemilih jenis laporan. */
  function TypePill({
    id,
    label,
    icon: Icon,
  }: {
    id: FeedbackType;
    label: string;
    icon: typeof MessageCircle;
  }) {
    const selected = id === type;

    return (
      <PressableScale
        onPress={() => {
          setType(id);
          setError(null);
        }}
        disabled={sending}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        scaleTo={0.97}
        wrapperStyle={{ flex: 1 }}
        className={`h-11 flex-1 flex-row items-center justify-center rounded-xl border ${
          selected ? 'border-primary/30 bg-primary/[0.08]' : 'border-border/10'
        }`}
        style={{ gap: 7, backgroundColor: selected ? undefined : colors.surfaceAlt }}>
        <Icon size={15} color={selected ? colors.primary : colors.textMuted} />
        <Text
          className={`font-ui-bold text-[13px] ${selected ? 'text-primary' : 'text-text-main'}`}>
          {label}
        </Text>
      </PressableScale>
    );
  }
}
