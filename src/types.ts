export type HighlightColor = 'amber' | 'sage' | 'blue';

export interface Highlight {
  id: string;
  start: number;
  end: number;
  color: HighlightColor;
  text: string;
  annotation?: string;
  createdAt: string;
}

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  category: string;
  categoryEmoji?: string;
  content: string;
  isPinned: boolean;
  tags: string[];
  checklists?: NoteChecklistItem[];
  highlights?: Highlight[];
  voiceMemoDuration?: string;
  readTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedLink {
  id: string;
  url: string;
  title: string;
  description: string;
  domain: string;
  folderCategory: string;
  folderIcon: string;
  folderColor: string;
  faviconUrl?: string;
  savedAt: string;
  isRead: boolean;
  notes?: string;
}

export interface DomainCategoryRule {
  domainPattern: RegExp;
  category: string;
  folderName: string;
  icon: string;
  color: string;
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  dueDate: string;
  dueTime?: string;
  priority: TaskPriority;
  status: TaskStatus;
  noteId?: string;
  completedAt?: string;
}

export interface Notebook {
  id: string;
  title: string;
  count: number;
  coverAccent: string;
  icon: string;
  lastEdited: string;
}

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface UserSettings {
  appName: string;
  typographyFamily: 'Newsreader' | 'Inter' | 'Lora' | 'System';
  bodyFontSize: 'normal' | 'large' | 'compact';
  themeMode: ThemeMode;
  autoCategorizeLinks: boolean;
  saveWithoutConfirmation: boolean;
  enableVoiceMemo: boolean;
  enableAndroidWidgetBridge: boolean;
  offlineSyncMode: 'local_only' | 'github_actions' | 'huggingface_space';
  storageSizeEstimate: string;
}
