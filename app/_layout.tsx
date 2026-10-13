import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { AppProvider, useApp, useTheme } from '@/store/AppStore';
import { ToastProvider } from '@/components/Toast';
import { LockGate } from '@/components/LockGate';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const theme = useTheme();
  const { ready, settings } = useApp();
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
      setFontsReady(true);
    }
  }, [ready]);

  if (!ready || !fontsReady) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.colors.dark ? 'light' : 'dark'} />
      <LockGate enabled={settings.appLockEnabled && settings.appLockBiometric}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="editor/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="folder/[id]" />
          <Stack.Screen name="tag/[id]" />
          <Stack.Screen name="archive" />
          <Stack.Screen name="trash" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="about" />
        </Stack>
      </LockGate>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
