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
  offlineSyncMode: 'local_only',
  storageSizeEstimate: '0 KB (clean vault)',
};

export class StorageAdapter {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // --- Notes ---
  public static getNotes(): Note[] {
    if (!this.isBrowser()) return INITIAL_NOTES;
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveNote(note: Note): void {
    const notes = this.getNotes();
    const index = notes.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      notes[index] = { ...note, updatedAt: new Date().toISOString() };
    } else {
      notes.unshift({ ...note, updatedAt: new Date().toISOString() });
    }
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }
  }

  public static deleteNote(id: string): void {
    const notes = this.getNotes().filter((n) => n.id !== id);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }
  }

  public static togglePinNote(id: string): void {
    const notes = this.getNotes();
    const target = notes.find((n) => n.id === id);
    if (target) {
      target.isPinned = !target.isPinned;
      target.updatedAt = new Date().toISOString();
      if (this.isBrowser()) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      }
    }
  }

  // --- Links ---
  public static getLinks(): SharedLink[] {
    if (!this.isBrowser()) return INITIAL_LINKS;
    const raw = localStorage.getItem(STORAGE_KEYS.LINKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveLink(link: SharedLink): void {
    const links = this.getLinks();
    const index = links.findIndex((l) => l.id === link.id || l.url === link.url);
    if (index >= 0) {
      links[index] = link;
    } else {
      links.unshift(link);
    }
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
    }
  }

  public static deleteLink(id: string): void {
    const links = this.getLinks().filter((l) => l.id !== id);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
    }
  }

  public static toggleLinkRead(id: string): void {
    const links = this.getLinks();
    const target = links.find((l) => l.id === id);
    if (target) {
      target.isRead = !target.isRead;
      if (this.isBrowser()) {
        localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
      }
    }
  }

  // --- Tasks ---
  public static getTasks(): TaskItem[] {
    if (!this.isBrowser()) return INITIAL_TASKS;
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveTask(task: TaskItem): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.unshift(task);
    }
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
  }

  public static toggleTask(id: string): void {
    const tasks = this.getTasks();
    const target = tasks.find((t) => t.id === id);
    if (target) {
      if (target.status === 'completed') {
        target.status = 'todo';
        target.completedAt = undefined;
      } else {
        target.status = 'completed';
        target.completedAt = new Date().toISOString();
      }
      if (this.isBrowser()) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      }
    }
  }

  public static deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
  }

  // --- Notebooks ---
  public static getNotebooks(): Notebook[] {
    if (!this.isBrowser()) return INITIAL_NOTEBOOKS;
    const raw = localStorage.getItem(STORAGE_KEYS.NOTEBOOKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
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
      return JSON.parse(raw);
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
