import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Pencil, ScanLine, Trash2 } from 'lucide-react-native';

import { useOCRStore, type SavedDocument } from '../../src/store/useStore';
import { useThemeColors } from '../../src/theme/theme-provider';
import { GRADIENTS } from '../../src/theme/palettes';
import { useT } from '../../src/i18n';
import { PressableScale } from '../../src/components/pressable-scale';
import { Blob, HexDecor, Ring, ScreenBackdrop, Sparkle } from '../../src/components/figma-decor';
import { IlluScan } from '../../src/components/illustrations';

/** Warna header layar dokumen — disamakan dengan header Pindai. */
const DOCS_HEADER = ['#3b0764', '#4c1d95', '#1e3a8a'] as const;

/**
 * Riwayat dokumen hasil pindaian.
 *
 * Inilah jawaban dari keluhan "dokumen setelah discan tidak tersimpan": dulu
 * teks scan hanya hidup selama aplikasi terbuka, jadi begitu ditutup tidak ada
 * cara untuk mengeceknya lagi. Sekarang tiap pindaian disimpan ke perangkat
 * (lihat `savedDocuments` di store) dan daftarnya tampil di sini.
 */
export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const t = useT();

  const savedDocuments = useOCRStore((s) => s.savedDocuments);
  const setRawText = useOCRStore((s) => s.setRawText);
  const renameDocument = useOCRStore((s) => s.renameDocument);
  const removeDocument = useOCRStore((s) => s.removeDocument);

  /*
   * Riwayat lama yang tersimpan sebelum fitur ini ada tidak punya field ini di
   * AsyncStorage; jaga-jaga kalau hasil rehidrasi bukan array (mis. data korup),
   * agar `.map` di bawah tidak menjatuhkan layar.
   */
  const documents = Array.isArray(savedDocuments) ? savedDocuments : [];

  /** Dokumen yang sedang diubah namanya; null berarti tidak ada dialog. */
  const [renaming, setRenaming] = useState<SavedDocument | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const openDocument = (doc: SavedDocument) => {
    setRawText(doc.text);
    router.push('/reader');
  };

  const startRename = (doc: SavedDocument) => {
    setDraftTitle(doc.title);
    setRenaming(doc);
  };

  const confirmRename = () => {
    if (renaming) renameDocument(renaming.id, draftTitle);
    setRenaming(null);
  };

  const confirmDelete = (doc: SavedDocument) => {
    Alert.alert(t.documents.deleteTitle, t.documents.deleteMessage(doc.title), [
      { text: t.documents.cancel, style: 'cancel' },
      { text: t.documents.delete, style: 'destructive', onPress: () => removeDocument(doc.id) },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[...DOCS_HEADER]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 8, overflow: 'hidden' }}>
          <Blob size={100} opacity={0.06} style={{ position: 'absolute', top: -26, right: 10 }} />
          <Ring size={80} style={{ position: 'absolute', top: 20, right: -14 }} />
          <HexDecor size={22} style={{ position: 'absolute', bottom: 26, right: 120 }} />
          <View style={{ position: 'absolute', right: 22, bottom: 18, opacity: 0.9 }}>
            <IlluScan size={80} />
          </View>
          <Sparkle size={10} style={{ position: 'absolute', top: 24, right: 92 }} />
          <Sparkle size={5} style={{ position: 'absolute', bottom: 30, right: 40 }} />

          <View className="px-5 pb-6 pt-5">
            <View className="flex-row">
              <View
                className="flex-row items-center rounded-[14px] border border-white/[0.18] bg-white/[0.12] px-3 py-1.5"
                style={{ gap: 8 }}>
                <FileText size={13} color="#ffffff" />
                <Text className="font-ui-bold text-[14px] text-white/85">
                  {t.documents.title}
                </Text>
              </View>
            </View>
            <Text className="mt-3 font-ui-bold text-2xl text-white">{t.documents.title}</Text>
            <Text className="mt-1 font-ui-medium text-sm text-white/60">
              {t.documents.subtitle}
            </Text>
          </View>
        </LinearGradient>

        <View className="px-4 pt-5" style={{ gap: 12 }}>
          {documents.length === 0 ? (
            <EmptyState onScan={() => router.push('/scanner')} />
          ) : (
            documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onOpen={() => openDocument(doc)}
                onRename={() => startRename(doc)}
                onDelete={() => confirmDelete(doc)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Dialog ubah nama ──────────────────────────────────────────── */}
      <Modal
        visible={renaming !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenaming(null)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-8"
          onPress={() => setRenaming(null)}>
          {/* Pressable dalam supaya ketukan di kartu tidak ikut menutup dialog. */}
          <Pressable
            className="w-full rounded-3xl bg-surface p-5"
            onPress={(event) => event.stopPropagation()}>
            <Text className="font-ui-bold text-lg text-text-main">{t.documents.renameTitle}</Text>
            <TextInput
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder={t.documents.renameLabel}
              placeholderTextColor={colors.textMuted}
              autoFocus
              selectTextOnFocus
              className="mt-4 rounded-2xl bg-background px-4 py-3 font-ui text-text-main"
              style={{ borderWidth: 1, borderColor: colors.border }}
            />
            <View className="mt-4 flex-row" style={{ gap: 10 }}>
              <PressableScale
                onPress={() => setRenaming(null)}
                accessibilityRole="button"
                accessibilityLabel={t.documents.cancel}
                wrapperStyle={{ flex: 1 }}
                className="items-center justify-center rounded-2xl bg-primary/[0.08] py-3">
                <Text className="font-ui-bold text-sm text-primary">{t.documents.cancel}</Text>
              </PressableScale>
              <PressableScale
                onPress={confirmRename}
                accessibilityRole="button"
                accessibilityLabel={t.documents.rename}
                wrapperStyle={{ flex: 1 }}
                scaleTo={0.97}>
                <LinearGradient
                  colors={[...GRADIENTS.activePill.colors]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16 }}>
                  <Text className="font-ui-bold text-sm text-white">{t.documents.rename}</Text>
                </LinearGradient>
              </PressableScale>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Kartu satu dokumen tersimpan. Ditekan untuk dibuka kembali di layar Baca. */
function DocumentCard({
  doc,
  onOpen,
  onRename,
  onDelete,
}: {
  doc: SavedDocument;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const colors = useThemeColors();
  const t = useT();

  const wordCount = doc.text.split(/\s+/).filter((word) => word.length > 0).length;

  return (
    <PressableScale
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={t.documents.openLabel(doc.title)}
      scaleTo={0.98}>
      <View
        className="rounded-2xl bg-surface p-4"
        style={{ borderWidth: 1, borderColor: colors.border }}>
        <View className="flex-row items-start" style={{ gap: 12 }}>
          <LinearGradient
            colors={[...GRADIENTS.activePill.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <FileText size={20} color="#ffffff" />
          </LinearGradient>

          <View className="flex-1">
            <Text className="font-ui-bold text-[16px] leading-5 text-text-main" numberOfLines={2}>
              {doc.title}
            </Text>
            <Text className="mt-1 font-ui-medium text-xs text-text-muted">
              {t.documents.wordCount(wordCount)} · {t.documents.savedAt(formatSavedAt(doc.savedAt, t))}
            </Text>
          </View>
        </View>

        <Text
          className="mt-3 font-read text-text-muted"
          numberOfLines={2}
          style={{ fontSize: 13, lineHeight: 19 }}>
          {doc.text}
        </Text>

        <View
          className="mt-3 flex-row border-t pt-3"
          style={{ gap: 8, borderTopColor: colors.border }}>
          <SmallAction
            icon={<Pencil size={14} color={colors.primary} />}
            label={t.documents.rename}
            color={colors.primary}
            tint="rgba(124,58,237,0.08)"
            onPress={onRename}
          />
          <SmallAction
            icon={<Trash2 size={14} color="#dc2626" />}
            label={t.documents.delete}
            color="#dc2626"
            tint="rgba(220,38,38,0.08)"
            onPress={onDelete}
          />
        </View>
      </View>
    </PressableScale>
  );
}

function SmallAction({
  icon,
  label,
  color,
  tint,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      scaleTo={0.95}
      className="h-9 flex-row items-center rounded-[12px] px-3"
      style={{ gap: 6, backgroundColor: tint }}>
      {icon}
      <Text className="font-ui-bold text-xs" style={{ color }}>
        {label}
      </Text>
    </PressableScale>
  );
}

function EmptyState({ onScan }: { onScan: () => void }) {
  const t = useT();
  const colors = useThemeColors();

  return (
    <View className="items-center rounded-3xl bg-surface px-6 py-10" style={{ borderWidth: 1, borderColor: colors.border }}>
      <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <ScanLine size={34} color={colors.primary} />
      </View>
      <Text className="mt-4 font-ui-bold text-base text-text-main">{t.documents.emptyTitle}</Text>
      <Text className="mt-1.5 text-center font-ui-medium text-[14px] leading-5 text-text-muted">
        {t.documents.emptyDesc}
      </Text>
      <PressableScale
        onPress={onScan}
        accessibilityRole="button"
        accessibilityLabel={t.documents.emptyButton}
        scaleTo={0.97}
        className="mt-5">
        <LinearGradient
          colors={[...GRADIENTS.activePill.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 16,
          }}>
          <ScanLine size={18} color="#ffffff" />
          <Text className="font-ui-bold text-sm text-white">{t.documents.emptyButton}</Text>
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

/**
 * Tanggal simpan dalam bentuk yang ramah dibaca: "hari ini"/"kemarin" untuk
 * dua hari terakhir, sisanya tanggal singkat. Dokumen paling sering baru saja
 * dipindai, jadi bagian itu yang paling berguna ditampilkan jelas.
 */
function formatSavedAt(savedAt: number, t: ReturnType<typeof useT>): string {
  const now = new Date();
  const saved = new Date(savedAt);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfSaved = new Date(saved.getFullYear(), saved.getMonth(), saved.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfSaved) / 86_400_000);

  if (dayDiff === 0) return t.documents.today;
  if (dayDiff === 1) return t.documents.yesterday;

  return saved.toLocaleDateString(t.locale, { day: 'numeric', month: 'short', year: 'numeric' });
}
