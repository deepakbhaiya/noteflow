import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/AppStore';
import { AppText } from './AppText';
import { PressableScale } from './ui';

export interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (t: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(function SearchBar(
  { value, onChangeText, onClear, placeholder = 'Search notes…', style, ...rest },
  ref,
) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          paddingHorizontal: 14,
          height: 46,
        },
        style,
      ]}
    >
      <Ionicons name="search" size={18} color={theme.colors.textTertiary} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: theme.fontSize.body,
          paddingVertical: 0,
        }}
        returnKeyType="search"
        autoCorrect={false}
        {...rest}
      />
      {value.length > 0 ? (
        <PressableScale
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          haptic="select"
          scaleTo={0.85}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
        </PressableScale>
      ) : null}
    </View>
  );
});

/** Grouped section header used inside results lists. */
export function ResultCount({ count, query }: { count: number; query: string }) {
  const theme = useTheme();
  if (!query.trim()) return null;
  return (
    <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
      <AppText variant="caption" tone="tertiary">
        {count} {count === 1 ? 'result' : 'results'} for “{query.trim()}”
      </AppText>
    </View>
  );
}
