import React, { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '@/store/AppStore';
import { AppText } from './AppText';

/**
 * Wraps the app with an optional biometric/PIN gate. When `enabled`, content
 * is hidden until the user authenticates; re-locks when the app backgrounds.
 */
export function LockGate({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const theme = useTheme();
  const [locked, setLocked] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        // Nothing to authenticate against; fail open.
        setLocked(false);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock NoteFlow',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setLocked(false);
        setError(null);
      } else {
        setError('Authentication failed. Tap to try again.');
      }
    } catch {
      setError('Unable to authenticate. Tap to try again.');
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      setLocked(true);
      authenticate();
    } else {
      setLocked(false);
    }
  }, [enabled, authenticate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (enabled && (state === 'background' || state === 'inactive')) setLocked(true);
      if (enabled && state === 'active' && locked) authenticate();
    });
    return () => sub.remove();
  }, [enabled, locked, authenticate]);

  if (!locked) return <>{children}</>;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.gradients.dusk}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 }}>
        <View
          style={{
            width: 92,
            height: 92,
            borderRadius: 30,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="lock-closed" size={40} color="#fff" />
        </View>
        <AppText variant="title" color="#fff" style={{ marginTop: 6 }}>
          NoteFlow is locked
        </AppText>
        <AppText variant="footnote" align="center" color="rgba(255,255,255,0.75)">
          {error ?? 'Authenticate to view your notes.'}
        </AppText>
        <AppText
          variant="body"
          weight="semibold"
          color="#C4B5FD"
          style={{ marginTop: 14 }}
          onPress={authenticate}
        >
          Tap to unlock
        </AppText>
      </View>
    </View>
  );
}
