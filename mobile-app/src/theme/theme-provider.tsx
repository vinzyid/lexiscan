import { View } from 'react-native';
import { vars } from 'nativewind';
import type { ReactNode } from 'react';

import { getTheme, type ThemeDef } from './palettes';
import { useOCRStore } from '../store/useStore';

const toVars = (theme: ThemeDef) =>
  vars({
    '--color-background': theme.tokens.background,
    '--color-surface': theme.tokens.surface,
    '--color-surface-alt': theme.tokens.surfaceAlt,
    '--color-text-main': theme.tokens.textMain,
    '--color-text-muted': theme.tokens.textMuted,
    '--color-border': theme.tokens.border,
    '--color-primary': theme.tokens.primary,
    '--color-primary-deep': theme.tokens.primaryDeep,
    '--color-primary-soft': theme.tokens.primarySoft,
    '--color-highlight': theme.tokens.highlight,
    '--color-warm': theme.tokens.warm,
    '--color-success': theme.tokens.success,
    '--color-bicolor-a': theme.tokens.bicolorA,
    '--color-bicolor-b': theme.tokens.bicolorB,
  });

/**
 * Menyuntikkan token palet aktif sebagai CSS variable ke seluruh subtree,
 * sehingga class seperti `bg-surface` ikut berubah saat tema diganti.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeId = useOCRStore((s) => s.themeId);
  const theme = getTheme(themeId);

  return (
    <View style={[{ flex: 1 }, toVars(theme)]} className="bg-background">
      {children}
    </View>
  );
}

/** Warna mentah untuk prop yang tidak menerima className (ikon lucide, dll). */
export function useThemeColors() {
  const themeId = useOCRStore((s) => s.themeId);
  const theme = getTheme(themeId);
  const rgb = (channels: string) => `rgb(${channels.split(' ').join(', ')})`;
  const rgba = (channels: string, alpha: number) =>
    `rgba(${channels.split(' ').join(', ')}, ${alpha})`;

  return {
    isDark: theme.isDark,
    id: theme.id,
    name: theme.name,
    background: rgb(theme.tokens.background),
    surface: rgb(theme.tokens.surface),
    surfaceAlt: rgb(theme.tokens.surfaceAlt),
    textMain: rgb(theme.tokens.textMain),
    textMuted: rgb(theme.tokens.textMuted),
    /** Figma memakai textMain @ 8% untuk semua garis pemisah. */
    border: rgba(theme.tokens.border, 0.08),
    primary: rgb(theme.tokens.primary),
    primaryDeep: rgb(theme.tokens.primaryDeep),
    primarySoft: rgb(theme.tokens.primarySoft),
    highlight: rgb(theme.tokens.highlight),
    warm: rgb(theme.tokens.warm),
    success: rgb(theme.tokens.success),
    bicolorA: rgb(theme.tokens.bicolorA),
    bicolorB: rgb(theme.tokens.bicolorB),
  };
}
