import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp, useTheme } from '@/store/AppStore';
import { useNotes } from '@/hooks/useNotes';
import * as db from '@/db';
import type { NoteWithMeta } from '@/types';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { NoteCard } from '@/components/NoteCard';
import { IconButton } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function TagScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { tags, refresh, refreshTags } = useApp();
  const toast = useToast();

  const tag = tags.find((t) => t.id === id);
  const opts = useMemo(() => ({ status: 'active' as const, tagId: id }), [id]);
  const { notes, reload } = useNotes(opts, [id]);

  const afterChange = useCallback(async () => {
    refresh();
    await reload();
  }, [refresh, reload]);

  const removeTag = useCallback(async () => {
    if (!tag) return;
    await db.deleteTag(tag.id);
    await refreshTags();
    refresh();
    toast.show('Tag deleted', { tone: 'neutral' as any });
    router.back();
  }, [tag, refreshTags, refresh, toast, router]);

  return (
    <Screen>
      <Header
        onBack={() => router.back()}
        title={tag ? `#${tag.name}` : 'Tag'}
        subtitle={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
        actions={<IconButton name="trash-outline" onPress={removeTag} />}
      />

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 80, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: NoteWithMeta }) => (
          <View style={{ paddingBottom: 10 }}>
            <NoteCard note={item} layout="list" onPress={() => router.push(`/editor/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="pricetag-outline"
            title="No notes with this tag"
            message="Tag notes with #hashtags inside the editor to organise them."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
