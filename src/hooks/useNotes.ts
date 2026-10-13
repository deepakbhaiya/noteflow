import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as db from '@/db';
import type { NoteWithMeta } from '@/types';
import { useApp } from '@/store/AppStore';

export interface UseNotesOptions extends db.ListOptions {}

/** Loads notes with metadata and refreshes on focus or data revision change. */
export function useNotes(opts: UseNotesOptions = {}, deps: unknown[] = []) {
  const { revision } = useApp();
  const [notes, setNotes] = useState<NoteWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const rows = await db.listNotesWithMeta(opts);
    setNotes(rows);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, ...deps]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const rows = await db.listNotesWithMeta(opts);
        if (active) {
          setNotes(rows);
          setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [revision, ...deps]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    load();
  }, [load]);

  return { notes, loading, reload: load, setNotes };
}

/** Loads a single note with metadata. */
export function useNote(id: string | null) {
  const { revision } = useApp();
  const [note, setNote] = useState<NoteWithMeta | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) {
        setNote(null);
        setLoading(false);
        return;
      }
      const n = await db.getNoteWithMeta(id);
      if (active) {
        setNote(n);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, revision]);

  return { note, loading };
}
