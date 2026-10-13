import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/AppStore';
import { noteColors } from '@/theme';
import type { Folder, Tag } from '@/types';
import { AppText } from './AppText';
import { Chip, PressableScale } from './ui';
import { haptics } from '@/lib/haptics';

/** Horizontal swatch row for choosing a note colour. */
export function ColorSwatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: theme.spacing.lg }}>
      {noteColors.map((c) => {
        const active = c.id === value;
        const bg = theme.colors.dark ? c.dark.bg : c.light.bg;
        const accent = theme.colors.dark ? c.dark.accent : c.light.accent;
        return (
          <PressableScale
            key={c.id}
            onPress={() => {
              haptics.select();
              onChange(c.id);
            }}
            scaleTo={0.9}
            haptic="none"
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: bg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: active ? 2.5 : StyleSheet.hairlineWidth,
              borderColor: active ? accent : theme.colors.border,
            }}
          >
            {active ? <Ionicons name="checkmark" size={18} color={accent} /> : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

/** Row of folder options, optionally including "None". */
export function FolderPicker({
  folders,
  value,
  onChange,
  allowNone = true,
}: {
  folders: Folder[];
  value: string | null;
  onChange: (id: string | null) => void;
  allowNone?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: theme.spacing.lg }}>
      {allowNone ? (
        <Chip
          label="No folder"
          active={value === null}
          onPress={() => onChange(null)}
          icon="close-circle-outline"
          color={theme.colors.textSecondary}
        />
      ) : null}
      {folders.map((f) => (
        <Chip
          key={f.id}
          label={f.name}
          active={value === f.id}
          onPress={() => onChange(f.id)}
          color={theme.colors.accent}
        />
      ))}
    </View>
  );
}

/** Toggleable tag chips plus a create-new-tag affordance. */
export function TagPicker({
  tags,
  selectedIds,
  onToggle,
  onCreate,
}: {
  tags: Tag[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  return (
    <View style={{ paddingHorizontal: theme.spacing.lg, gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tags.length === 0 ? (
          <AppText variant="caption" tone="tertiary">
            No tags yet. Create one below.
          </AppText>
        ) : null}
        {tags.map((t) => (
          <Chip
            key={t.id}
            label={`#${t.name}`}
            small
            active={selectedIds.includes(t.id)}
            onPress={() => onToggle(t.id)}
            color={theme.colors.accent}
          />
        ))}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radius.md,
          paddingHorizontal: 12,
          height: 44,
        }}
      >
        <AppText variant="body" tone="tertiary">
          #
        </AppText>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="new tag"
          placeholderTextColor={theme.colors.textTertiary}
          onSubmitEditing={() => {
            if (draft.trim()) {
              onCreate(draft.trim());
              setDraft('');
            }
          }}
          style={{ flex: 1, color: theme.colors.text, fontSize: theme.fontSize.body }}
          returnKeyType="done"
          autoCapitalize="none"
        />
        <PressableScale
          onPress={() => {
            if (draft.trim()) {
              onCreate(draft.trim());
              setDraft('');
            }
          }}
          haptic="select"
          scaleTo={0.9}
        >
          <Ionicons name="add-circle" size={24} color={theme.colors.accent} />
        </PressableScale>
      </View>
    </View>
  );
}

/** Small pill used to render a tag inline. */
export function TagPill({ name, color }: { name: string; color?: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.accentSoft,
      }}
    >
      <AppText variant="micro" weight="semibold" color={color ?? theme.colors.accent}>
        #{name}
      </AppText>
    </View>
  );
}
