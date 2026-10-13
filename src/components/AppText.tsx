import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/store/AppStore';

type Variant =
  | 'display'
  | 'largeTitle'
  | 'title'
  | 'headline'
  | 'bodyLg'
  | 'body'
  | 'footnote'
  | 'caption'
  | 'micro'
  | 'mono';

type Tone = 'default' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'warning' | 'danger' | 'onAccent';

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: keyof ReturnType<typeof useTheme>['fontWeight'];
  align?: TextStyle['textAlign'];
  color?: string;
  scale?: number;
}

export function AppText({
  variant = 'body',
  tone = 'default',
  weight,
  align,
  color,
  scale = 1,
  style,
  children,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const { fontSize, fontWeight } = theme;

  const sizeMap: Record<Variant, number> = {
    display: fontSize.display,
    largeTitle: fontSize.largeTitle,
    title: fontSize.title,
    headline: fontSize.headline,
    bodyLg: fontSize.bodyLg,
    body: fontSize.body,
    footnote: fontSize.footnote,
    caption: fontSize.caption,
    micro: fontSize.micro,
    mono: fontSize.footnote,
  };

  const defaultWeight: Record<Variant, keyof typeof fontWeight> = {
    display: 'heavy',
    largeTitle: 'bold',
    title: 'bold',
    headline: 'semibold',
    bodyLg: 'regular',
    body: 'regular',
    footnote: 'regular',
    caption: 'medium',
    micro: 'semibold',
    mono: 'regular',
  };

  const toneColor: Record<Tone, string> = {
    default: theme.colors.text,
    secondary: theme.colors.textSecondary,
    tertiary: theme.colors.textTertiary,
    accent: theme.colors.accent,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    onAccent: theme.colors.textOnAccent,
  };

  const lineHeightMap: Partial<Record<Variant, number>> = {
    display: 40,
    largeTitle: 34,
    title: 28,
    headline: 24,
    bodyLg: 24,
    body: 22,
    footnote: 19,
    caption: 17,
  };

  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: Math.round(sizeMap[variant] * scale),
          fontWeight: fontWeight[weight ?? defaultWeight[variant]],
          color: color ?? toneColor[tone],
          textAlign: align,
          lineHeight: lineHeightMap[variant] ? Math.round(lineHeightMap[variant]! * scale) : undefined,
          letterSpacing: variant === 'display' || variant === 'largeTitle' ? -0.6 : 0,
          fontFamily: variant === 'mono' ? 'monospace' : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
