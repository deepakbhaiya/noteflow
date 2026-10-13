import * as SQLite from 'expo-sqlite';
import type {
  Attachment,
  Folder,
  Note,
  NoteInput,
  NoteStatus,
  NoteWithMeta,
  Settings,
  SortKey,
  Tag,
} from '@/types';
import { defaultSettings } from '@/types';
import { uid } from '@/lib/id';
import { excerptFrom, countChecklist, wordCountOf } from '@/lib/text';

const DB_NAME = 'noteflow.db';
let db: SQLite.SQLiteDatabase | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'violet',
  icon TEXT NOT NULL DEFAULT 'folder',
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  color_id TEXT NOT NULL DEFAULT 'default',
  pinned INTEGER NOT NULL DEFAULT 0,
  favorite INTEGER NOT NULL DEFAULT 0,
  locked INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  reminder_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  trashed_at INTEGER
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'slate',
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY NOT NULL,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  uri TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  name TEXT NOT NULL DEFAULT '',
  width INTEGER,
  height INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_attachments_note ON attachments(note_id);
`;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(SCHEMA);
  return db;
}

/* ------------------------------------------------------------------ types */

interface NoteRow {
  id: string;
  title: string;
  body: string;
  folder_id: string | null;
  color_id: string;
  pinned: number;
  favorite: number;
  locked: number;
  status: NoteStatus;
  reminder_at: number | null;
  created_at: number;
  updated_at: number;
  trashed_at: number | null;
}

function rowToNote(r: NoteRow): Note {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    folderId: r.folder_id,
    colorId: r.color_id,
    pinned: r.pinned,
    favorite: r.favorite,
    locked: r.locked,
    status: r.status,
    reminderAt: r.reminder_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    trashedAt: r.trashed_at,
  };
}

/* ---------------------------------------------------------------- folders */

export async function getFolders(): Promise<Folder[]> {
  const d = await getDb();
  const rows = await d.getAllAsync<any>(
    'SELECT * FROM folders ORDER BY position ASC, name COLLATE NOCASE ASC',
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    icon: r.icon,
    position: r.position,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createFolder(name: string, color = 'violet', icon = 'folder'): Promise<Folder> {
  const d = await getDb();
  const now = Date.now();
  const max = await d.getFirstAsync<{ m: number | null }>('SELECT MAX(position) AS m FROM folders');
  const folder: Folder = {
    id: uid(),
    name: name.trim() || 'Untitled folder',
    color,
    icon,
    position: (max?.m ?? -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  await d.runAsync(
    'INSERT INTO folders (id, name, color, icon, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?)',
    [folder.id, folder.name, folder.color, folder.icon, folder.position, folder.createdAt, folder.updatedAt],
  );
  return folder;
}

export async function updateFolder(id: string, patch: Partial<Pick<Folder, 'name' | 'color' | 'icon'>>): Promise<void> {
  const d = await getDb();
  const sets: string[] = [];
  const args: any[] = [];
  if (patch.name !== undefined) {
    sets.push('name = ?');
    args.push(patch.name);
  }
  if (patch.color !== undefined) {
    sets.push('color = ?');
    args.push(patch.color);
  }
  if (patch.icon !== undefined) {
    sets.push('icon = ?');
    args.push(patch.icon);
  }
  if (!sets.length) return;
  sets.push('updated_at = ?');
  args.push(Date.now(), id);
  await d.runAsync(`UPDATE folders SET ${sets.join(', ')} WHERE id = ?`, args);
}

export async function deleteFolder(id: string): Promise<void> {
  const d = await getDb();
  await d.runAsync('UPDATE notes SET folder_id = NULL WHERE folder_id = ?', [id]);
  await d.runAsync('DELETE FROM folders WHERE id = ?', [id]);
}

/* ------------------------------------------------------------------- tags */

export async function getTags(): Promise<Tag[]> {
  const d = await getDb();
  const rows = await d.getAllAsync<any>('SELECT * FROM tags ORDER BY name COLLATE NOCASE ASC');
  return rows.map((r) => ({ id: r.id, name: r.name, color: r.color, createdAt: r.created_at }));
}

export async function ensureTag(name: string, color = 'slate'): Promise<Tag> {
  const d = await getDb();
  const clean = name.trim().replace(/^#/, '');
  const existing = await d.getFirstAsync<any>(
    'SELECT * FROM tags WHERE name = ? COLLATE NOCASE',
    [clean],
  );
  if (existing) {
    return { id: existing.id, name: existing.name, color: existing.color, createdAt: existing.created_at };
  }
  const tag: Tag = { id: uid(), name: clean, color, createdAt: Date.now() };
  await d.runAsync('INSERT INTO tags (id, name, color, created_at) VALUES (?,?,?,?)', [
    tag.id,
    tag.name,
    tag.color,
    tag.createdAt,
  ]);
  return tag;
}

export async function updateTag(id: string, patch: Partial<Pick<Tag, 'name' | 'color'>>): Promise<void> {
  const d = await getDb();
  const sets: string[] = [];
  const args: any[] = [];
  if (patch.name !== undefined) {
    sets.push('name = ?');
    args.push(patch.name.trim().replace(/^#/, ''));
  }
  if (patch.color !== undefined) {
    sets.push('color = ?');
    args.push(patch.color);
  }
  if (!sets.length) return;
  args.push(id);
  await d.runAsync(`UPDATE tags SET ${sets.join(', ')} WHERE id = ?`, args);
}

export async function deleteTag(id: string): Promise<void> {
  const d = await getDb();
  await d.runAsync('DELETE FROM note_tags WHERE tag_id = ?', [id]);
  await d.runAsync('DELETE FROM tags WHERE id = ?', [id]);
}

export async function getNoteTags(noteId: string): Promise<Tag[]> {
  const d = await getDb();
  const rows = await d.getAllAsync<any>(
    `SELECT t.* FROM tags t JOIN note_tags nt ON nt.tag_id = t.id WHERE nt.note_id = ? ORDER BY t.name COLLATE NOCASE`,
    [noteId],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, color: r.color, createdAt: r.created_at }));
}

export async function setNoteTags(noteId: string, tagIds: string[]): Promise<void> {
  const d = await getDb();
  await d.runAsync('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
  for (const tid of tagIds) {
    await d.runAsync('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?,?)', [noteId, tid]);
  }
}

export async function getTagUsage(): Promise<Record<string, number>> {
  const d = await getDb();
  const rows = await d.getAllAsync<{ tag_id: string; c: number }>(
    'SELECT tag_id, COUNT(*) AS c FROM note_tags GROUP BY tag_id',
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.tag_id] = r.c;
  return out;
}

/* ------------------------------------------------------------------ notes */

export interface ListOptions {
  status?: NoteStatus;
  folderId?: string | null;
  tagId?: string | null;
  query?: string;
  favoritesOnly?: boolean;
  pinnedOnly?: boolean;
  remindersOnly?: boolean;
  lockedOnly?: boolean;
  checklistsOnly?: boolean;
  sort?: SortKey;
  ascending?: boolean;
  limit?: number;
  offset?: number;
}

export async function listNotes(opts: ListOptions = {}): Promise<Note[]> {
  const d = await getDb();
  const where: string[] = [];
  const args: any[] = [];

  where.push('n.status = ?');
  args.push(opts.status ?? 'active');

  if (opts.folderId) {
    where.push('n.folder_id = ?');
    args.push(opts.folderId);
  }
  if (opts.tagId) {
    where.push('EXISTS (SELECT 1 FROM note_tags nt WHERE nt.note_id = n.id AND nt.tag_id = ?)');
    args.push(opts.tagId);
  }
  if (opts.query && opts.query.trim()) {
    const q = `%${opts.query.trim().toLowerCase()}%`;
    where.push('(LOWER(n.title) LIKE ? OR LOWER(n.body) LIKE ?)');
    args.push(q, q);
  }
  if (opts.favoritesOnly) where.push('n.favorite = 1');
  if (opts.pinnedOnly) where.push('n.pinned = 1');
  if (opts.lockedOnly) where.push('n.locked = 1');
  if (opts.remindersOnly) where.push('n.reminder_at IS NOT NULL');
  if (opts.checklistsOnly) where.push("n.body LIKE '%- [%'");

  const dir = opts.ascending ? 'ASC' : 'DESC';
  let order = `n.pinned DESC, n.updated_at ${dir}`;
  switch (opts.sort) {
    case 'created':
      order = `n.pinned DESC, n.created_at ${dir}`;
      break;
    case 'title':
      order = `n.pinned DESC, n.title COLLATE NOCASE ${opts.ascending ? 'ASC' : 'DESC'}`;
      break;
    case 'manual':
      order = `n.pinned DESC, n.created_at ${dir}`;
      break;
    default:
      order = `n.pinned DESC, n.updated_at ${dir}`;
  }

  const limitClause = opts.limit ? ` LIMIT ${opts.limit} OFFSET ${opts.offset ?? 0}` : '';
  const sql = `SELECT n.* FROM notes n WHERE ${where.join(' AND ')} ORDER BY ${order}${limitClause}`;
  const rows = await d.getAllAsync<NoteRow>(sql, args);
  return rows.map(rowToNote);
}

export async function getNote(id: string): Promise<Note | null> {
  const d = await getDb();
  const r = await d.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', [id]);
  return r ? rowToNote(r) : null;
}

export async function getNoteWithMeta(id: string): Promise<NoteWithMeta | null> {
  const note = await getNote(id);
  if (!note) return null;
  return { ...note, ...(await metaFor(note)) };
}

async function metaFor(note: Note): Promise<Omit<NoteWithMeta, keyof Note>> {
  const d = await getDb();
  const [tags, folder, att] = await Promise.all([
    getNoteTags(note.id),
    note.folderId
      ? d.getFirstAsync<any>('SELECT * FROM folders WHERE id = ?', [note.folderId])
      : Promise.resolve(null),
    d.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM attachments WHERE note_id = ?', [note.id]),
  ]);
  const cl = countChecklist(note.body);
  return {
    tags,
    folder: folder
      ? {
          id: folder.id,
          name: folder.name,
          color: folder.color,
          icon: folder.icon,
          position: folder.position,
          createdAt: folder.created_at,
          updatedAt: folder.updated_at,
        }
      : null,
    attachmentCount: att?.c ?? 0,
    checklistTotal: cl.total,
    checklistDone: cl.done,
    excerpt: excerptFrom(note.body, 160),
    wordCount: wordCountOf(note.body),
  };
}

export async function listNotesWithMeta(opts: ListOptions = {}): Promise<NoteWithMeta[]> {
  const notes = await listNotes(opts);
  return Promise.all(notes.map(async (n) => ({ ...n, ...(await metaFor(n)) })));
}

export async function saveNote(input: NoteInput): Promise<Note> {
  const d = await getDb();
  const now = Date.now();
  if (input.id) {
    const existing = await getNote(input.id);
    if (existing) {
      await d.runAsync(
        `UPDATE notes SET title=?, body=?, folder_id=?, color_id=?, pinned=?, favorite=?, locked=?, status=?, reminder_at=?, updated_at=? WHERE id=?`,
        [
          input.title,
          input.body,
          input.folderId,
          input.colorId,
          (input.pinned ?? !!existing.pinned) ? 1 : 0,
          (input.favorite ?? !!existing.favorite) ? 1 : 0,
          (input.locked ?? !!existing.locked) ? 1 : 0,
          input.status ?? existing.status,
          input.reminderAt === undefined ? existing.reminderAt : input.reminderAt,
          now,
          input.id,
        ],
      );
      return { ...existing, title: input.title, body: input.body, updatedAt: now };
    }
  }
  const note: Note = {
    id: input.id ?? uid(),
    title: input.title,
    body: input.body,
    folderId: input.folderId,
    colorId: input.colorId,
    pinned: input.pinned ? 1 : 0,
    favorite: input.favorite ? 1 : 0,
    locked: input.locked ? 1 : 0,
    status: input.status ?? 'active',
    reminderAt: input.reminderAt ?? null,
    createdAt: now,
    updatedAt: now,
    trashedAt: null,
  };
  await d.runAsync(
    `INSERT INTO notes (id,title,body,folder_id,color_id,pinned,favorite,locked,status,reminder_at,created_at,updated_at,trashed_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      note.id,
      note.title,
      note.body,
      note.folderId,
      note.colorId,
      note.pinned,
      note.favorite,
      note.locked,
      note.status,
      note.reminderAt,
      note.createdAt,
      note.updatedAt,
      note.trashedAt,
    ],
  );
  return note;
}

export async function patchNote(id: string, patch: Partial<Note>): Promise<void> {
  const d = await getDb();
  const map: Record<string, string> = {
    title: 'title',
    body: 'body',
    folderId: 'folder_id',
    colorId: 'color_id',
    pinned: 'pinned',
    favorite: 'favorite',
    locked: 'locked',
    status: 'status',
    reminderAt: 'reminder_at',
    trashedAt: 'trashed_at',
  };
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, col] of Object.entries(map)) {
    if (k in patch) {
      sets.push(`${col} = ?`);
      args.push((patch as any)[k]);
    }
  }
  if (!sets.length) return;
  sets.push('updated_at = ?');
  args.push(Date.now(), id);
  await d.runAsync(`UPDATE notes SET ${sets.join(', ')} WHERE id = ?`, args);
}

export async function trashNote(id: string): Promise<void> {
  const d = await getDb();
  await d.runAsync("UPDATE notes SET status='trashed', trashed_at=?, updated_at=? WHERE id=?", [
    Date.now(),
    Date.now(),
    id,
  ]);
}

export async function restoreNote(id: string): Promise<void> {
  const d = await getDb();
  await d.runAsync("UPDATE notes SET status='active', trashed_at=NULL, updated_at=? WHERE id=?", [
    Date.now(),
    id,
  ]);
}

export async function archiveNote(id: string): Promise<void> {
  const d = await getDb();
  await d.runAsync("UPDATE notes SET status='archived', updated_at=? WHERE id=?", [Date.now(), id]);
}

export async function unarchiveNote(id: string): Promise<void> {
  const d = await getDb();
  await d.runAsync("UPDATE notes SET status='active', updated_at=? WHERE id=?", [Date.now(), id]);
}

export async function deleteNoteForever(id: string): Promise<void> {
  const d = await getDb();
  await d.runAsync('DELETE FROM attachments WHERE note_id = ?', [id]);
  await d.runAsync('DELETE FROM note_tags WHERE note_id = ?', [id]);
  await d.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}

export async function emptyTrash(): Promise<void> {
  const d = await getDb();
  await d.runAsync(
    'DELETE FROM attachments WHERE note_id IN (SELECT id FROM notes WHERE status = ?)',
    ['trashed'],
  );
  await d.runAsync('DELETE FROM note_tags WHERE note_id IN (SELECT id FROM notes WHERE status = ?)', [
    'trashed',
  ]);
  await d.runAsync('DELETE FROM notes WHERE status = ?', ['trashed']);
}

/* ------------------------------------------------------------ attachments */

export async function getAttachments(noteId: string): Promise<Attachment[]> {
  const d = await getDb();
  const rows = await d.getAllAsync<any>(
    'SELECT * FROM attachments WHERE note_id = ? ORDER BY created_at ASC',
    [noteId],
  );
  return rows.map((r) => ({
    id: r.id,
    noteId: r.note_id,
    uri: r.uri,
    mimeType: r.mime_type,
    name: r.name,
    width: r.width,
    height: r.height,
    createdAt: r.created_at,
  }));
}

export async function addAttachment(a: Omit<Attachment, 'id' | 'createdAt'>): Promise<Attachment> {
  const d = await getDb();
  const att: Attachment = { ...a, id: uid(), createdAt: Date.now() };
  await d.runAsync(
    'INSERT INTO attachments (id,note_id,uri,mime_type,name,width,height,created_at) VALUES (?,?,?,?,?,?,?,?)',
    [att.id, att.noteId, att.uri, att.mimeType, att.name, att.width, att.height, att.createdAt],
  );
  return att;
}

export async function deleteAttachment(id: string): Promise<void> {
  const d = await getDb();
  await d.runAsync('DELETE FROM attachments WHERE id = ?', [id]);
}

/* --------------------------------------------------------------- settings */

export async function getSettings(): Promise<Settings> {
  const d = await getDb();
  const rows = await d.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings');
  const map: Record<string, any> = {};
  for (const r of rows) {
    try {
      map[r.key] = JSON.parse(r.value);
    } catch {
      map[r.key] = r.value;
    }
  }
  return { ...defaultSettings, ...map };
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  const d = await getDb();
  await d.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)', [
    key as string,
    JSON.stringify(value),
  ]);
}

/* ------------------------------------------------------------------ stats */

export interface Stats {
  total: number;
  active: number;
  archived: number;
  trashed: number;
  favorites: number;
  pinned: number;
  locked: number;
  folders: number;
  tags: number;
  words: number;
  checklistsDone: number;
  checklistsTotal: number;
  attachments: number;
  /** notes created, last 7 days (oldest -> newest) */
  activity: number[];
}

export async function getStats(): Promise<Stats> {
  const d = await getDb();
  const one = async (sql: string, args: any[] = []) =>
    (await d.getFirstAsync<{ c: number }>(sql, args))?.c ?? 0;

  const total = await one('SELECT COUNT(*) AS c FROM notes');
  const active = await one("SELECT COUNT(*) AS c FROM notes WHERE status='active'");
  const archived = await one("SELECT COUNT(*) AS c FROM notes WHERE status='archived'");
  const trashed = await one("SELECT COUNT(*) AS c FROM notes WHERE status='trashed'");
  const favorites = await one("SELECT COUNT(*) AS c FROM notes WHERE favorite=1 AND status='active'");
  const pinned = await one("SELECT COUNT(*) AS c FROM notes WHERE pinned=1 AND status='active'");
  const locked = await one('SELECT COUNT(*) AS c FROM notes WHERE locked=1');
  const folders = await one('SELECT COUNT(*) AS c FROM folders');
  const tags = await one('SELECT COUNT(*) AS c FROM tags');
  const attachments = await one('SELECT COUNT(*) AS c FROM attachments');

  const bodies = await d.getAllAsync<{ body: string }>('SELECT body FROM notes');
  let words = 0;
  let checklistsDone = 0;
  let checklistsTotal = 0;
  for (const b of bodies) {
    words += wordCountOf(b.body);
    const cl = countChecklist(b.body);
    checklistsDone += cl.done;
    checklistsTotal += cl.total;
  }

  const activity: number[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const start = day.getTime();
    const end = start + 24 * 60 * 60 * 1000;
    activity.push(await one('SELECT COUNT(*) AS c FROM notes WHERE created_at >= ? AND created_at < ?', [start, end]));
  }

  return {
    total,
    active,
    archived,
    trashed,
    favorites,
    pinned,
    locked,
    folders,
    tags,
    words,
    checklistsDone,
    checklistsTotal,
    attachments,
    activity,
  };
}

export async function countsByFolder(): Promise<Record<string, number>> {
  const d = await getDb();
  const rows = await d.getAllAsync<{ folder_id: string | null; c: number }>(
    "SELECT folder_id, COUNT(*) AS c FROM notes WHERE status='active' GROUP BY folder_id",
  );
  const out: Record<string, number> = { _all: 0 };
  for (const r of rows) {
    if (r.folder_id) out[r.folder_id] = r.c;
    out._all += r.c;
  }
  return out;
}

/* ------------------------------------------------------------------- seed */

export async function seedIfEmpty(): Promise<void> {
  const d = await getDb();
  const c = (await d.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM notes'))?.c ?? 0;
  const settings = await getSettings();
  if (c > 0 || settings.onboardingDone) return;

  const now = Date.now();
  const work = await createFolder('Work', 'blue', 'briefcase');
  const personal = await createFolder('Personal', 'green', 'heart');
  const ideas = await createFolder('Ideas', 'violet', 'bulb');

  const n1 = await saveNote({
    title: 'Welcome to NoteFlow ✨',
    body: `# Welcome to NoteFlow

A calm, powerful home for everything you think.

## What you can do
- [x] Write rich **markdown** notes
- [x] Organize with folders and tags
- [ ] Pin what matters
- [ ] Set reminders

> Tip: swipe a note to pin, archive or delete it.

Stay in flow.`,
    folderId: personal.id,
    colorId: 'violet',
    pinned: true,
    favorite: true,
  });

  const n2 = await saveNote({
    title: 'Product roadmap — Q4',
    body: `## Q4 Goals
1. Ship onboarding v2
2. Reduce cold start to < 1.2s
3. Offline-first sync

### Metrics
- Activation: 62% -> 75%
- Retention D7: 28% -> 35%

- [ ] Draft spec
- [x] User interviews
- [ ] Design review`,
    folderId: work.id,
    colorId: 'blue',
  });

  await saveNote({
    title: 'Books to read',
    body: `- Deep Work — Cal Newport
- The Almanack of Naval Ravikant
- Thinking in Systems`,
    folderId: ideas.id,
    colorId: 'yellow',
  });

  const n4 = await saveNote({
    title: 'Weekly groceries',
    body: `- [x] Oat milk
- [ ] Blueberries
- [ ] Sourdough
- [ ] Olive oil`,
    folderId: personal.id,
    colorId: 'green',
  });

  const t1 = await ensureTag('important', 'red');
  const t2 = await ensureTag('product', 'blue');
  const t3 = await ensureTag('reading', 'amber');
  await setNoteTags(n1.id, [t1.id]);
  await setNoteTags(n2.id, [t1.id, t2.id]);
  await setNoteTags(n4.id, []);

  await saveNote({
    title: 'Meeting notes — Thu',
    body: `Present: Aria, Sam, Kai

Decisions
- Go with SQLite + WAL
- Ship weekly

Action items
- [ ] Aria: scope the sync layer
- [ ] Sam: perf budget
- [ ] Kai: empty states`,
    folderId: work.id,
    colorId: 'slate',
  });
  void t3;
  void now;
}
