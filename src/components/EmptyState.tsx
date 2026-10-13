import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/AppStore';
import { AppText } from './AppText';
import { PrimaryButton } from './ui';

export function EmptyState({
  icon = 'document-text-outline',
  title,
  message,
  actionLabel,
  onAction,
  compact,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { paddingVertical: compact ? theme.spacing.xxl : 64 }]}>
      <LinearGradient
        colors={theme.colors.dark ? ['#221F3D', '#151823'] : ['#F1EEFF', '#E8F2FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.icon,
          { borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name={icon} size={34} color={theme.colors.accent} />
      </LinearGradient>
      <AppText variant="headline" align="center" style={{ marginTop: theme.spacing.lg }}>
        {title}
      </AppText>
      {message ? (
        <AppText
          variant="footnote"
          tone="secondary"
          align="center"
          style={{ marginTop: theme.spacing.sm, maxWidth: 280 }}
        >
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} icon="add" style={{ marginTop: theme.spacing.xl }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  icon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
