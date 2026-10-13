import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useTheme } from '@/store/AppStore';
import { useNotes } from '@/hooks/useNotes';
import * as db from '@/db';
import type { NoteWithMeta } from '@/types';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { NoteCard } from '@/components/NoteCard';
import { IconButton, PressableScale } from '@/components/ui';
import { ConfirmDialog } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { dayLabel } from '@/lib/date';

export default function TrashScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { refresh } = useApp();
  const toast = useToast();
  const { notes, reload } = useNotes({ status: 'trashed' }, ['trashed']);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const after = useCallback(async () => {
    refresh();
    await reload();
  }, [refresh, reload]);

  const restore = useCallback(
    async (n: NoteWithMeta) => {
      await db.restoreNote(n.id);
      toast.show('Note restored', { tone: 'success' });
      await after();
    },
    [toast, after],
  );

  const purge = useCallback(
    async (n: NoteWithMeta) => {
      await db.deleteNoteForever(n.id);
      toast.show('Deleted forever', { tone: 'danger' });
      await after();
    },
    [toast, after],
  );

  return (
    <Screen>
      <Header
        onBack={() => router.back()}
        title="Trash"
        subtitle={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
        actions={
          notes.length > 0 ? (
            <PressableScale onPress={() => setConfirmEmpty(true)} haptic="medium" scaleTo={0.94}>
              <AppText variant="footnote" weight="semibold" tone="danger">
                Empty
              </AppText>
            </PressableScale>
          ) : undefined
        }
      />

      {notes.length > 0 ? (
        <View
          style={{
            marginHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: theme.colors.danger + '14',
            borderRadius: theme.radius.md,
            padding: 12,
          }}
        >
          <Ionicons name="information-circle-outline" size={17} color={theme.colors.danger} />
          <AppText variant="caption" style={{ flex: 1, color: theme.colors.danger }}>
            Notes in trash are kept until you empty it.
          </AppText>
        </View>
      ) : null}

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
              onTrash={() => purge(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="trash-outline"
            title="Trash is empty"
            message="Deleted notes land here first, so you can always change your mind."
          />
        }
      />

      <ConfirmDialog
        visible={confirmEmpty}
        title="Permanently delete all?"
        message={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'} will be erased. This cannot be undone.`}
        confirmLabel="Empty trash"
        destructive
        onCancel={() => setConfirmEmpty(false)}
        onConfirm={async () => {
          setConfirmEmpty(false);
          await db.emptyTrash();
          toast.show('Trash emptied', { tone: 'success' });
          await after();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
