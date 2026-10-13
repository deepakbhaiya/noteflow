import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, useTheme } from '@/store/AppStore';
import * as db from '@/db';
import { haptics } from '@/lib/haptics';
import { noteColorAccent } from '@/theme';
import type { Folder } from '@/types';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { Sheet, ConfirmDialog } from '@/components/Sheet';
import { ColorSwatches } from '@/components/Pickers';
import { IconButton, PressableScale, PrimaryButton, Divider, SettingRow } from '@/components/ui';
import { useToast } from '@/components/Toast';

const FOLDER_ICONS: React.ComponentProps<typeof Ionicons>['name'][] = [
  'folder', 'briefcase', 'heart', 'bulb', 'book', 'airplane', 'cart', 'musical-notes',
  'fitness', 'camera', 'game-controller', 'pizza', 'school', 'cash', 'leaf', 'star',
];

export default function FoldersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { folders, counts, refresh, refreshFolders, refreshCounts, tags } = useApp();
  const toast = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Folder | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('violet');
  const [icon, setIcon] = useState<React.ComponentProps<typeof Ionicons>['name']>('folder');
  const [deleting, setDeleting] = useState<Folder | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setName('');
    setColor('violet');
    setIcon('folder');
    setSheetOpen(true);
  }, []);

  const openEdit = useCallback((f: Folder) => {
    setEditing(f);
    setName(f.name);
    setColor(f.color);
    setIcon(f.icon as any);
    setSheetOpen(true);
  }, []);

  const save = useCallback(async () => {
    if (!name.trim()) {
      toast.show('Give your space a name', { tone: 'warning' });
      return;
    }
    if (editing) {
      await db.updateFolder(editing.id, { name: name.trim(), color, icon });
      toast.show('Space updated', { tone: 'success' });
    } else {
      await db.createFolder(name.trim(), color, icon);
      toast.show('Space created', { tone: 'success' });
    }
    setSheetOpen(false);
    await refreshFolders();
    await refreshCounts();
    refresh();
  }, [editing, name, color, icon, toast, refreshFolders, refreshCounts, refresh]);

  const remove = useCallback(async () => {
    if (!deleting) return;
    await db.deleteFolder(deleting.id);
    setDeleting(null);
    toast.show('Space deleted', { tone: 'neutral' as any });
    await refreshFolders();
    await refreshCounts();
    refresh();
  }, [deleting, toast, refreshFolders, refreshCounts, refresh]);

  const total = counts._all ?? 0;

  return (
    <Screen>
      <Header
        title="Spaces"
        subtitle={`${folders.length} spaces · ${tags.length} tags`}
        actions={<IconButton name="add" onPress={openCreate} variant="soft" />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* All notes card */}
        <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md }}>
          <PressableScale
            onPress={() => router.push('/editor/new')}
            haptic="light"
            scaleTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.accentSoft,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.accentMuted,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                backgroundColor: theme.colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="sparkles" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyLg" weight="semibold">
                All notes
              </AppText>
              <AppText variant="caption" tone="secondary">
                {total} {total === 1 ? 'note' : 'notes'} · quick capture
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.accent} />
          </PressableScale>
        </View>

        {/* Folders grid */}
        {folders.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title="No spaces yet"
            message="Group related notes into spaces like Work, Personal or Ideas."
            actionLabel="Create a space"
            onAction={openCreate}
            compact
          />
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingHorizontal: theme.spacing.md,
            }}
          >
            {folders.map((f) => {
              const accent = noteColorAccent(f.color, theme.colors.dark);
              const count = counts[f.id] ?? 0;
              return (
                <View key={f.id} style={{ width: '50%', padding: 6 }}>
                  <PressableScale
                    onPress={() => router.push(`/folder/${f.id}`)}
                    onLongPress={() => openEdit(f)}
                    haptic="light"
                    scaleTo={0.97}
                    style={{
                      borderRadius: theme.radius.lg,
                      backgroundColor: theme.colors.surface,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: theme.colors.border,
                      padding: theme.spacing.lg,
                      height: 132,
                      justifyContent: 'space-between',
                      ...theme.elevation(1),
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 13,
                        backgroundColor: accent + '22',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={(f.icon || 'folder') as any} size={21} color={accent} />
                    </View>
                    <View>
                      <AppText variant="bodyLg" weight="semibold" numberOfLines={1}>
                        {f.name}
                      </AppText>
                      <AppText variant="caption" tone="tertiary">
                        {count} {count === 1 ? 'note' : 'notes'}
                      </AppText>
                    </View>
                  </PressableScale>
                </View>
              );
            })}
          </View>
        )}

        {/* Tags overview */}
        {tags.length > 0 ? (
          <>
            <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.sm }}>
              <AppText variant="caption" weight="bold" tone="tertiary" style={{ letterSpacing: 0.8 }}>
                TAGS
              </AppText>
            </View>
            <View style={{ paddingHorizontal: theme.spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((t) => (
                <PressableScale
                  key={t.id}
                  onPress={() => router.push(`/tag/${t.id}`)}
                  haptic="select"
                  scaleTo={0.94}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                  }}
                >
                  <AppText variant="footnote" weight="semibold" tone="secondary">
                    #{t.name}
                  </AppText>
                </PressableScale>
              ))}
            </View>
          </>
        ) : null}

        {/* Maintenance */}
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl }}>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <SettingRow
              icon="archive-outline"
              title="Archive"
              subtitle="Notes you have set aside"
              onPress={() => router.push('/archive')}
              right={<Ionicons name="chevron-forward" size={17} color={theme.colors.textTertiary} />}
            />
            <Divider />
            <SettingRow
              icon="trash-outline"
              title="Trash"
              subtitle="Deleted notes can be restored"
              onPress={() => router.push('/trash')}
              right={<Ionicons name="chevron-forward" size={17} color={theme.colors.textTertiary} />}
            />
          </View>
        </View>
      </ScrollView>

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? 'Edit space' : 'New space'}
        subtitle="Name it, colour it, pick an icon"
      >
        <View style={{ paddingHorizontal: theme.spacing.lg, gap: 18 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.md,
              paddingHorizontal: 14,
              height: 50,
            }}
          >
            <Ionicons name={icon} size={20} color={noteColorAccent(color, theme.colors.dark)} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Space name"
              placeholderTextColor={theme.colors.textTertiary}
              style={{ flex: 1, color: theme.colors.text, fontSize: theme.fontSize.bodyLg }}
              autoFocus
            />
          </View>

          <View>
            <AppText variant="caption" weight="bold" tone="tertiary" style={{ marginBottom: 10 }}>
              COLOUR
            </AppText>
            <ColorSwatches value={color} onChange={setColor} />
          </View>

          <View>
            <AppText variant="caption" weight="bold" tone="tertiary" style={{ marginBottom: 10 }}>
              ICON
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {FOLDER_ICONS.map((ic) => {
                const active = ic === icon;
                return (
                  <PressableScale
                    key={ic}
                    onPress={() => {
                      haptics.select();
                      setIcon(ic);
                    }}
                    haptic="none"
                    scaleTo={0.9}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? theme.colors.accentSoft : theme.colors.surfaceAlt,
                      borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                      borderColor: active ? theme.colors.accent : theme.colors.border,
                    }}
                  >
                    <Ionicons
                      name={ic}
                      size={21}
                      color={active ? theme.colors.accent : theme.colors.textSecondary}
                    />
                  </PressableScale>
                );
              })}
            </View>
          </View>

          <PrimaryButton label={editing ? 'Save changes' : 'Create space'} onPress={save} full />

          {editing ? (
            <PrimaryButton
              label="Delete space"
              variant="danger"
              icon="trash-outline"
              onPress={() => {
                setSheetOpen(false);
                setDeleting(editing);
              }}
              full
            />
          ) : null}
        </View>
      </Sheet>

      <ConfirmDialog
        visible={!!deleting}
        title={`Delete “${deleting?.name}”?`}
        message="Notes inside will be kept and moved to All notes."
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
