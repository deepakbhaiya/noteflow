import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/AppStore';

/** Standard screen shell: themed background + top inset padding. */
export function Screen({
  children,
  style,
  edges = { top: true },
  background,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: { top?: boolean; bottom?: boolean };
  background?: string;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: background ?? theme.colors.background },
        edges.top ? { paddingTop: insets.top } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
