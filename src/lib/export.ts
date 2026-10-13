/** Export helpers: plain text, markdown and JSON backups. */

import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import type { NoteWithMeta } from '@/types';
import { dateTime, longDate } from './date';

export function noteToMarkdown(note: NoteWithMeta): string {
  const lines: string[] = [];
  lines.push(`# ${note.title.trim() || 'Untitled'}`);
  lines.push('');
  const meta: string[] = [`Created ${dateTime(note.createdAt)}`, `Updated ${dateTime(note.updatedAt)}`];
  if (note.folder) meta.push(`Folder: ${note.folder.name}`);
  if (note.tags.length) meta.push(`Tags: ${note.tags.map((t) => `#${t.name}`).join(' ')}`);
  lines.push(`_${meta.join(' · ')}_`);
  lines.push('');
  lines.push(note.body);
  lines.push('');
  return lines.join('\n');
}

export function noteToPlainText(note: NoteWithMeta): string {
  return `${note.title.trim() || 'Untitled'}\n${'='.repeat(12)}\n\n${note.body}\n`;
}

export function notesToMarkdown(notes: NoteWithMeta[], title = 'NoteFlow export'): string {
  const head = `# ${title}\n\n_Exported ${longDate(Date.now())} · ${notes.length} notes_\n\n---\n\n`;
  return head + notes.map(noteToMarkdown).join('\n---\n\n');
}

export function notesToJson(notes: NoteWithMeta[]): string {
  return JSON.stringify(
    {
      app: 'NoteFlow',
      version: 1,
      exportedAt: new Date().toISOString(),
      count: notes.length,
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        folder: n.folder?.name ?? null,
        tags: n.tags.map((t) => t.name),
        color: n.colorId,
        pinned: !!n.pinned,
        favorite: !!n.favorite,
        locked: !!n.locked,
        reminderAt: n.reminderAt,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
    },
    null,
    2,
  );
}

async function writeTempFile(filename: string, contents: string): Promise<string> {
  const dir = new Directory(Paths.cache, 'exports');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
  return file.uri;
}

export async function shareText(filename: string, contents: string, mimeType = 'text/markdown'): Promise<boolean> {
  try {
    const uri = await writeTempFile(filename, contents);
    if (Platform.OS === 'web') return false;
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename });
    return true;
  } catch {
    return false;
  }
}

export function safeFilename(input: string): string {
  return (
    input
      .trim()
      .replace(/[^a-z0-9\-_ ]/gi, '')
      .replace(/\s+/g, '-')
      .slice(0, 48) || 'note'
  );
}

export async function exportNote(note: NoteWithMeta, format: 'md' | 'txt' = 'md'): Promise<boolean> {
  const name = `${safeFilename(note.title || 'note')}.${format}`;
  const contents = format === 'md' ? noteToMarkdown(note) : noteToPlainText(note);
  return shareText(name, contents, format === 'md' ? 'text/markdown' : 'text/plain');
}

export async function exportAll(notes: NoteWithMeta[], format: 'md' | 'json' = 'md'): Promise<boolean> {
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'json') {
    return shareText(`noteflow-backup-${stamp}.json`, notesToJson(notes), 'application/json');
  }
  return shareText(`noteflow-export-${stamp}.md`, notesToMarkdown(notes), 'text/markdown');
}
