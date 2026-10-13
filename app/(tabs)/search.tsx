import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useTheme } from '@/store/AppStore';
import { useNotes } from '@/hooks/useNotes';
import type { NoteStatus } from '@/types';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Header } from '@/components/Header';
import { SearchBar, ResultCount } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { NoteCard } from '@/components/NoteCard';
import { Chip, PressableScale } from '@/components/ui';

type Scope = 'active' | 'archived' | 'trashed';

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'active', label: 'Notes' },
  { key: 'archived', label: 'Archive' },
  { key: 'trashed', label: 'Trash' },
];

const SUGGESTIONS = ['meeting', 'idea', 'todo', 'recipe', 'travel', 'budget'];

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { tags } = useApp();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('active');
  const [tagId, setTagId] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // keep state when returning; nothing to clean
      };
    }, []),
  );

  const opts = useMemo(
    () => ({
      status: scope as NoteStatus,
      query: query.trim() || undefined,
      tagId: tagId ?? undefined,
    }),
    [scope, query, tagId],
  );

  const { notes } = useNotes(opts, [scope, query, tagId]);

  return (
    <Screen>
      <Header title="Search" subtitle="Find anything, instantly" />

      <View style={{ paddingHorizontal: theme.spacing.lg, gap: 12 }}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search titles and content…"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={false}
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {SCOPES.map((s) => (
            <Chip
              key={s.key}
              label={s.label}
              active={scope === s.key}
              small
              onPress={() => setScope(s.key)}
            />
          ))}
        </View>

        {tags.length > 0 ? (
          <FlatList
            horizontal
            data={[{ id: '__none', name: 'All tags' }, ...tags]}
            keyExtractor={(t) => t.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            style={{ flexGrow: 0 }}
            renderItem={({ item }) => {
              const isNone = item.id === '__none';
              const active = isNone ? tagId === null : tagId === item.id;
              return (
                <Chip
                  label={isNone ? 'All tags' : `#${item.name}`}
                  active={active}
                  small
                  onPress={() => setTagId(isNone ? null : item.id)}
                />
              );
            }}
          />
        ) : null}
      </View>

      <ResultCount count={notes.length} query={query} />

      {!query.trim() && !focused ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
          <AppText variant="caption" weight="bold" tone="tertiary" style={{ letterSpacing: 0.8, marginBottom: 10 }}>
            TRY SEARCHING
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <PressableScale
                key={s}
                onPress={() => setQuery(s)}
                haptic="select"
                scaleTo={0.94}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.surfaceAlt,
                }}
              >
                <Ionicons name="search" size={13} color={theme.colors.textTertiary} />
                <AppText variant="footnote" tone="secondary">
                  {s}
                </AppText>
              </PressableScale>
            ))}
          </View>
        </View>
      ) : null}

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 140, paddingTop: 4 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ paddingBottom: 10 }}>
            <NoteCard
              note={item}
              layout="list"
              query={query}
              hideSwipe
              onPress={() => router.push(`/editor/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          query.trim() ? (
            <EmptyState
              icon="search-outline"
              title="No results"
              message={`Nothing matched “${query.trim()}” in ${scope === 'active' ? 'notes' : scope}.`}
              compact
            />
          ) : (
            <EmptyState
              icon="text-outline"
              title="Search your library"
              message="Type a word to search across titles and note content."
              compact
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
