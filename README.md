# NoteFlow

A premium, modern note-taking app built with **React Native + Expo** (Expo SDK 57, React Native 0.86, TypeScript).

Everything is stored locally on-device in SQLite. No account, no network, no tracking.

---

## Feature set

### Writing
- Rich **Markdown** note editor with a live **Preview** mode
- Formatting toolbar: bold, italic, H1/H2, bullet lists, task lists, quotes, fenced code, dividers
- Interactive checklists — toggle tasks directly from the preview
- Titles, word count and estimated reading time
- Image attachments picked from the photo library
- Auto-save with a "Saving… / Saved 2m ago" indicator

### Organisation
- **Spaces** (folders) with custom colours and icons
- **Tags** via `#hashtags`, plus a tag picker with inline creation
- **Pinning**, **starring** and per-note **locking**
- **Archive** and **Trash** with restore and undo
- Multi-select mode with bulk pin / star / archive / delete
- Search across titles and content with match highlighting, scoped to notes / archive / trash and filtered by tag

### Experience
- Curated 12-colour note palette plus a full light/dark theme (follows system or forced)
- List, grid and compact layouts; sort by last edited, created or title
- Swipe actions on note cards (pin, star, archive, delete)
- Smooth Reanimated transitions, spring press feedback and haptics throughout
- Frosted tab bar, gradient FAB, bottom sheets and toasts
- **Reminders** via local notifications with quick presets
- Optional **biometric app lock** (expo-local-authentication)
- Insights screen with activity chart, task-completion ring and library stats
- Export a note as Markdown, export the whole library as Markdown or a JSON backup

---

## Project structure

```
app/                     Expo Router routes (file-based navigation)
  _layout.tsx            Root stack + providers (theme, toast, app lock)
  (tabs)/                Bottom-tab shell
    _layout.tsx          Custom blurred tab bar
    index.tsx            Notes home (search, filters, layouts, multi-select)
    folders.tsx          Spaces + tags + archive/trash entry points
    search.tsx           Full-text search with scopes and tag filter
    settings.tsx         Appearance, behaviour, privacy, data
  editor/[id].tsx        Note editor / preview
  folder/[id].tsx        Notes in a space
  tag/[id].tsx           Notes with a tag
  archive.tsx            Archived notes
  trash.tsx              Trash with restore / empty
  stats.tsx              Insights & statistics
  about.tsx              About screen

src/
  theme/                 Design system: colours, spacing, radii, typography, elevation
  types.ts               Domain models and settings
  db/                    SQLite schema and all queries/mutations
  store/AppStore.tsx     App + theme providers, data revision signalling
  hooks/useNotes.ts      Note query hooks that refresh on focus/changes
  lib/                   id, text, date, greeting, haptics, notifications, export
  components/            Reusable UI: cards, sheets, markdown renderer, pickers…
```

## Data model (SQLite)

`notes`, `folders`, `tags`, `note_tags`, `attachments`, `settings` — created and migrated
idempotently in `src/db/index.ts`. Full-text-ish search uses `LIKE` over title and body.

## Development

```bash
npm install
npx expo start          # run in Expo Go / dev client
npm run android         # run on a connected device
npx tsc --noEmit        # typecheck
```

## Building the APK

```bash
npx expo prebuild --platform android
cd android && ./gradlew :app:assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk
```

## Tech

React Native 0.86 · Expo SDK 57 · expo-router · expo-sqlite · react-native-reanimated 4 ·
react-native-gesture-handler · expo-notifications · expo-image-picker · expo-local-authentication ·
expo-blur · expo-linear-gradient · react-native-svg · TypeScript
