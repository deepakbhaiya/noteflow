import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/AppStore';
import { PressableScale } from './ui';

/** Floating gradient compose button. */
export function FAB({
  onPress,
  icon = 'add',
  bottom = 24,
  label,
}: {
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  bottom?: number;
  label?: string;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const size = 58;
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown}
      style={[
        {
          position: 'absolute',
          right: theme.spacing.lg,
          bottom: bottom + insets.bottom,
        },
      ]}
    >
      <PressableScale onPress={onPress} haptic="medium" scaleTo={0.9}>
        <LinearGradient
          colors={theme.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: size,
            minWidth: size,
            paddingHorizontal: label ? 22 : 0,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            ...theme.elevation(3),
            shadowColor: theme.colors.accent,
            shadowOpacity: 0.5,
          }}
        >
          <Ionicons name={icon} size={26} color="#fff" />
          {label ? (
            <View>
              <Animated.Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{label}</Animated.Text>
            </View>
          ) : null}
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

/** Frosted floating action bar (used for multi-select). */
export function ActionBar({
  children,
  bottom = 24,
}: {
  children: React.ReactNode;
  bottom?: number;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown}
      style={{
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        bottom: bottom + insets.bottom,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        paddingVertical: 10,
        ...theme.elevation(4),
      }}
    >
      {children}
    </Animated.View>
  );
}
