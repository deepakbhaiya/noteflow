export type NoteColorId =
  | 'default'
  | 'violet'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'lime'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'pink'
  | 'purple'
  | 'slate';

export type NoteStatus = 'active' | 'archived' | 'trashed';

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: number;
  /** Optional per-tag accent color id. */
  color: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  folderId: string | null;
  colorId: NoteColorId | string;
  pinned: number; // 0 | 1
  favorite: number; // 0 | 1
  locked: number; // 0 | 1
  status: NoteStatus;
  reminderAt: number | null;
  createdAt: number;
  updatedAt: number;
  trashedAt: number | null;
}

export interface NoteWithMeta extends Note {
  tags: Tag[];
  folder: Folder | null;
  attachmentCount: number;
  checklistTotal: number;
  checklistDone: number;
  excerpt: string;
  wordCount: number;
}

export interface Attachment {
  id: string;
  noteId: string;
  uri: string;
  mimeType: string;
  name: string;
  width: number | null;
  height: number | null;
  createdAt: number;
}

export interface NoteInput {
  id?: string;
  title: string;
  body: string;
  folderId: string | null;
  colorId: string;
  pinned?: boolean;
  favorite?: boolean;
  locked?: boolean;
  status?: NoteStatus;
  reminderAt?: number | null;
}

export type SortKey = 'updated' | 'created' | 'title' | 'manual';
export type LayoutMode = 'list' | 'grid' | 'compact';

export interface Settings {
  themeMode: 'system' | 'light' | 'dark';
  accentId: string;
  layout: LayoutMode;
  sort: SortKey;
  sortAscending: boolean;
  fontSizeScale: number;
  hapticsEnabled: boolean;
  appLockEnabled: boolean;
  appLockBiometric: boolean;
  showPreview: boolean;
  autoSave: boolean;
  defaultFolderId: string | null;
  onboardingDone: boolean;
}

export const defaultSettings: Settings = {
  themeMode: 'system',
  accentId: 'brand',
  layout: 'list',
  sort: 'updated',
  sortAscending: false,
  fontSizeScale: 1,
  hapticsEnabled: true,
  appLockEnabled: false,
  appLockBiometric: true,
  showPreview: true,
  autoSave: true,
  defaultFolderId: null,
  onboardingDone: false,
};

export type FilterKey =
  | 'all'
  | 'favorites'
  | 'pinned'
  | 'reminders'
  | 'locked'
  | 'checklists';

export interface NoteFilterState {
  key: FilterKey;
  folderId: string | null;
  tagId: string | null;
  query: string;
}
