import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import * as db from '@/db';
import { defaultSettings, type Folder, type Settings, type Tag } from '@/types';
import { makeTheme, type Theme } from '@/theme';
import { setHapticsEnabled } from '@/lib/haptics';
import { ensureNotificationsConfigured } from '@/lib/notifications';

interface AppContextValue {
  ready: boolean;
  settings: Settings;
  folders: Folder[];
  tags: Tag[];
  counts: Record<string, number>;
  /** Increments whenever note/folder/tag data changes. Drives list refreshes. */
  revision: number;
  setSettings: (patch: Partial<Settings>) => Promise<void>;
  refresh: () => void;
  refreshFolders: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshCounts: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);
const ThemeContext = createContext<Theme>(makeTheme('light'));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [revision, setRevision] = useState(0);
  const mounted = useRef(true);

  const refresh = useCallback(() => setRevision((r) => r + 1), []);

  const refreshFolders = useCallback(async () => {
    const f = await db.getFolders();
    if (mounted.current) setFolders(f);
  }, []);

  const refreshTags = useCallback(async () => {
    const t = await db.getTags();
    if (mounted.current) setTags(t);
  }, []);

  const refreshCounts = useCallback(async () => {
    const c = await db.countsByFolder();
    if (mounted.current) setCounts(c);
  }, []);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      await db.getDb();
      const [s] = await Promise.all([db.getSettings()]);
      await db.seedIfEmpty();
      await Promise.all([refreshFolders(), refreshTags(), refreshCounts()]);
      if (mounted.current) {
        setSettingsState(s);
        setHapticsEnabled(s.hapticsEnabled);
        setReady(true);
        if (s.themeMode !== 'light') {
          ensureNotificationsConfigured().catch(() => {});
        }
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [refreshFolders, refreshTags, refreshCounts]);

  const setSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettingsState(next);
      if (patch.hapticsEnabled !== undefined) setHapticsEnabled(patch.hapticsEnabled);
      await Promise.all(
        Object.entries(patch).map(([k, v]) => db.setSetting(k as keyof Settings, v as never)),
      );
    },
    [settings],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      settings,
      folders,
      tags,
      counts,
      revision,
      setSettings,
      refresh,
      refreshFolders,
      refreshTags,
      refreshCounts,
    }),
    [ready, settings, folders, tags, counts, revision, setSettings, refresh, refreshFolders, refreshTags, refreshCounts],
  );

  const systemScheme = useColorScheme();
  const theme = useMemo(() => {
    const mode =
      settings.themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : settings.themeMode;
    return makeTheme(mode);
  }, [settings.themeMode, systemScheme]);

  return (
    <AppContext.Provider value={value}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
