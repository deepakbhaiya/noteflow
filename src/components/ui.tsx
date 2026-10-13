import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/AppStore';
import { haptics } from '@/lib/haptics';
import { AppText } from './AppText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* --------------------------------------------------------- PressableScale */

export interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  scaleTo?: number;
  haptic?: 'light' | 'medium' | 'soft' | 'select' | 'none';
  style?: StyleProp<ViewStyle>;
}

export function PressableScale({
  children,
  scaleTo = 0.96,
  haptic = 'light',
  style,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleIn: PressableProps['onPressIn'] = useCallback(
    (e) => {
      scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 });
      onPressIn?.(e);
    },
    [scale, scaleTo, onPressIn],
  );

  const handleOut: PressableProps['onPressOut'] = useCallback(
    (e) => {
      scale.value = withSpring(1, { damping: 16, stiffness: 260 });
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  const handlePress: PressableProps['onPress'] = useCallback(
    (e) => {
      if (haptic !== 'none') {
        if (haptic === 'medium') haptics.medium();
        else if (haptic === 'soft') haptics.soft();
        else if (haptic === 'select') haptics.select();
        else haptics.light();
      }
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={handlePress}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

/* --------------------------------------------------------------- IconButton */

export interface IconButtonProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  size?: number;
  color?: string;
  bg?: string;
  variant?: 'ghost' | 'solid' | 'soft';
  disabled?: boolean;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
  haptic?: 'light' | 'medium' | 'soft' | 'select' | 'none';
}

export function IconButton({
  name,
  onPress,
  size = 20,
  color,
  bg,
  variant = 'ghost',
  disabled,
  hitSlop = 8,
  style,
  haptic = 'light',
}: IconButtonProps) {
  const theme = useTheme();
  const surface =
    bg ?? (variant === 'solid' ? theme.colors.text : variant === 'soft' ? theme.colors.surfaceAlt : 'transparent');
  const fg =
    color ?? (variant === 'solid' ? theme.colors.background : theme.colors.textSecondary);
  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      haptic={haptic}
      hitSlop={hitSlop}
      scaleTo={0.9}
      style={[
        {
          width: size + 20,
          height: size + 20,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: surface,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={fg} />
    </PressableScale>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({
  children,
  style,
  padded = true,
  elevated = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          padding: padded ? theme.spacing.lg : 0,
        },
        elevated ? theme.elevation(1) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------- Chip */

export function Chip({
  label,
  active,
  onPress,
  icon,
  color,
  count,
  small,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  color?: string;
  count?: number;
  small?: boolean;
}) {
  const theme = useTheme();
  const accent = color ?? theme.colors.accent;
  return (
    <PressableScale
      onPress={onPress}
      haptic="select"
      scaleTo={0.94}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: small ? 10 : 14,
        paddingVertical: small ? 6 : 9,
        borderRadius: theme.radius.pill,
        backgroundColor: active ? accent : theme.colors.surfaceAlt,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: active ? accent : theme.colors.border,
      }}
    >
      {icon ? (
        <Ionicons name={icon} size={small ? 13 : 15} color={active ? '#fff' : theme.colors.textSecondary} />
      ) : null}
      <AppText
        variant={small ? 'caption' : 'footnote'}
        weight="semibold"
        color={active ? '#fff' : theme.colors.textSecondary}
      >
        {label}
      </AppText>
      {count !== undefined ? (
        <View
          style={{
            minWidth: 18,
            paddingHorizontal: 5,
            height: 18,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active ? 'rgba(255,255,255,0.22)' : theme.colors.surface,
          }}
        >
          <AppText variant="micro" weight="bold" color={active ? '#fff' : theme.colors.textTertiary}>
            {count}
          </AppText>
        </View>
      ) : null}
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Badge */

export function Badge({
  label,
  tone = 'accent',
  icon,
}: {
  label: string;
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const theme = useTheme();
  const bgMap = {
    accent: theme.colors.accentSoft,
    success: theme.colors.dark ? '#102A1E' : '#E6F8EE',
    warning: theme.colors.dark ? '#2B2310' : '#FEF6E0',
    danger: theme.colors.dark ? '#2E1517' : '#FDECEA',
    neutral: theme.colors.surfaceAlt,
  } as const;
  const fgMap = {
    accent: theme.colors.accent,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    neutral: theme.colors.textSecondary,
  } as const;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: bgMap[tone],
      }}
    >
      {icon ? <Ionicons name={icon} size={12} color={fgMap[tone]} /> : null}
      <AppText variant="micro" weight="bold" color={fgMap[tone]}>
        {label}
      </AppText>
    </View>
  );
}

/* --------------------------------------------------------------- Divider */

export function Divider({ inset = 0, style }: { inset?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.divider, marginLeft: inset },
        style,
      ]}
    />
  );
}

/* --------------------------------------------------------------- PrimaryButton */

export function PrimaryButton({
  label,
  onPress,
  icon,
  loading,
  disabled,
  variant = 'primary',
  full,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const bg =
    variant === 'danger'
      ? theme.colors.danger
      : variant === 'secondary'
        ? theme.colors.surfaceAlt
        : variant === 'ghost'
          ? 'transparent'
          : undefined;
  const fg = isPrimary ? '#fff' : variant === 'danger' ? '#fff' : theme.colors.text;

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={fg} />
      ) : null}
      <AppText variant="body" weight="semibold" color={fg}>
        {label}
      </AppText>
    </View>
  );

  return (
    <PressableScale
      onPress={disabled || loading ? undefined : onPress}
      haptic="medium"
      style={[
        {
          height: 50,
          borderRadius: theme.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          alignSelf: full ? 'stretch' : 'auto',
          overflow: 'hidden',
          paddingHorizontal: 22,
        },
        isPrimary ? theme.elevation(2) : null,
        !isPrimary ? { backgroundColor: bg ?? 'transparent' } : null,
        style,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={theme.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {content}
    </PressableScale>
  );
}

/* --------------------------------------------------------------- Segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: theme.radius.md,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            onPress={() => onChange(o.value)}
            haptic="select"
            scaleTo={0.97}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
              borderRadius: theme.radius.sm,
              backgroundColor: active ? theme.colors.surface : 'transparent',
            }}
          >
            {o.icon ? (
              <Ionicons
                name={o.icon}
                size={15}
                color={active ? theme.colors.accent : theme.colors.textTertiary}
              />
            ) : null}
            <AppText
              variant="footnote"
              weight={active ? 'semibold' : 'medium'}
              color={active ? theme.colors.text : theme.colors.textTertiary}
            >
              {o.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ SwitchRow */

export function SettingRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  destructive,
  last,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      scaleTo={0.99}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 0,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: destructive ? theme.colors.danger + '20' : theme.colors.accentSoft,
          }}
        >
          <Ionicons name={icon} size={18} color={destructive ? theme.colors.danger : theme.colors.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="medium" color={destructive ? theme.colors.danger : undefined}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </PressableScale>
  );
}
