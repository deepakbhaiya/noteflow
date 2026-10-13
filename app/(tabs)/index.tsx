import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp, useTheme } from '@/store/AppStore';
import { useNotes } from '@/hooks/useNotes';
import * as db from '@/db';
import { haptics } from '@/lib/haptics';
import { greeting, todayLabel } from '@/lib/greeting';
import type { FilterKey, NoteWithMeta } from '@/types';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FAB, ActionBar } from '@/components/FAB';
import { NoteCard } from '@/components/NoteCard';
import { SearchBar } from '@/components/SearchBar';
import { Chip, IconButton, PressableScale } from '@/components/ui';
import { ConfirmDialog } from '@/components/Sheet';
import { useToast } from '@/components/Toast';

const FILTERS: { key: FilterKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'all', label: 'All', icon: 'albums-outline' },
  { key: 'pinned', label: 'Pinned', icon: 'pin-outline' },
  { key: 'favorites', label: 'Starred', icon: 'star-outline' },
  { key: 'checklists', label: 'Tasks', icon: 'checkbox-outline' },
  { key: 'reminders', label: 'Reminders', icon: 'alarm-outline' },
];

export default function NotesHome() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, refresh, refreshCounts, setSettings } = useApp();
  const toast = useToast();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const layout = settings.layout;

  const opts = useMemo(
    () => ({
      status: 'active' as const,
      query: query.trim() || undefined,
      favoritesOnly: filter === 'favorites',
      pinnedOnly: filter === 'pinned',
      remindersOnly: filter === 'reminders',
      checklistsOnly: filter === 'checklists',
      sort: settings.sort,
      ascending: settings.sortAscending,
    }),
    [filter, query, settings.sort, settings.sortAscending],
  );

  const { notes, reload } = useNotes(opts, [filter, query, settings.sort, settings.sortAscending]);

  const { pinned, rest } = useMemo(() => {
    const p: NoteWithMeta[] = [];
    const r: NoteWithMeta[] = [];
    for (const n of notes) (n.pinned ? p : r).push(n);
    return { pinned: p, rest: r };
  }, [notes]);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelected([]);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    haptics.select();
  }, []);

  const afterChange = useCallback(async () => {
    refresh();
    await refreshCounts();
    await reload();
  }, [refresh, refreshCounts, reload]);

  const handleTogglePin = useCallback(
    async (n: NoteWithMeta) => {
      await db.patchNote(n.id, { pinned: n.pinned ? 0 : 1 });
      haptics.light();
      await afterChange();
    },
    [afterChange],
  );

  const handleToggleFavorite = useCallback(
    async (n: NoteWithMeta) => {
      await db.patchNote(n.id, { favorite: n.favorite ? 0 : 1 });
      haptics.light();
      await afterChange();
    },
    [afterChange],
  );

  const handleArchive = useCallback(
    async (n: NoteWithMeta) => {
      await db.archiveNote(n.id);
      toast.show('Note archived', { tone: 'info', actionLabel: 'Undo', onAction: async () => {
        await db.unarchiveNote(n.id);
        await afterChange();
      } });
      await afterChange();
    },
    [afterChange, toast],
  );

  const handleTrash = useCallback(
    async (n: NoteWithMeta) => {
      await db.trashNote(n.id);
      toast.show('Moved to trash', { tone: 'danger', actionLabel: 'Undo', onAction: async () => {
        await db.restoreNote(n.id);
        await afterChange();
      } });
      await afterChange();
    },
    [afterChange, toast],
  );

  const bulk = useCallback(
    async (action: 'pin' | 'favorite' | 'archive' | 'trash') => {
      for (const id of selected) {
        if (action === 'pin') await db.patchNote(id, { pinned: 1 });
        if (action === 'favorite') await db.patchNote(id, { favorite: 1 });
        if (action === 'archive') await db.archiveNote(id);
        if (action === 'trash') await db.trashNote(id);
      }
      toast.show(
        action === 'trash' ? `${selected.length} moved to trash` : `${selected.length} updated`,
        { tone: action === 'trash' ? 'danger' : 'success' },
      );
      exitSelection();
      await afterChange();
    },
    [selected, toast, exitSelection, afterChange],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await afterChange();
    setRefreshing(false);
  }, [afterChange]);

  const renderItem = useCallback(
    ({ item, index }: { item: NoteWithMeta; index: number }) => (
      <View
        style={
          layout === 'grid'
            ? { flex: 1, maxWidth: '50%', padding: 6 }
            : { paddingHorizontal: theme.spacing.lg, paddingBottom: 10 }
        }
      >
        <NoteCard
          note={item}
          layout={layout}
          index={index}
          query={query}
          selected={selected.includes(item.id)}
          selectionMode={selectionMode}
          onPress={() => (selectionMode ? toggleSelect(item.id) : router.push(`/editor/${item.id}`))}
          onLongPress={() => {
            if (!selectionMode) {
              setSelectionMode(true);
              setSelected([item.id]);
              haptics.medium();
            }
          }}
          onTogglePin={() => handleTogglePin(item)}
          onToggleFavorite={() => handleToggleFavorite(item)}
          onArchive={() => handleArchive(item)}
          onTrash={() => handleTrash(item)}
        />
      </View>
    ),
    [
      layout,
      query,
      selected,
      selectionMode,
      router,
      toggleSelect,
      handleTogglePin,
      handleToggleFavorite,
      handleArchive,
      handleTrash,
      theme.spacing.lg,
    ],
  );

  const ListHeader = (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="caption" weight="semibold" tone="accent" style={{ letterSpacing: 1 }}>
            {todayLabel().toUpperCase()}
          </AppText>
          <AppText variant="display" style={{ marginTop: 2 }}>
            {greeting()}
          </AppText>
        </View>
        {selectionMode ? (
          <PressableScale onPress={exitSelection} haptic="light" scaleTo={0.92}>
            <AppText variant="body" weight="semibold" tone="accent">
              Done
            </AppText>
          </PressableScale>
        ) : (
          <View style={{ flexDirection: 'row', gap: 4, paddingBottom: 6 }}>
            <IconButton name="archive-outline" onPress={() => router.push('/archive')} />
            <IconButton name="stats-chart-outline" onPress={() => router.push('/stats')} />
            <IconButton
              name={layout === 'grid' ? 'grid' : layout === 'compact' ? 'reorder-four' : 'list'}
              onPress={() => {
                const next = layout === 'list' ? 'grid' : layout === 'grid' ? 'compact' : 'list';
                haptics.select();
                setSettings({ layout: next });
              }}
            />
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search your notes…" />
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: 8 }}
        renderItem={({ item: f }) => (
          <Chip
            label={f.label}
            icon={f.icon}
            active={filter === f.key}
            onPress={() => {
              haptics.select();
              setFilter(f.key);
            }}
          />
        )}
        style={{ flexGrow: 0, marginBottom: theme.spacing.md }}
      />

      {pinned.length > 0 && filter !== 'pinned' ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="pin" size={13} color={theme.colors.accent} />
          <AppText variant="caption" weight="bold" tone="tertiary" style={{ letterSpacing: 0.8 }}>
            PINNED
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const showEmpty = notes.length === 0;

  return (
    <Screen>
      <FlatList
        data={layout === 'grid' ? notes : rest}
        key={layout === 'grid' ? 'grid' : 'list'}
        keyExtractor={(n) => n.id}
        numColumns={layout === 'grid' ? 2 : 1}
        columnWrapperStyle={layout === 'grid' ? { paddingHorizontal: theme.spacing.md } : undefined}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            {ListHeader}
            {!showEmpty && layout !== 'grid' && pinned.length > 0 && filter !== 'pinned' ? (
              <View style={{ paddingHorizontal: theme.spacing.lg, gap: 10, marginBottom: 6 }}>
                {pinned.map((n, i) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    layout={layout}
                    index={i}
                    query={query}
                    selected={selected.includes(n.id)}
                    selectionMode={selectionMode}
                    onPress={() => (selectionMode ? toggleSelect(n.id) : router.push(`/editor/${n.id}`))}
                    onLongPress={() => {
                      if (!selectionMode) {
                        setSelectionMode(true);
                        setSelected([n.id]);
                        haptics.medium();
                      }
                    }}
                    onTogglePin={() => handleTogglePin(n)}
                    onToggleFavorite={() => handleToggleFavorite(n)}
                    onArchive={() => handleArchive(n)}
                    onTrash={() => handleTrash(n)}
                  />
                ))}
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          showEmpty ? (
            <EmptyState
              icon={query ? 'search-outline' : 'sparkles-outline'}
              title={query ? 'No matches' : filter !== 'all' ? 'Nothing here yet' : 'Start your first note'}
              message={
                query
                  ? 'Try a different word or clear your search.'
                  : filter !== 'all'
                    ? 'Notes matching this filter will appear here.'
                    : 'Capture an idea, a list or a plan. Everything stays on your device.'
              }
              actionLabel={query || filter !== 'all' ? undefined : 'New note'}
              onAction={query || filter !== 'all' ? undefined : () => router.push('/editor/new')}
            />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      />

      {!selectionMode ? <FAB onPress={() => router.push('/editor/new')} /> : null}

      {selectionMode ? (
        <ActionBar>
          <SelectAction icon="pin-outline" label="Pin" onPress={() => bulk('pin')} />
          <SelectAction icon="star-outline" label="Star" onPress={() => bulk('favorite')} />
          <SelectAction icon="archive-outline" label="Archive" onPress={() => bulk('archive')} />
          <SelectAction icon="trash-outline" label="Delete" tone={theme.colors.danger} onPress={() => bulk('trash')} />
        </ActionBar>
      ) : null}

      <ConfirmDialog
        visible={confirmPurge}
        title="Delete selected notes?"
        message="This permanently removes the selected notes."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmPurge(false)}
        onConfirm={() => {
          setConfirmPurge(false);
          bulk('trash');
        }}
      />
    </Screen>
  );
}

function SelectAction({
  icon,
  label,
  onPress,
  tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tone?: string;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="medium"
      scaleTo={0.9}
      style={{ alignItems: 'center', gap: 3, paddingHorizontal: 14, paddingVertical: 4 }}
    >
      <Ionicons name={icon} size={21} color={tone ?? theme.colors.text} />
      <AppText variant="micro" weight="semibold" tone="secondary">
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({});
