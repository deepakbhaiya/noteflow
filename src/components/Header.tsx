import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/AppStore';
import { AppText } from './AppText';
import { IconButton } from './ui';

/** Compact header with a title, optional subtitle and trailing actions. */
export function Header({
  title,
  subtitle,
  onBack,
  actions,
  large,
  style,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
          minHeight: 56,
        },
        style,
      ]}
    >
      {onBack ? <IconButton name="chevron-back" onPress={onBack} haptic="light" /> : null}
      <View style={{ flex: 1 }}>
        {title ? (
          <AppText variant={large ? 'largeTitle' : 'title'} numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
        {subtitle ? (
          <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actions ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>{actions}</View> : null}
    </View>
  );
}

/** Big in-scroll title used on primary tab screens. */
export function LargeTitle({
  title,
  subtitle,
  actions,
  style,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
        },
        style,
      ]}
    >
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <AppText variant="caption" weight="semibold" tone="accent" style={{ letterSpacing: 1 }}>
            {subtitle.toUpperCase()}
          </AppText>
        ) : null}
        <AppText variant="display" style={{ marginTop: 2 }}>
          {title}
        </AppText>
      </View>
      {actions ? <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 6 }}>{actions}</View> : null}
    </View>
  );
}

export function SectionLabel({ label, right }: { label: string; right?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.sm,
      }}
    >
      <AppText variant="caption" weight="bold" tone="tertiary" style={{ letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({});
