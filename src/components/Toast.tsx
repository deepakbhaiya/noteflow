import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/AppStore';
import { AppText } from './AppText';

type ToastTone = 'default' | 'success' | 'danger' | 'warning' | 'info';

interface ToastState {
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

const ToastContext = createContext<{
  show: (message: string, opts?: { tone?: ToastTone; actionLabel?: string; onAction?: () => void; duration?: number }) => void;
}>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (
      message: string,
      opts?: { tone?: ToastTone; actionLabel?: string; onAction?: () => void; duration?: number },
    ) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone: opts?.tone ?? 'default', actionLabel: opts?.actionLabel, onAction: opts?.onAction });
      timer.current = setTimeout(() => setToast(null), opts?.duration ?? 2400);
    },
    [],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? <ToastView toast={toast} onDismiss={() => setToast(null)} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const toneColor: Record<ToastTone, string> = {
    default: theme.colors.textSecondary,
    success: theme.colors.success,
    danger: theme.colors.danger,
    warning: theme.colors.warning,
    info: theme.colors.info,
  };
  const iconMap: Record<ToastTone, React.ComponentProps<typeof Ionicons>['name']> = {
    default: 'information-circle',
    success: 'checkmark-circle',
    danger: 'alert-circle',
    warning: 'warning',
    info: 'information-circle',
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutUp}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 20,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          maxWidth: 520,
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: theme.colors.dark ? theme.colors.surfaceElevated : '#101323',
          borderRadius: theme.radius.md,
          paddingHorizontal: 16,
          paddingVertical: 13,
          ...theme.elevation(4),
        }}
      >
        <Ionicons name={iconMap[toast.tone]} size={19} color={toneColor[toast.tone]} />
        <AppText variant="footnote" weight="medium" style={{ flex: 1 }} color="#fff">
          {toast.message}
        </AppText>
        {toast.actionLabel ? (
          <AppText
            variant="footnote"
            weight="bold"
            color={theme.colors.accent}
            onPress={() => {
              toast.onAction?.();
              onDismiss();
            }}
          >
            {toast.actionLabel}
          </AppText>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({});
