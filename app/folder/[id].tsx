import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useTheme } from '@/store/AppStore';
import { useNotes } from '@/hooks/useNotes';
import * as db from '@/db';
import { haptics } from '@/lib/haptics';
import { noteColorAccent } from '@/theme';
import type { NoteWithMeta } from '@/types';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FAB } from '@/components/FAB';
import { NoteCard } from '@/components/NoteCard';
import { IconButton, Segmented } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { folders, refresh, refreshCounts } = useApp();
  const toast = useToast();
  const [layout, setLayout] = useState<'list' | 'grid'>('list');

  const folder = folders.find((f) => f.id === id);

  const opts = useMemo(() => ({ status: 'active' as const, folderId: id }), [id]);
  const { notes, reload } = useNotes(opts, [id]);

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

  const handleTrash = useCallback(
    async (n: NoteWithMeta) => {
      await db.trashNote(n.id);
      toast.show('Moved to trash', { tone: 'danger' });
      await afterChange();
    },
    [afterChange, toast],
  );

  const handleArchive = useCallback(
    async (n: NoteWithMeta) => {
      await db.archiveNote(n.id);
      toast.show('Note archived', { tone: 'info' });
      await afterChange();
    },
    [afterChange, toast],
  );

  const accent = noteColorAccent(folder?.color, theme.colors.dark);

  return (
    <Screen>
      <Header
        onBack={() => router.back()}
        title={folder?.name ?? 'Space'}
        subtitle={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
        actions={
          <>
            <IconButton
              name={layout === 'grid' ? 'list' : 'grid'}
              onPress={() => {
                haptics.select();
                setLayout((l) => (l === 'list' ? 'grid' : 'list'));
              }}
            />
            <IconButton name="pricetags-outline" onPress={() => router.push('/tag/__all')} />
          </>
        }
      />

      <FlatList
        data={notes}
        key={layout}
        keyExtractor={(n) => n.id}
        numColumns={layout === 'grid' ? 2 : 1}
        columnWrapperStyle={layout === 'grid' ? { paddingHorizontal: theme.spacing.md } : undefined}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
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
              onPress={() => router.push(`/editor/${item.id}`)}
              onTogglePin={() => handleTogglePin(item)}
              onToggleFavorite={async () => {
                await db.patchNote(item.id, { favorite: item.favorite ? 0 : 1 });
                await afterChange();
              }}
              onArchive={() => handleArchive(item)}
              onTrash={() => handleTrash(item)}
            />
          </View>
        )}
        ListHeaderComponent={
          notes.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: theme.spacing.lg,
                paddingBottom: theme.spacing.md,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: accent + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={(folder?.icon || 'folder') as any} size={22} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="headline">{folder?.name}</AppText>
                <AppText variant="caption" tone="tertiary">
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'} in this space
                </AppText>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-outline"
            title="This space is empty"
            message="Add a note here and it will show up in this space."
            actionLabel="New note"
            onAction={() => router.push('/editor/new')}
          />
        }
      />

      <FAB onPress={() => router.push('/editor/new')} />
    </Screen>
  );
}

const styles = StyleSheet.create({});
