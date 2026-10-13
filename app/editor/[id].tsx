import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useApp, useTheme } from '@/store/AppStore';
import * as db from '@/db';
import { noteColorBg, noteColorAccent } from '@/theme';
import { haptics } from '@/lib/haptics';
import { relativeTime, reminderLabel, reminderPresets } from '@/lib/date';
import { countChecklist, readingTimeOf, toggleChecklistLine, wordCountOf } from '@/lib/text';
import { exportNote } from '@/lib/export';
import { scheduleNoteReminder } from '@/lib/notifications';
import type { Attachment, NoteWithMeta } from '@/types';
import { AppText } from '@/components/AppText';
import { Markdown } from '@/components/Markdown';
import { Sheet, ConfirmDialog } from '@/components/Sheet';
import { ColorSwatches, FolderPicker, TagPicker } from '@/components/Pickers';
import { IconButton, PressableScale, PrimaryButton, Divider } from '@/components/ui';
import { useToast } from '@/components/Toast';

const FORMAT_ACTIONS: {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}[] = [
  { key: 'bold', icon: 'text', label: 'Bold' },
  { key: 'italic', icon: 'text-outline', label: 'Italic' },
  { key: 'h1', icon: 'reorder-two', label: 'Title' },
  { key: 'h2', icon: 'reorder-three-outline', label: 'Heading' },
  { key: 'bullet', icon: 'list-outline', label: 'List' },
  { key: 'check', icon: 'checkbox-outline', label: 'Task' },
  { key: 'quote', icon: 'chatbox-ellipses-outline', label: 'Quote' },
  { key: 'code', icon: 'code-slash-outline', label: 'Code' },
  { key: 'rule', icon: 'remove-outline', label: 'Divider' },
];

export default function EditorScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const idParam = params.id ?? 'new';
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { refresh, folders, tags, refreshTags, refreshCounts, settings } = useApp();
  const toast = useToast();

  const [noteId, setNoteId] = useState<string | null>(idParam === 'new' ? null : idParam);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [colorId, setColorId] = useState('default');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [locked, setLocked] = useState(false);
  const [reminderAt, setReminderAt] = useState<number | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [sheet, setSheet] = useState<null | 'options' | 'color' | 'folder' | 'tags' | 'reminder'>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  const bodyRef = useRef<TextInput>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createdRef = useRef(false);

  /* ------------------------------------------------------------ bootstrap */
  useEffect(() => {
    let active = true;
    (async () => {
      if (idParam === 'new') {
        if (createdRef.current) return;
        createdRef.current = true;
        const created = await db.saveNote({ title: '', body: '', folderId: settings.defaultFolderId, colorId: 'default' });
        if (!active) return;
        setNoteId(created.id);
        setLoading(false);
        router.setParams({ id: created.id });
        return;
      }
      const n = await db.getNoteWithMeta(idParam);
      if (!active) return;
      if (!n) {
        setLoading(false);
        return;
      }
      setNoteId(n.id);
      setTitle(n.title);
      setBody(n.body);
      setColorId(n.colorId);
      setFolderId(n.folderId);
      setPinned(!!n.pinned);
      setFavorite(!!n.favorite);
      setLocked(!!n.locked);
      setReminderAt(n.reminderAt);
      setTagIds(n.tags.map((t) => t.id));
      setSavedAt(n.updatedAt);
      const atts = await db.getAttachments(n.id);
      if (active) setAttachments(atts);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  const persist = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!noteId) return;
      await db.saveNote({
        id: noteId,
        title,
        body,
        folderId,
        colorId,
        pinned,
        favorite,
        locked,
        reminderAt,
      });
      setSavedAt(Date.now());
      setDirty(false);
      if (!opts?.silent) refresh();
    },
    [noteId, title, body, folderId, colorId, pinned, favorite, locked, reminderAt, refresh],
  );

  /* ------------------------------------------------------------ autosave */
  useEffect(() => {
    if (!noteId || loading) return;
    setDirty(true);
    if (!settings.autoSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persist({ silent: true });
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, colorId, folderId, reminderAt, noteId, loading]);

  const close = useCallback(async () => {
    await persist({ silent: true });
    router.back();
  }, [persist, router]);

  /* --------------------------------------------------------- formatting */
  const applyFormat = useCallback(
    (key: string) => {
      const { start, end } = selection;
      const selected = body.slice(start, end);
      const before = body.slice(0, start);
      const after = body.slice(end);
      let next = body;
      let cursor = end;

      switch (key) {
        case 'bold':
          next = `${before}**${selected || 'bold'}**${after}`;
          cursor = start + (selected ? selected.length + 4 : 6);
          break;
        case 'italic':
          next = `${before}_${selected || 'italic'}_${after}`;
          cursor = start + (selected ? selected.length + 2 : 8);
          break;
        case 'h1':
          next = `${before}\n# ${selected}\n${after}`;
          break;
        case 'h2':
          next = `${before}\n## ${selected}\n${after}`;
          break;
        case 'bullet':
          next = `${before}\n- ${selected}\n${after}`;
          break;
        case 'check':
          next = `${before}\n- [ ] ${selected}\n${after}`;
          break;
        case 'quote':
          next = `${before}\n> ${selected}\n${after}`;
          break;
        case 'code':
          next = `${before}\n\`\`\`\n${selected}\n\`\`\`\n${after}`;
          break;
        case 'rule':
          next = `${before}\n---\n${after}`;
          break;
        default:
          return;
      }
      setBody(next);
      haptics.light();
      setTimeout(() => {
        setSelection({ start: cursor, end: cursor });
        bodyRef.current?.focus();
      }, 20);
    },
    [body, selection],
  );

  /* --------------------------------------------------------- attachments */
  const pickImage = useCallback(async () => {
    if (!noteId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.show('Photo access is needed to attach images', { tone: 'warning' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: 6,
    });
    if (result.canceled) return;
    for (const asset of result.assets) {
      const att = await db.addAttachment({
        noteId,
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        name: asset.fileName ?? 'image',
        width: asset.width ?? null,
        height: asset.height ?? null,
      });
      setAttachments((prev) => [...prev, att]);
    }
    toast.show('Image attached', { tone: 'success' });
    refresh();
  }, [noteId, toast, refresh]);

  const removeAttachment = useCallback(
    async (att: Attachment) => {
      await db.deleteAttachment(att.id);
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      refresh();
    },
    [refresh],
  );

  /* ------------------------------------------------------- meta actions */
  const toggleMeta = useCallback(
    async (key: 'pinned' | 'favorite' | 'locked') => {
      if (!noteId) return;
      const next = { pinned, favorite, locked };
      next[key] = !next[key];
      setPinned(next.pinned);
      setFavorite(next.favorite);
      setLocked(next.locked);
      await db.patchNote(noteId, { [key]: next[key] ? 1 : 0 } as any);
      haptics.light();
      refresh();
    },
    [noteId, pinned, favorite, locked, refresh],
  );

  const applyColor = useCallback(
    async (id: string) => {
      setColorId(id);
      if (noteId) await db.patchNote(noteId, { colorId: id });
      refresh();
    },
    [noteId, refresh],
  );

  const applyFolder = useCallback(
    async (id: string | null) => {
      setFolderId(id);
      if (noteId) await db.patchNote(noteId, { folderId: id });
      refreshCounts();
      refresh();
    },
    [noteId, refresh, refreshCounts],
  );

  const toggleTag = useCallback(
    async (tagId: string) => {
      const next = tagIds.includes(tagId) ? tagIds.filter((t) => t !== tagId) : [...tagIds, tagId];
      setTagIds(next);
      if (noteId) await db.setNoteTags(noteId, next);
      refresh();
    },
    [tagIds, noteId, refresh],
  );

  const createTag = useCallback(
    async (name: string) => {
      const tag = await db.ensureTag(name);
      await refreshTags();
      const next = [...tagIds, tag.id];
      setTagIds(next);
      if (noteId) await db.setNoteTags(noteId, next);
      refresh();
    },
    [tagIds, noteId, refresh, refreshTags],
  );

  const setReminder = useCallback(
    async (value: number | null) => {
      setReminderAt(value);
      if (noteId) {
        await db.patchNote(noteId, { reminderAt: value });
        if (value) {
          const ok = await scheduleNoteReminder(noteId, title || 'Note reminder', value);
          toast.show(ok ? 'Reminder set' : 'Enable notifications to get reminders', {
            tone: ok ? 'success' : 'warning',
          });
        }
      }
      refresh();
    },
    [noteId, title, toast, refresh],
  );

  const share = useCallback(async () => {
    if (!noteId) return;
    await persist({ silent: true });
    const n = await db.getNoteWithMeta(noteId);
    if (!n) return;
    const ok = await exportNote(n, 'md');
    if (!ok) toast.show('Sharing unavailable', { tone: 'warning' });
  }, [noteId, persist, toast]);

  const copyAll = useCallback(async () => {
    await Clipboard.setStringAsync(`${title}\n\n${body}`);
    toast.show('Copied to clipboard', { tone: 'success' });
  }, [title, body, toast]);

  const archive = useCallback(async () => {
    if (!noteId) return;
    await persist({ silent: true });
    await db.archiveNote(noteId);
    refresh();
    toast.show('Note archived', { tone: 'info' });
    router.back();
  }, [noteId, persist, refresh, toast, router]);

  const remove = useCallback(async () => {
    if (!noteId) return;
    await db.trashNote(noteId);
    refresh();
    toast.show('Moved to trash', { tone: 'danger' });
    router.back();
  }, [noteId, refresh, toast, router]);

  const handleToggleCheckbox = useCallback((line: number) => {
    setBody((prev) => toggleChecklistLine(prev, line));
    haptics.select();
  }, []);

  const words = useMemo(() => wordCountOf(body), [body]);
  const reading = useMemo(() => readingTimeOf(body), [body]);
  const checklist = useMemo(() => countChecklist(body), [body]);
  const bg = noteColorBg(colorId, theme.colors.dark);
  const accent = noteColorAccent(colorId, theme.colors.dark);

  const selectedFolder = folders.find((f) => f.id === folderId);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xs,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.sm,
            minHeight: 54,
          }}
        >
          <IconButton name="chevron-back" onPress={close} haptic="light" />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {selectedFolder ? (
              <PressableScale
                onPress={() => setSheet('folder')}
                haptic="select"
                scaleTo={0.94}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.scrim,
                }}
              >
                <Ionicons name={(selectedFolder.icon || 'folder') as any} size={12} color={theme.colors.textSecondary} />
                <AppText variant="micro" weight="semibold" tone="secondary">
                  {selectedFolder.name}
                </AppText>
              </PressableScale>
            ) : null}
            {savedAt ? (
              <AppText variant="micro" tone="tertiary">
                {dirty ? 'Saving…' : `Saved ${relativeTime(savedAt)}`}
              </AppText>
            ) : null}
          </View>
          <IconButton
            name={favorite ? 'star' : 'star-outline'}
            color={favorite ? '#EAAA08' : undefined}
            onPress={() => toggleMeta('favorite')}
          />
          <IconButton
            name={pinned ? 'pin' : 'pin-outline'}
            color={pinned ? accent : undefined}
            onPress={() => toggleMeta('pinned')}
          />
          <IconButton name="ellipsis-horizontal" onPress={() => setSheet('options')} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Mode toggle */}
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.sm,
          }}
        >
          <PressableScale
            onPress={() => setMode('edit')}
            haptic="select"
            scaleTo={0.96}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: theme.radius.pill,
              backgroundColor: mode === 'edit' ? theme.colors.accent : theme.colors.scrim,
            }}
          >
            <Ionicons name="create-outline" size={14} color={mode === 'edit' ? '#fff' : theme.colors.textSecondary} />
            <AppText variant="caption" weight="semibold" color={mode === 'edit' ? '#fff' : theme.colors.textSecondary}>
              Write
            </AppText>
          </PressableScale>
          <PressableScale
            onPress={() => setMode('preview')}
            haptic="select"
            scaleTo={0.96}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: theme.radius.pill,
              backgroundColor: mode === 'preview' ? theme.colors.accent : theme.colors.scrim,
            }}
          >
            <Ionicons name="eye-outline" size={14} color={mode === 'preview' ? '#fff' : theme.colors.textSecondary} />
            <AppText
              variant="caption"
              weight="semibold"
              color={mode === 'preview' ? '#fff' : theme.colors.textSecondary}
            >
              Preview
            </AppText>
          </PressableScale>
        </View>

        {/* Body */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.colors.textTertiary}
            style={{
              color: theme.colors.text,
              fontSize: theme.fontSize.largeTitle,
              fontWeight: theme.fontWeight.bold,
              letterSpacing: -0.5,
              paddingVertical: 6,
              marginBottom: 4,
            }}
            multiline
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: theme.spacing.md }}>
            <AppText variant="micro" tone="tertiary">
              {words} {words === 1 ? 'word' : 'words'} · {reading} min read
            </AppText>
            {checklist.total > 0 ? (
              <AppText variant="micro" weight="semibold" tone="tertiary">
                · {checklist.done}/{checklist.total} tasks
              </AppText>
            ) : null}
            {reminderAt ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="alarm" size={11} color={theme.colors.warning} />
                <AppText variant="micro" weight="semibold" style={{ color: theme.colors.warning }}>
                  {reminderLabel(reminderAt)}
                </AppText>
              </View>
            ) : null}
          </View>

          {attachments.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md, flexGrow: 0 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {attachments.map((a) => (
                  <PressableScale
                    key={a.id}
                    onLongPress={() => removeAttachment(a)}
                    haptic="none"
                    scaleTo={0.98}
                    style={{
                      width: 132,
                      height: 132,
                      borderRadius: theme.radius.md,
                      overflow: 'hidden',
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <Image source={{ uri: a.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </PressableScale>
                ))}
              </View>
            </ScrollView>
          ) : null}

          {mode === 'edit' ? (
            <TextInput
              ref={bodyRef}
              value={body}
              onChangeText={setBody}
              onSelectionChange={(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) =>
                setSelection(e.nativeEvent.selection)
              }
              placeholder="Start writing…  Markdown supported."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              textAlignVertical="top"
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSize.bodyLg,
                lineHeight: 25,
                minHeight: 340,
                paddingBottom: 40,
              }}
            />
          ) : (
            <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={{ paddingBottom: 40 }}>
              {body.trim() ? (
                <Markdown
                  content={body}
                  scale={1}
                  onToggleCheckbox={handleToggleCheckbox}
                  onTagPress={(t) => toast.show(`#${t}`, { tone: 'info' })}
                />
              ) : (
                <AppText variant="body" tone="tertiary">
                  Nothing to preview yet.
                </AppText>
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Formatting toolbar */}
        {mode === 'edit' ? (
          <View
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              paddingBottom: insets.bottom + 8,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: 6, paddingVertical: 10 }}
            >
              {FORMAT_ACTIONS.map((a) => (
                <PressableScale
                  key={a.key}
                  onPress={() => applyFormat(a.key)}
                  haptic="light"
                  scaleTo={0.9}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.surfaceAlt,
                  }}
                >
                  <Ionicons name={a.icon} size={18} color={theme.colors.textSecondary} />
                </PressableScale>
              ))}
              <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: 6 }} />
              <PressableScale
                onPress={pickImage}
                haptic="light"
                scaleTo={0.9}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surfaceAlt,
                }}
              >
                <Ionicons name="image-outline" size={18} color={theme.colors.textSecondary} />
              </PressableScale>
              <PressableScale
                onPress={() => setSheet('color')}
                haptic="light"
                scaleTo={0.9}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surfaceAlt,
                }}
              >
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: accent }} />
              </PressableScale>
              <PressableScale
                onPress={() => setSheet('tags')}
                haptic="light"
                scaleTo={0.9}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surfaceAlt,
                }}
              >
                <Ionicons name="pricetags-outline" size={18} color={theme.colors.textSecondary} />
              </PressableScale>
              <PressableScale
                onPress={() => setSheet('reminder')}
                haptic="light"
                scaleTo={0.9}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: reminderAt ? theme.colors.warning + '22' : theme.colors.surfaceAlt,
                }}
              >
                <Ionicons
                  name={reminderAt ? 'alarm' : 'alarm-outline'}
                  size={18}
                  color={reminderAt ? theme.colors.warning : theme.colors.textSecondary}
                />
              </PressableScale>
            </ScrollView>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      {/* Options sheet */}
      <Sheet visible={sheet === 'options'} onClose={() => setSheet(null)} title="Note options">
        <View style={{ paddingHorizontal: theme.spacing.lg, gap: 4 }}>
          <OptionRow icon="color-palette-outline" label="Colour" onPress={() => setSheet('color')} />
          <OptionRow
            icon="folder-outline"
            label="Move to space"
            value={selectedFolder?.name ?? 'None'}
            onPress={() => setSheet('folder')}
          />
          <OptionRow icon="pricetags-outline" label="Tags" value={`${tagIds.length} selected`} onPress={() => setSheet('tags')} />
          <OptionRow
            icon="alarm-outline"
            label="Reminder"
            value={reminderAt ? reminderLabel(reminderAt) : 'None'}
            onPress={() => setSheet('reminder')}
          />
          <OptionRow
            icon={locked ? 'lock-closed' : 'lock-open-outline'}
            label={locked ? 'Locked note' : 'Lock note'}
            onPress={() => {
              toggleMeta('locked');
              setSheet(null);
            }}
          />
          <Divider style={{ marginVertical: 6 }} />
          <OptionRow icon="share-outline" label="Share as Markdown" onPress={() => { setSheet(null); share(); }} />
          <OptionRow icon="copy-outline" label="Copy text" onPress={() => { setSheet(null); copyAll(); }} />
          <OptionRow icon="download-outline" label="Save changes" onPress={() => { setSheet(null); persist(); }} />
          <Divider style={{ marginVertical: 6 }} />
          <OptionRow icon="archive-outline" label="Archive note" onPress={() => { setSheet(null); archive(); }} />
          <OptionRow
            icon="trash-outline"
            label="Delete note"
            destructive
            onPress={() => {
              setSheet(null);
              setConfirmDelete(true);
            }}
          />
        </View>
      </Sheet>

      {/* Colour sheet */}
      <Sheet visible={sheet === 'color'} onClose={() => setSheet(null)} title="Note colour">
        <View style={{ paddingTop: theme.spacing.sm }}>
          <ColorSwatches value={colorId} onChange={applyColor} />
        </View>
      </Sheet>

      {/* Folder sheet */}
      <Sheet visible={sheet === 'folder'} onClose={() => setSheet(null)} title="Move to space">
        <View style={{ paddingTop: theme.spacing.sm }}>
          <FolderPicker folders={folders} value={folderId} onChange={applyFolder} />
        </View>
      </Sheet>

      {/* Tags sheet */}
      <Sheet visible={sheet === 'tags'} onClose={() => setSheet(null)} title="Tags">
        <View style={{ paddingTop: theme.spacing.sm }}>
          <TagPicker tags={tags} selectedIds={tagIds} onToggle={toggleTag} onCreate={createTag} />
        </View>
      </Sheet>

      {/* Reminder sheet */}
      <Sheet visible={sheet === 'reminder'} onClose={() => setSheet(null)} title="Remind me">
        <View style={{ paddingHorizontal: theme.spacing.lg, gap: 4 }}>
          {reminderPresets().map((p) => (
            <PressableScale
              key={p.label}
              onPress={() => {
                setReminder(p.value);
                setSheet(null);
              }}
              haptic="select"
              scaleTo={0.99}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.divider,
              }}
            >
              <Ionicons name="time-outline" size={19} color={theme.colors.accent} />
              <AppText variant="body" weight="medium" style={{ flex: 1 }}>
                {p.label}
              </AppText>
              <AppText variant="caption" tone="tertiary">
                {reminderLabel(p.value)}
              </AppText>
            </PressableScale>
          ))}
          {reminderAt ? (
            <PrimaryButton
              label="Remove reminder"
              variant="secondary"
              icon="close-circle-outline"
              onPress={() => {
                setReminder(null);
                setSheet(null);
              }}
              full
              style={{ marginTop: theme.spacing.lg }}
            />
          ) : null}
        </View>
      </Sheet>

      <ConfirmDialog
        visible={confirmDelete}
        title="Move note to trash?"
        message="You can restore it later from the trash."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          remove();
        }}
      />

      {loading ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />
      ) : null}
    </View>
  );
}

function OptionRow({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      scaleTo={0.99}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: destructive ? theme.colors.danger + '20' : theme.colors.accentSoft,
        }}
      >
        <Ionicons name={icon} size={18} color={destructive ? theme.colors.danger : theme.colors.accent} />
      </View>
      <AppText variant="body" weight="medium" color={destructive ? theme.colors.danger : undefined} style={{ flex: 1 }}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="footnote" tone="tertiary">
          {value}
        </AppText>
      ) : null}
      {!destructive ? <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({});
