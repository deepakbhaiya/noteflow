/**
 * NoteFlow design system.
 * A single source of truth for color, spacing, radius, typography and elevation.
 */

export type ThemeMode = 'light' | 'dark';

export interface Palette {
  /** App background behind everything. */
  background: string;
  /** Slightly raised background (grouped lists, section fills). */
  backgroundAlt: string;
  /** Card / sheet surface. */
  surface: string;
  /** Secondary surface for chips, inputs, tags. */
  surfaceAlt: string;
  /** Highest-elevation surface (modals, floating bars). */
  surfaceElevated: string;
  /** Hairline borders and dividers. */
  border: string;
  /** Stronger border for focused elements. */
  borderStrong: string;
  /** Primary text. */
  text: string;
  /** Secondary / supporting text. */
  textSecondary: string;
  /** Tertiary / placeholder text. */
  textTertiary: string;
  /** Text on top of an accent-filled element. */
  textOnAccent: string;
  /** Brand accent. */
  accent: string;
  accentSoft: string;
  accentMuted: string;
  /** Semantic colors. */
  success: string;
  warning: string;
  danger: string;
  info: string;
  /** Utility. */
  overlay: string;
  scrim: string;
  divider: string;
  /** Shadow color used for elevation. */
  shadow: string;
  /** True when this palette is the dark variant. */
  dark: boolean;
}

const light: Palette = {
  background: '#F4F5FA',
  backgroundAlt: '#ECEFF7',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F9',
  surfaceElevated: '#FFFFFF',
  border: '#E5E8F0',
  borderStrong: '#D3D8E6',
  text: '#101323',
  textSecondary: '#5C6478',
  textTertiary: '#98A0B3',
  textOnAccent: '#FFFFFF',
  accent: '#6D5DFC',
  accentSoft: '#EEEBFF',
  accentMuted: '#D9D4FF',
  success: '#12B76A',
  warning: '#F79009',
  danger: '#F04438',
  info: '#2E90FA',
  overlay: 'rgba(16,19,35,0.45)',
  scrim: 'rgba(16,19,35,0.06)',
  divider: '#EDEFF5',
  shadow: '#1B2040',
  dark: false,
};

const dark: Palette = {
  background: '#0A0B10',
  backgroundAlt: '#0F1118',
  surface: '#151823',
  surfaceAlt: '#1D2130',
  surfaceElevated: '#20263A',
  border: '#252A3A',
  borderStrong: '#333A4F',
  text: '#F3F5FB',
  textSecondary: '#A2ABC2',
  textTertiary: '#6B7488',
  textOnAccent: '#FFFFFF',
  accent: '#8B7BFF',
  accentSoft: '#221F3D',
  accentMuted: '#3A335F',
  success: '#32D583',
  warning: '#FDB022',
  danger: '#F97066',
  info: '#53B1FD',
  overlay: 'rgba(0,0,0,0.6)',
  scrim: 'rgba(255,255,255,0.04)',
  divider: '#1E2230',
  shadow: '#000000',
  dark: true,
};

export const palettes: Record<ThemeMode, Palette> = { light, dark };

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 44,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

export const fontSize = {
  micro: 10,
  caption: 12,
  footnote: 13,
  body: 15,
  bodyLg: 16,
  headline: 18,
  title: 22,
  largeTitle: 28,
  display: 34,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const gradients = {
  brand: ['#6D5DFC', '#9B6DFF'] as const,
  brandDeep: ['#4F46E5', '#7C3AED'] as const,
  sunrise: ['#FF7A59', '#FF4D8D'] as const,
  ocean: ['#2E90FA', '#22D3EE'] as const,
  forest: ['#12B76A', '#38D9A9'] as const,
  amber: ['#F79009', '#FDB022'] as const,
  dusk: ['#1E1B4B', '#4C1D95'] as const,
  surfaceLight: ['#FFFFFF', '#F4F5FA'] as const,
};

export interface Elevation {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

export function elevation(p: Palette, level: 1 | 2 | 3 | 4 = 1): Elevation {
  const base = p.dark
    ? { 1: 0.35, 2: 0.45, 3: 0.55, 4: 0.65 }
    : { 1: 0.05, 2: 0.08, 3: 0.11, 4: 0.16 };
  const radiusByLevel = { 1: 8, 2: 14, 3: 22, 4: 30 };
  const offsetByLevel = { 1: 2, 2: 4, 3: 7, 4: 10 };
  const elev = { 1: 2, 2: 5, 3: 10, 4: 16 };
  return {
    shadowColor: p.shadow,
    shadowOpacity: base[level],
    shadowRadius: radiusByLevel[level],
    shadowOffset: { width: 0, height: offsetByLevel[level] },
    elevation: elev[level],
  };
}

/**
 * Curated note colors: each entry carries a light and dark background plus an
 * accent used for the marker dot / selected border.
 */
export interface NoteColor {
  id: string;
  name: string;
  light: { bg: string; accent: string };
  dark: { bg: string; accent: string };
}

export const noteColors: NoteColor[] = [
  { id: 'default', name: 'Default', light: { bg: '#FFFFFF', accent: '#98A0B3' }, dark: { bg: '#151823', accent: '#6B7488' } },
  { id: 'violet', name: 'Violet', light: { bg: '#F1EEFF', accent: '#6D5DFC' }, dark: { bg: '#211D3B', accent: '#8B7BFF' } },
  { id: 'blue', name: 'Blue', light: { bg: '#E8F2FF', accent: '#2E90FA' }, dark: { bg: '#132539', accent: '#53B1FD' } },
  { id: 'cyan', name: 'Cyan', light: { bg: '#E2F9F8', accent: '#0FB5AE' }, dark: { bg: '#0F2B2B', accent: '#2BD9D1' } },
  { id: 'green', name: 'Green', light: { bg: '#E6F8EE', accent: '#12B76A' }, dark: { bg: '#102A1E', accent: '#32D583' } },
  { id: 'lime', name: 'Lime', light: { bg: '#F0F9E1', accent: '#84CC16' }, dark: { bg: '#1D2810', accent: '#A3E635' } },
  { id: 'yellow', name: 'Yellow', light: { bg: '#FEF6E0', accent: '#EAAA08' }, dark: { bg: '#2B2310', accent: '#FDB022' } },
  { id: 'orange', name: 'Orange', light: { bg: '#FFEFE6', accent: '#F79009' }, dark: { bg: '#2E1E10', accent: '#FDB022' } },
  { id: 'red', name: 'Red', light: { bg: '#FDECEA', accent: '#F04438' }, dark: { bg: '#2E1517', accent: '#F97066' } },
  { id: 'pink', name: 'Pink', light: { bg: '#FDEBF4', accent: '#EE46BC' }, dark: { bg: '#2C1224', accent: '#F670C7' } },
  { id: 'purple', name: 'Purple', light: { bg: '#F4E9FE', accent: '#9B51E0' }, dark: { bg: '#251534', accent: '#B692F6' } },
  { id: 'slate', name: 'Slate', light: { bg: '#EDF0F4', accent: '#64748B' }, dark: { bg: '#1C2130', accent: '#94A3B8' } },
];

export function noteColorBg(id: string | null | undefined, isDark: boolean): string {
  const c = noteColors.find((x) => x.id === id) ?? noteColors[0];
  return isDark ? c.dark.bg : c.light.bg;
}

export function noteColorAccent(id: string | null | undefined, isDark: boolean): string {
  const c = noteColors.find((x) => x.id === id) ?? noteColors[0];
  return isDark ? c.dark.accent : c.light.accent;
}

export interface Theme {
  mode: ThemeMode;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  gradients: typeof gradients;
  elevation: (level?: 1 | 2 | 3 | 4) => Elevation;
  noteColors: NoteColor[];
}

export function makeTheme(mode: ThemeMode): Theme {
  const colors = palettes[mode];
  return {
    mode,
    colors,
    spacing,
    radius,
    fontSize,
    fontWeight,
    gradients,
    elevation: (level: 1 | 2 | 3 | 4 = 1) => elevation(colors, level),
    noteColors,
  };
}
