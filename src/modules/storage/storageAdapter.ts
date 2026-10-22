import { Note, SharedLink, TaskItem, Notebook, UserSettings } from '../../types';

const STORAGE_KEYS = {
  NOTES: 'mine_notes_items_v2',
  LINKS: 'mine_notes_links_v2',
  TASKS: 'mine_notes_tasks_v2',
  NOTEBOOKS: 'mine_notes_notebooks_v2',
  SETTINGS: 'mine_notes_settings_v2',
};

// Immediate purge of all legacy v1 demo data on page load
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    [
      'mine_notes_items_v1',
      'mine_notes_links_v1',
      'mine_notes_tasks_v1',
      'mine_notes_notebooks_v1',
      'mine_notes_settings_v1',
    ].forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // Ignore in non-browser environments
  }
}

// Clean empty defaults for production
export const INITIAL_NOTES: Note[] = [];
export const INITIAL_LINKS: SharedLink[] = [];
export const INITIAL_TASKS: TaskItem[] = [];
export const INITIAL_NOTEBOOKS: Notebook[] = [];

export const INITIAL_SETTINGS: UserSettings = {
  appName: 'Mine Notes',
  typographyFamily: 'Newsreader',
  bodyFontSize: 'normal',
  themeMode: 'auto',
  autoCategorizeLinks: true,
  saveWithoutConfirmation: true,
  enableVoiceMemo: true,
  enableAndroidWidgetBridge: true,
  offlineSyncMode: 'huggingface_space',
  storageSizeEstimate: '0 KB (clean vault)',
  hfServerUrl: 'https://nandhaalagesan248-mine-notes.static.hf.space',
  hfDatasetRepo: 'nandhaalagesan248/mine-notes-vault',
  autoSyncEnabled: true,
};

export class StorageAdapter {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // --- Notes ---
  public static getNotes(includeDeleted = false): Note[] {
    if (!this.isBrowser()) return includeDeleted ? [...INITIAL_NOTES] : INITIAL_NOTES.filter((n) => !n.isDeleted);
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]));
      return [];
    }
    try {
      const parsed: Note[] = JSON.parse(raw);
      return includeDeleted ? parsed : parsed.filter((n) => !n.isDeleted);
    } catch {
      return [];
    }
  }

  public static getRawNotes(): Note[] {
    return this.getNotes(true);
  }

  public static setAllNotes(notes: Note[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } else {
      const copy = [...notes];
      INITIAL_NOTES.length = 0;
      INITIAL_NOTES.push(...copy);
    }
  }

  public static saveNote(note: Note): void {
    const notes = this.getRawNotes();
    const index = notes.findIndex((n) => n.id === note.id);
    const noteWithMetadata = {
      ...note,
      isDeleted: false,
      updatedAt: new Date().toISOString(),
    };
    if (index >= 0) {
      notes[index] = noteWithMetadata;
    } else {
      notes.unshift(noteWithMetadata);
    }
    this.setAllNotes(notes);
  }

  public static deleteNote(id: string): void {
    const notes = this.getRawNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index >= 0) {
      notes[index] = {
        ...notes[index],
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      };
      this.setAllNotes(notes);
    }
  }

  public static togglePinNote(id: string): void {
    const notes = this.getRawNotes();
    const target = notes.find((n) => n.id === id);
    if (target) {
      target.isPinned = !target.isPinned;
      target.updatedAt = new Date().toISOString();
      this.setAllNotes(notes);
    }
  }

  // --- Links ---
  public static getLinks(includeDeleted = false): SharedLink[] {
    if (!this.isBrowser()) return includeDeleted ? [...INITIAL_LINKS] : INITIAL_LINKS.filter((l) => !l.isDeleted);
    const raw = localStorage.getItem(STORAGE_KEYS.LINKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify([]));
      return [];
    }
    try {
      const parsed: SharedLink[] = JSON.parse(raw);
      return includeDeleted ? parsed : parsed.filter((l) => !l.isDeleted);
    } catch {
      return [];
    }
  }

  public static getRawLinks(): SharedLink[] {
    return this.getLinks(true);
  }

  public static setAllLinks(links: SharedLink[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
    } else {
      const copy = [...links];
      INITIAL_LINKS.length = 0;
      INITIAL_LINKS.push(...copy);
    }
  }

  public static saveLink(link: SharedLink): void {
    const links = this.getRawLinks();
    const index = links.findIndex((l) => l.id === link.id || l.url === link.url);
    const linkWithMeta = {
      ...link,
      isDeleted: false,
      savedAt: link.savedAt || new Date().toISOString(),
    };
    if (index >= 0) {
      links[index] = linkWithMeta;
    } else {
      links.unshift(linkWithMeta);
    }
    this.setAllLinks(links);
  }

  public static deleteLink(id: string): void {
    const links = this.getRawLinks();
    const index = links.findIndex((l) => l.id === id);
    if (index >= 0) {
      links[index] = {
        ...links[index],
        isDeleted: true,
        savedAt: new Date().toISOString(),
      };
      this.setAllLinks(links);
    }
  }

  public static toggleLinkRead(id: string): void {
    const links = this.getRawLinks();
    const target = links.find((l) => l.id === id);
    if (target) {
      target.isRead = !target.isRead;
      this.setAllLinks(links);
    }
  }

  // --- Tasks ---
  public static getTasks(includeDeleted = false): TaskItem[] {
    if (!this.isBrowser()) return includeDeleted ? [...INITIAL_TASKS] : INITIAL_TASKS.filter((t) => !t.isDeleted);
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      return [];
    }
    try {
      const parsed: TaskItem[] = JSON.parse(raw);
      return includeDeleted ? parsed : parsed.filter((t) => !t.isDeleted);
    } catch {
      return [];
    }
  }

  public static getRawTasks(): TaskItem[] {
    return this.getTasks(true);
  }

  public static setAllTasks(tasks: TaskItem[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } else {
      const copy = [...tasks];
      INITIAL_TASKS.length = 0;
      INITIAL_TASKS.push(...copy);
    }
  }

  public static saveTask(task: TaskItem): void {
    const tasks = this.getRawTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    const taskWithMeta = {
      ...task,
      isDeleted: false,
      updatedAt: new Date().toISOString(),
    };
    if (index >= 0) {
      tasks[index] = taskWithMeta;
    } else {
      tasks.unshift(taskWithMeta);
    }
    this.setAllTasks(tasks);
  }

  public static toggleTask(id: string): void {
    const tasks = this.getRawTasks();
    const target = tasks.find((t) => t.id === id);
    if (target) {
      if (target.status === 'completed') {
        target.status = 'todo';
        target.completedAt = undefined;
      } else {
        target.status = 'completed';
        target.completedAt = new Date().toISOString();
      }
      target.updatedAt = new Date().toISOString();
      this.setAllTasks(tasks);
    }
  }

  public static deleteTask(id: string): void {
    const tasks = this.getRawTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index >= 0) {
      tasks[index] = {
        ...tasks[index],
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      };
      this.setAllTasks(tasks);
    }
  }

  // --- Notebooks ---
  public static getNotebooks(includeDeleted = false): Notebook[] {
    if (!this.isBrowser()) return includeDeleted ? [...INITIAL_NOTEBOOKS] : INITIAL_NOTEBOOKS.filter((n) => !n.isDeleted);
    const raw = localStorage.getItem(STORAGE_KEYS.NOTEBOOKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify([]));
      return [];
    }
    try {
      const parsed: Notebook[] = JSON.parse(raw);
      return includeDeleted ? parsed : parsed.filter((n) => !n.isDeleted);
    } catch {
      return [];
    }
  }

  public static getRawNotebooks(): Notebook[] {
    return this.getNotebooks(true);
  }

  public static setAllNotebooks(notebooks: Notebook[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(notebooks));
    } else {
      const copy = [...notebooks];
      INITIAL_NOTEBOOKS.length = 0;
      INITIAL_NOTEBOOKS.push(...copy);
    }
  }

  // --- Settings ---
  public static getSettings(): UserSettings {
    if (!this.isBrowser()) return INITIAL_SETTINGS;
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    try {
      const parsed = JSON.parse(raw);
      return { ...INITIAL_SETTINGS, ...parsed };
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  public static saveSettings(settings: UserSettings): void {
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
  }

  /**
   * Flushes all demo data and clears localStorage entirely to a pristine clean vault.
   */
  public static flushAllData(): void {
    INITIAL_NOTES.length = 0;
    INITIAL_LINKS.length = 0;
    INITIAL_TASKS.length = 0;
    INITIAL_NOTEBOOKS.length = 0;
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify([]));
    }
  }

  public static resetDefaults(): void {
    this.flushAllData();
  }
}
