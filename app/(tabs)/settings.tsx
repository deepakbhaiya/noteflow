import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useTheme } from '@/store/AppStore';
import * as db from '@/db';
import { haptics } from '@/lib/haptics';
import { exportAll } from '@/lib/export';
import type { LayoutMode, SortKey } from '@/types';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { Segmented, SettingRow, Divider, PressableScale, PrimaryButton } from '@/components/ui';
import { ConfirmDialog } from '@/components/Sheet';
import { useToast } from '@/components/Toast';

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: theme.spacing.xl }}>
      {title ? (
        <AppText
          variant="caption"
          weight="bold"
          tone="tertiary"
          style={{ letterSpacing: 0.8, marginBottom: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}
        >
          {title.toUpperCase()}
        </AppText>
      ) : null}
      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
            ...theme.elevation(1),
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

function SwitchRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <SettingRow
      icon={icon}
      title={title}
      subtitle={subtitle}
      right={
        <Switch
          value={value}
          onValueChange={(v) => {
            haptics.select();
            onChange(v);
          }}
          trackColor={{ true: theme.colors.accent, false: theme.colors.borderStrong }}
          thumbColor="#fff"
        />
      }
    />
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, setSettings, refresh } = useApp();
  const toast = useToast();
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const doExport = useCallback(
    async (format: 'md' | 'json') => {
      const notes = await db.listNotesWithMeta({ status: 'active' });
      const ok = await exportAll(notes, format);
      toast.show(ok ? 'Export ready' : 'Export unavailable', { tone: ok ? 'success' : 'warning' });
    },
    [toast],
  );

  return (
    <Screen>
      <Header title="Settings" subtitle="Make NoteFlow yours" />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Group title="Appearance">
          <View style={{ paddingVertical: theme.spacing.lg, gap: 14 }}>
            <View>
              <AppText variant="footnote" weight="semibold" tone="secondary" style={{ marginBottom: 8 }}>
                Theme
              </AppText>
              <Segmented
                value={settings.themeMode}
                onChange={(v) => {
                  haptics.select();
                  setSettings({ themeMode: v });
                }}
                options={[
                  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
                  { value: 'light', label: 'Light', icon: 'sunny-outline' },
                  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
                ]}
              />
            </View>
            <View>
              <AppText variant="footnote" weight="semibold" tone="secondary" style={{ marginBottom: 8 }}>
                Default layout
              </AppText>
              <Segmented
                value={settings.layout}
                onChange={(v) => {
                  haptics.select();
                  setSettings({ layout: v as LayoutMode });
                }}
                options={[
                  { value: 'list', label: 'List', icon: 'list-outline' },
                  { value: 'grid', label: 'Grid', icon: 'grid-outline' },
                  { value: 'compact', label: 'Compact', icon: 'reorder-four-outline' },
                ]}
              />
            </View>
            <View>
              <AppText variant="footnote" weight="semibold" tone="secondary" style={{ marginBottom: 8 }}>
                Sort notes by
              </AppText>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {(
                  [
                    { v: 'updated', l: 'Last edited' },
                    { v: 'created', l: 'Date created' },
                    { v: 'title', l: 'Title' },
                  ] as { v: SortKey; l: string }[]
                ).map((o) => (
                  <PressableScale
                    key={o.v}
                    onPress={() => {
                      haptics.select();
                      setSettings({ sort: o.v });
                    }}
                    haptic="none"
                    scaleTo={0.95}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: theme.radius.pill,
                      backgroundColor: settings.sort === o.v ? theme.colors.accent : theme.colors.surfaceAlt,
                    }}
                  >
                    <AppText
                      variant="footnote"
                      weight="semibold"
                      color={settings.sort === o.v ? '#fff' : theme.colors.textSecondary}
                    >
                      {o.l}
                    </AppText>
                  </PressableScale>
                ))}
                <PressableScale
                  onPress={() => {
                    haptics.select();
                    setSettings({ sortAscending: !settings.sortAscending });
                  }}
                  haptic="none"
                  scaleTo={0.95}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.surfaceAlt,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name={settings.sortAscending ? 'arrow-up' : 'arrow-down'}
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                  <AppText variant="footnote" weight="semibold" tone="secondary">
                    {settings.sortAscending ? 'Ascending' : 'Descending'}
                  </AppText>
                </PressableScale>
              </View>
            </View>
          </View>
        </Group>

        {/* Behaviour */}
        <Group title="Behaviour">
          <SwitchRow
            icon="sparkles-outline"
            title="Haptic feedback"
            subtitle="Gentle taps on actions"
            value={settings.hapticsEnabled}
            onChange={(v) => setSettings({ hapticsEnabled: v })}
          />
          <Divider />
          <SwitchRow
            icon="eye-outline"
            title="Show previews"
            subtitle="Display note text in lists"
            value={settings.showPreview}
            onChange={(v) => setSettings({ showPreview: v })}
          />
          <Divider />
          <SwitchRow
            icon="save-outline"
            title="Auto-save"
            subtitle="Save changes as you type"
            value={settings.autoSave}
            onChange={(v) => setSettings({ autoSave: v })}
          />
        </Group>

        {/* Privacy */}
        <Group title="Privacy & security">
          <SwitchRow
            icon="lock-closed-outline"
            title="App lock"
            subtitle="Require biometric unlock"
            value={settings.appLockEnabled}
            onChange={async (v) => {
              await setSettings({ appLockEnabled: v });
              if (v) toast.show('Lock enabled — reopen to test', { tone: 'success' });
            }}
          />
        </Group>

        {/* Data */}
        <Group title="Data">
          <SettingRow
            icon="document-text-outline"
            title="Export notes as Markdown"
            onPress={() => doExport('md')}
            right={<Ionicons name="download-outline" size={17} color={theme.colors.textTertiary} />}
          />
          <Divider />
          <SettingRow
            icon="code-download-outline"
            title="Backup as JSON"
            onPress={() => doExport('json')}
            right={<Ionicons name="download-outline" size={17} color={theme.colors.textTertiary} />}
          />
          <Divider />
          <SettingRow
            icon="stats-chart-outline"
            title="Insights & statistics"
            onPress={() => router.push('/stats')}
            right={<Ionicons name="chevron-forward" size={17} color={theme.colors.textTertiary} />}
          />
          <Divider />
          <SettingRow
            icon="trash-outline"
            title="Empty trash"
            subtitle="Permanently delete trashed notes"
            onPress={() => setConfirmEmpty(true)}
          />
          <Divider />
          <SettingRow
            icon="warning-outline"
            title="Delete all notes"
            subtitle="Remove every note from this device"
            destructive
            onPress={() => setConfirmWipe(true)}
          />
        </Group>

        <Group title="About">
          <SettingRow
            icon="information-circle-outline"
            title="About NoteFlow"
            subtitle="Version 1.0.0"
            onPress={() => router.push('/about')}
            right={<Ionicons name="chevron-forward" size={17} color={theme.colors.textTertiary} />}
          />
        </Group>

        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxxl }}>
          <AppText variant="caption" tone="tertiary">
            Made with care · NoteFlow
          </AppText>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmEmpty}
        title="Empty the trash?"
        message="This cannot be undone."
        confirmLabel="Empty"
        destructive
        onCancel={() => setConfirmEmpty(false)}
        onConfirm={async () => {
          setConfirmEmpty(false);
          await db.emptyTrash();
          refresh();
          toast.show('Trash emptied', { tone: 'success' });
        }}
      />

      <ConfirmDialog
        visible={confirmWipe}
        title="Delete all notes?"
        message="Every note on this device will be permanently erased."
        confirmLabel="Delete all"
        destructive
        onCancel={() => setConfirmWipe(false)}
        onConfirm={async () => {
          setConfirmWipe(false);
          const notes = await db.listNotesWithMeta({ status: 'active' });
          const archived = await db.listNotesWithMeta({ status: 'archived' });
          await db.emptyTrash();
          for (const n of [...notes, ...archived]) await db.deleteNoteForever(n.id);
          refresh();
          toast.show('All notes deleted', { tone: 'danger' });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
