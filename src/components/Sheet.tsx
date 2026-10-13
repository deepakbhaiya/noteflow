import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/AppStore';
import { AppText } from './AppText';
import { IconButton } from './ui';

/** Themed bottom sheet built on the native modal for reliable layering. */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  scroll = true,
  maxHeightRatio = 0.86,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  maxHeightRatio?: number;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]} onPress={onClose} />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xxl,
            borderTopRightRadius: theme.radius.xxl,
            paddingBottom: insets.bottom + theme.spacing.lg,
            maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.colors.borderStrong,
              }}
            />
          </View>
          {(title || subtitle) && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.sm,
                paddingBottom: theme.spacing.sm,
              }}
            >
              <View style={{ flex: 1 }}>
                {title ? <AppText variant="headline">{title}</AppText> : null}
                {subtitle ? (
                  <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                    {subtitle}
                  </AppText>
                ) : null}
              </View>
              <IconButton name="close" onPress={onClose} />
            </View>
          )}
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Simple centered confirm dialog. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]} onPress={onCancel} />
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.xxl,
            ...theme.elevation(4),
          }}
        >
          <AppText variant="headline" align="center">
            {title}
          </AppText>
          {message ? (
            <AppText variant="footnote" tone="secondary" align="center" style={{ marginTop: 8 }}>
              {message}
            </AppText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: theme.spacing.xxl }}>
            <Pressable
              onPress={onCancel}
              style={{
                flex: 1,
                height: 46,
                borderRadius: theme.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surfaceAlt,
              }}
            >
              <AppText variant="body" weight="semibold">
                {cancelLabel}
              </AppText>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={{
                flex: 1,
                height: 46,
                borderRadius: theme.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: destructive ? theme.colors.danger : theme.colors.accent,
              }}
            >
              <AppText variant="body" weight="semibold" color="#fff">
                {confirmLabel}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
