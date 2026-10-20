# SPEC.md — Mine Notes Architecture & Technical Specification

## 1. Objective & Scope

**Mine Notes** is a warm editorial utilitarian note-taking and knowledge architecture application designed for deep writers, researchers, and thinkers. It combines literary typographic pacing (Newsreader + Inter, vellum palette) with high-density utility:
1. **Seamless Notes Feed & Longform Editor**: Rich text editing with in-editor text highlights (amber, sage, blue), callouts, voice memo waveforms, and nested checklists.
2. **Instant Zero-Confirmation Link Saver**: When a URL is shared, it is immediately parsed, classified by domain (e.g., GitHub → Dev & Code), auto-filed into a domain folder, and saved locally without modal confirmation interruptions.
3. **Android Quick Note Home Screen Widget**: An integrated floating widget / mini-launcher enabling instant note, checklist, and audio capture without opening the full application window, alongside a full native Kotlin/XML AppWidget definition.
4. **Unified Daily Workspace Hub & Task Tracker**: Focus card, streak counters, notebook grids, audio canvas, and priority task matrix.
5. **Offline-First Storage**: Instant local reads/writes with zero network dependency.

---

## 2. Interface & Data Contracts (Deep Modules)

### A. Storage Module (`src/modules/storage/`)
- **Seam**: `IStorageAdapter`
```typescript
export interface IStorageAdapter {
  getNotes(): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  getLinks(): Promise<SharedLink[]>;
  saveLink(link: SharedLink): Promise<void>;
  deleteLink(id: string): Promise<void>;
  getTasks(): Promise<TaskItem[]>;
  saveTask(task: TaskItem): Promise<void>;
  deleteTask(id: string): Promise<void>;
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<void>;
}
```

### B. Link Categorizer Module (`src/modules/links/`)
- **Deep Interface**:
```typescript
export interface ILinkCategorizer {
  categorize(url: string, rawTitle?: string): DomainClassification;
  processIncomingShare(rawText: string): Promise<SharedLink>;
}

export interface DomainClassification {
  domain: string;
  category: 'Dev & Engineering' | 'Media & Video' | 'Design & Aesthetics' | 'Reading & Articles' | 'Social & Community' | 'General Reference';
  folderName: string;
  color: string;
  icon: string;
}
```
**Invariants**:
- Sharing a link *never* opens an alert or confirmation dialog. It toasts a subtle non-blocking confirmation pill ("Saved to Dev & Engineering / github.com") and persists the record.

### C. Highlight Engine (`src/modules/editor/`)
- **Deep Interface**:
```typescript
export type HighlightColor = 'amber' | 'sage' | 'blue';

export interface HighlightRange {
  id: string;
  start: number;
  end: number;
  color: HighlightColor;
  text: string;
  annotation?: string;
}
```

### D. Widget Bridge (`src/modules/widget/`)
- Simulates and exposes the Android Glance / RemoteViews intent handling for quick note addition directly from home screen widgets without launching main activity.

---

## 3. UI Design System Tokens
- **Background**: `#FCF9F8` (archival stone vellum)
- **Primary Ink**: `#191919` (rich sumi ink)
- **Primary Accent**: `#C25E00` (warm cognac / amber)
- **Secondary Accent**: `#3F6212` (forest sage)
- **Tertiary Accent**: `#005EA4` (sapphire slate)
- **Borders**: `#E5E5E3`
- **Typography**: `Newsreader` (headlines & editorial bodies) + `Inter` (UI elements, metadata, tabular numbers).

---

## 4. Verification & Testing Strategy
- Unit tests for `LinkCategorizer` domain parsing & auto-folder generation.
- Unit tests for `StorageAdapter` CRUD operations.
- Integration test for zero-confirmation share intake.
- Visual browser verification via `browser_subagent` across all 7 screens.
