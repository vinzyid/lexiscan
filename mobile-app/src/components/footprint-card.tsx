import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Leaf, RotateCcw, Zap } from 'lucide-react-native';

import { useLocale, useT } from '../i18n';
import { useOCRStore } from '../store/useStore';
import { useThemeColors } from '../theme/theme-provider';
import { batteryPercent, formatEnergy, formatMass } from '../utils/footprint-format';
import { PressableScale } from './pressable-scale';

/**
 * Ringkasan dampak lingkungan pemakaian AI di perangkat ini.
 *
 * Dua angka besarnya sengaja disandingkan: yang terpakai dan yang dihindari.
 * Menampilkan konsumsi saja hanya melaporkan masalah; menyandingkannya dengan
 * penghematan menunjukkan bahwa simpanan jawaban di backend memang bekerja —
 * dan itu keputusan desain, bukan kebetulan.
 */
export function FootprintCard() {
  const t = useT();
  const locale = useLocale();
  const colors = useThemeColors();
  const totals = useOCRStore((s) => s.footprintTotals);
  const reset = useOCRStore((s) => s.resetFootprintTotals);

  if (totals.requests === 0) {
    return (
      <View className="mt-4 rounded-2xl border border-border/10 bg-surface p-4">
        <Text className="font-ui-medium text-[13px] leading-[21px] text-text-muted">
          {t.footprint.empty}
        </Text>
      </View>
    );
  }

  const cachedPercent = Math.round((totals.cachedRequests / totals.requests) * 100);

  return (
    <View className="mt-4 rounded-2xl border border-border/10 bg-surface p-4">
      <View className="flex-row" style={{ gap: 10 }}>
        <BigMetric
          icon={<Leaf size={14} color="#dc7a3c" />}
          label={t.footprint.spentLabel}
          value={formatMass(totals.co2eG, locale)}
          tone="#dc7a3c"
        />
        <BigMetric
          icon={<Leaf size={14} color="#10b981" />}
          label={t.footprint.avoidedLabel}
          value={formatMass(totals.avoidedCo2eG, locale)}
          tone="#10b981"
        />
      </View>

      <View className="mt-3 flex-row" style={{ gap: 10 }}>
        <SmallMetric label={t.footprint.requestsLabel} value={String(totals.requests)} />
        <SmallMetric
          label={t.footprint.energyLabel}
          value={formatEnergy(totals.energyWh, locale)}
        />
      </View>

      {totals.cachedRequests > 0 ? (
        <Text className="mt-3 font-ui-medium text-[13px] leading-[21px] text-text-muted">
          {t.footprint.cachedShare(totals.cachedRequests, totals.requests, cachedPercent)}
        </Text>
      ) : null}

      {totals.energyWh > 0 ? (
        <View className="mt-2 flex-row items-center" style={{ gap: 6 }}>
          <Zap size={13} color={colors.textMuted} />
          <Text className="flex-1 font-ui-medium text-[13px] text-text-muted">
            {t.footprint.equivalent(batteryPercent(totals.energyWh, locale))}
          </Text>
        </View>
      ) : null}

      {/* Kejujuran metodologi ditaruh di kartunya sendiri, bukan disembunyikan
          di halaman lain: angkanya taksiran dan pembacanya berhak tahu. */}
      <Text className="mt-3 border-t border-border/10 pt-3 font-ui-medium text-[11px] leading-[18px] text-text-muted">
        {t.footprint.methodNote}
      </Text>

      <PressableScale
        onPress={reset}
        accessibilityRole="button"
        accessibilityLabel={t.footprint.resetLabel}
        scaleTo={0.98}
        className="mt-3 h-10 flex-row items-center justify-center rounded-xl bg-primary/10"
        style={{ gap: 6 }}>
        <RotateCcw size={13} color={colors.primary} />
        <Text className="font-ui-bold text-[13px] text-primary">{t.footprint.resetLabel}</Text>
      </PressableScale>
    </View>
  );

  /** Angka utama: emisi terpakai vs dihindari. */
  function BigMetric({
    icon,
    label,
    value,
    tone,
  }: {
    icon: ReactNode;
    label: string;
    value: string;
    tone: string;
  }) {
    return (
      <View
        className="flex-1 rounded-xl p-3"
        style={{ backgroundColor: colors.surfaceAlt }}>
        <View className="flex-row items-center" style={{ gap: 5 }}>
          {icon}
          <Text className="font-ui-medium text-[11px] text-text-muted">{label}</Text>
        </View>
        <Text className="mt-1 font-ui-bold text-[19px]" style={{ color: tone }}>
          {value}
        </Text>
      </View>
    );
  }

  /** Angka pendukung: jumlah permintaan dan energi. */
  function SmallMetric({ label, value }: { label: string; value: string }) {
    return (
      <View className="flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: colors.surfaceAlt }}>
        <Text className="font-ui-medium text-[11px] text-text-muted">{label}</Text>
        <Text className="mt-0.5 font-ui-bold text-[15px] text-text-main">{value}</Text>
      </View>
    );
  }
}
