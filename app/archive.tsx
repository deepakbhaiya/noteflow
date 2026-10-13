import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp, useTheme } from '@/store/AppStore';
import { useNotes } from '@/hooks/useNotes';
import * as db from '@/db';
import type { NoteWithMeta } from '@/types';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { NoteCard } from '@/components/NoteCard';
import { useToast } from '@/components/Toast';

export default function ArchiveScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { refresh } = useApp();
  const toast = useToast();
  const { notes, reload } = useNotes({ status: 'archived' }, ['archived']);

  const after = useCallback(async () => {
    refresh();
    await reload();
  }, [refresh, reload]);

  const restore = useCallback(
    async (n: NoteWithMeta) => {
      await db.unarchiveNote(n.id);
      toast.show('Restored to notes', { tone: 'success' });
      await after();
    },
    [toast, after],
  );

  const trash = useCallback(
    async (n: NoteWithMeta) => {
      await db.trashNote(n.id);
      toast.show('Moved to trash', { tone: 'danger' });
      await after();
    },
    [toast, after],
  );

  return (
    <Screen>
      <Header
        onBack={() => router.back()}
        title="Archive"
        subtitle={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
      />
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ paddingBottom: 10 }}>
            <NoteCard
              note={item}
              layout="list"
              onPress={() => router.push(`/editor/${item.id}`)}
              onArchive={() => restore(item)}
              onTrash={() => trash(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="archive-outline"
            title="Nothing archived"
            message="Notes you archive are kept here, out of the way but never lost."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
