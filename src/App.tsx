import React, { useState, useEffect } from 'react';
import { StorageAdapter } from './modules/storage/storageAdapter';
import { LinkCategorizer } from './modules/links/linkCategorizer';
import { ThemeManager } from './modules/theme/themeManager';
import { SyncEngine } from './modules/sync/syncEngine';
import { Note, SharedLink, TaskItem, Notebook, UserSettings, SyncStatusInfo } from './types';
import { Header } from './components/Header';
import { BottomNav, ScreenTab } from './components/BottomNav';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AllNotesFeedScreen } from './screens/AllNotesFeedScreen';
import { NoteEditorScreen } from './screens/NoteEditorScreen';
import { DailyWorkspaceHubScreen } from './screens/DailyWorkspaceHubScreen';
import { TaskActionTrackerScreen } from './screens/TaskActionTrackerScreen';
import { LinkShelfScreen } from './screens/LinkShelfScreen';
import { AndroidWidgetSimulator } from './screens/AndroidWidgetSimulator';
import { SettingsPreferencesScreen } from './screens/SettingsPreferencesScreen';

export const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => StorageAdapter.getNotes());
  const [links, setLinks] = useState<SharedLink[]>(() => StorageAdapter.getLinks());
  const [tasks, setTasks] = useState<TaskItem[]>(() => StorageAdapter.getTasks());
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => StorageAdapter.getNotebooks());
  const [settings, setSettings] = useState<UserSettings>(() => StorageAdapter.getSettings());
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() =>
    ThemeManager.resolveEffectiveTheme(StorageAdapter.getSettings().themeMode || 'auto')
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(() => SyncEngine.getStatus());

  const [activeTab, setActiveTab] = useState<ScreenTab>('notes');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isQuickShareModalOpen, setIsQuickShareModalOpen] = useState(false);
  const [quickShareInput, setQuickShareInput] = useState('');

  // Automatic time-based theme synchronization effect
  useEffect(() => {
    const syncTheme = () => {
      const mode = settings.themeMode || 'auto';
      const eff = ThemeManager.applyTheme(mode);
      setEffectiveTheme(eff);
    };
    syncTheme();

    // Check periodically for day/night transitions
    const interval = setInterval(syncTheme, 30000);
    return () => clearInterval(interval);
  }, [settings.themeMode]);

  // Real-time Sync Engine subscription & automatic background sync
  useEffect(() => {
    const refreshLocalState = () => {
      setNotes(StorageAdapter.getNotes());
      setLinks(StorageAdapter.getLinks());
      setTasks(StorageAdapter.getTasks());
      setNotebooks(StorageAdapter.getNotebooks());
    };

    const unsubscribe = SyncEngine.subscribe((info) => {
      setSyncStatus(info);
      if (info.status === 'synced') {
        refreshLocalState();
      }
    });

    const runSync = () => {
      if (settings.offlineSyncMode === 'huggingface_space' && settings.autoSyncEnabled) {
        SyncEngine.sync().then(() => {
          refreshLocalState();
        });
      }
    };

    const handleOnline = () => runSync();
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        runSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Initial sync on mount
    runSync();

    // Periodic cloud poll every 25 seconds when page is active
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        runSync();
      }
    }, 25000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [settings.offlineSyncMode, settings.autoSyncEnabled, settings.hfDatasetRepo, settings.hfAccessToken]);

  const triggerAutoSync = () => {
    SyncEngine.markDirty(1);
    if (settings.offlineSyncMode === 'huggingface_space' && settings.autoSyncEnabled) {
      setTimeout(async () => {
        await SyncEngine.sync();
        setNotes(StorageAdapter.getNotes());
        setLinks(StorageAdapter.getLinks());
        setTasks(StorageAdapter.getTasks());
        setNotebooks(StorageAdapter.getNotebooks());
      }, 1000);
    }
  };

  // Toast dispatcher
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const newToast: ToastMessage = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ...toast,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync state changes to storage
  const handleSaveNote = (updatedNote: Note) => {
    StorageAdapter.saveNote(updatedNote);
    setNotes(StorageAdapter.getNotes());
    setSelectedNote(null);
    setActiveTab('notes');
    triggerAutoSync();
    addToast({
      title: 'Note Saved',
      subtitle: `"${updatedNote.title}" updated in SQLite storage.`,
      icon: 'check',
      color: '#C25E00',
    });
  };

  const handleDeleteNote = (id: string) => {
    StorageAdapter.deleteNote(id);
    setNotes(StorageAdapter.getNotes());
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setActiveTab('notes');
    }
    triggerAutoSync();
    addToast({
      title: 'Note Deleted',
      icon: 'delete',
      color: '#BA1A1A',
    });
  };

  const handleTogglePinNote = (id: string) => {
    StorageAdapter.togglePinNote(id);
    setNotes(StorageAdapter.getNotes());
    triggerAutoSync();
  };

  const handleSaveQuickThought = (text: string) => {
    const isUrl = /(https?:\/\/[^\s]+)/.test(text);
    const newNote: Note = {
      id: 'note_' + Date.now(),
      title: text.length > 36 ? text.substring(0, 36) + '...' : text,
      category: isUrl ? 'Reading' : 'Ideas',
      categoryEmoji: isUrl ? '📖' : '💡',
      content: text,
      isPinned: false,
      tags: isUrl ? ['web', 'clipped'] : ['quick-capture'],
      readTime: '1 min read',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageAdapter.saveNote(newNote);
    setNotes(StorageAdapter.getNotes());

    // If it was a link, auto-categorize and save to LinkShelf without confirmation!
    if (isUrl) {
      const link = LinkCategorizer.processIncomingShare(text);
      StorageAdapter.saveLink(link);
      setLinks(StorageAdapter.getLinks());
      triggerAutoSync();
      addToast({
        title: 'Zero-Confirmation Link Saved',
        subtitle: `Auto-categorized into ${link.folderCategory} (${link.domain})`,
        icon: 'folder_data',
        color: link.folderColor,
      });
    } else {
      triggerAutoSync();
      addToast({
        title: 'Quick Thought Captured',
        subtitle: 'Appended to Chronological Feed.',
        icon: 'stylus',
        color: '#C25E00',
      });
    }
  };

  // Link Shelf Handlers
  const handleAddLink = (newLink: SharedLink) => {
    StorageAdapter.saveLink(newLink);
    setLinks(StorageAdapter.getLinks());
    triggerAutoSync();
    addToast({
      title: 'Link Saved Without Confirmation',
      subtitle: `Filed into "${newLink.folderCategory}" (${newLink.domain})`,
      icon: newLink.folderIcon,
      color: newLink.folderColor,
    });
  };

  const handleToggleReadLink = (id: string) => {
    StorageAdapter.toggleLinkRead(id);
    setLinks(StorageAdapter.getLinks());
    triggerAutoSync();
  };

  const handleDeleteLink = (id: string) => {
    StorageAdapter.deleteLink(id);
    setLinks(StorageAdapter.getLinks());
    triggerAutoSync();
    addToast({
      title: 'Link Removed',
      icon: 'delete',
      color: '#BA1A1A',
    });
  };

  // Task Handlers
  const handleToggleTask = (id: string) => {
    StorageAdapter.toggleTask(id);
    setTasks(StorageAdapter.getTasks());
    triggerAutoSync();
  };

  const handleAddTask = (taskData: Partial<TaskItem>) => {
    const newTask: TaskItem = {
      id: 'task_' + Date.now(),
      title: taskData.title || 'Untitled task',
      category: taskData.category || 'Studio',
      categoryColor: taskData.categoryColor || '#3F6212',
      dueDate: taskData.dueDate || 'Today',
      dueTime: taskData.dueTime,
      priority: taskData.priority || 'high',
      status: 'todo',
    };
    StorageAdapter.saveTask(newTask);
    setTasks(StorageAdapter.getTasks());
    triggerAutoSync();
    addToast({
      title: 'Task Created',
      subtitle: newTask.title,
      icon: 'check_circle',
      color: '#3F6212',
    });
  };

  const handleDeleteTask = (id: string) => {
    StorageAdapter.deleteTask(id);
    setTasks(StorageAdapter.getTasks());
    triggerAutoSync();
  };

  // Settings Handlers
  const handleUpdateSettings = (newSettings: UserSettings) => {
    StorageAdapter.saveSettings(newSettings);
    setSettings(newSettings);
    addToast({
      title: 'Settings Saved',
      icon: 'tune',
      color: '#005EA4',
    });
  };

  const handleResetDefaults = () => {
    StorageAdapter.flushAllData();
    setNotes([]);
    setLinks([]);
    setTasks([]);
    setNotebooks([]);
    setSettings(StorageAdapter.getSettings());
    setIsSettingsOpen(false);
    addToast({
      title: 'Demo Data Flushed',
      subtitle: 'Your workspace is now completely clear and pristine.',
      icon: 'delete_sweep',
      color: '#C25E00',
    });
  };

  const handleExportData = () => {
    const backup = {
      notes,
      links,
      tasks,
      notebooks,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mine_notes_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      title: 'Backup Exported',
      subtitle: 'Downloaded archive JSON file.',
      icon: 'download',
      color: '#3F6212',
    });
  };

  const handleQuickShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickShareInput.trim()) return;
    const link = LinkCategorizer.processIncomingShare(quickShareInput);
    handleAddLink(link);
    setQuickShareInput('');
    setIsQuickShareModalOpen(false);
  };

  const handleNewNote = (initialText?: string) => {
    const freshNote: Note = {
      id: 'note_' + Date.now(),
      title: initialText ? (initialText.length > 36 ? initialText.substring(0, 36) + '...' : initialText) : 'Untitled Note',
      category: 'Studio & Work',
      categoryEmoji: '💼',
      content: initialText || '',
      isPinned: false,
      tags: ['draft'],
      readTime: '1 min read',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedNote(freshNote);
    setActiveTab('editor');
  };

  // Native Android Intent & Widget Bridge Listeners
  useEffect(() => {
    const handleNativeShare = (event: any) => {
      const text = event.detail?.text || (typeof event.detail === 'string' ? event.detail : '');
      if (text) {
        handleSaveQuickThought(text);
      }
    };

    const handleNativeQuickNote = () => {
      handleNewNote();
    };

    window.addEventListener('mine_notes_incoming_share', handleNativeShare);
    window.addEventListener('mine_notes_quick_note', handleNativeQuickNote);

    // Deep-link / query param triggers (?share_url= or ?quick_note=1)
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get('share_url') || params.get('text');
    if (sharedText) {
      handleSaveQuickThought(sharedText);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('quick_note') === '1') {
      handleNewNote();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener('mine_notes_incoming_share', handleNativeShare);
      window.removeEventListener('mine_notes_quick_note', handleNativeQuickNote);
    };
  }, []);

  const handleCycleTheme = () => {
    const nextMode: 'auto' | 'light' | 'dark' =
      settings.themeMode === 'auto'
        ? 'light'
        : settings.themeMode === 'light'
        ? 'dark'
        : 'auto';
    const updated = { ...settings, themeMode: nextMode };
    handleUpdateSettings(updated);
    addToast({
      title:
        nextMode === 'auto'
          ? `Auto Theme Active (${ThemeManager.isNightTime() ? 'Night: Dark' : 'Day: Light'})`
          : nextMode === 'dark'
          ? 'Dark Mode Active'
          : 'Light Mode Active',
      subtitle:
        nextMode === 'auto'
          ? 'Switches automatically: 6am–6pm Light, 6pm–6am Dark.'
          : undefined,
      icon: nextMode === 'auto' ? 'schedule' : nextMode === 'dark' ? 'dark_mode' : 'light_mode',
      color: '#C25E00',
    });
  };

  const unreadLinksCount = links.filter((l) => !l.isRead).length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <div className={`min-h-screen flex flex-col bg-surface text-on-surface ${settings.typographyFamily === 'Inter' ? 'font-sans' : 'font-display'}`}>
      {/* Toast Feedback Alerts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Header */}
      <Header
        currentScreen={isSettingsOpen ? 'settings' : activeTab}
        themeMode={settings.themeMode || 'auto'}
        effectiveTheme={effectiveTheme}
        syncStatus={syncStatus}
        onCycleTheme={handleCycleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuickLinkShare={() => setIsQuickShareModalOpen(true)}
        onTriggerSync={async () => {
          const res = await SyncEngine.sync({ force: true });
          setNotes(StorageAdapter.getNotes());
          setLinks(StorageAdapter.getLinks());
          setTasks(StorageAdapter.getTasks());
          setNotebooks(StorageAdapter.getNotebooks());
          addToast({
            title: res.success ? 'Hugging Face Space Synced' : 'Sync Status',
            subtitle: res.message,
            icon: res.success ? 'cloud_done' : 'sync_problem',
            color: res.success ? '#3F6212' : '#C25E00',
          });
        }}
        unreadLinksCount={unreadLinksCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {isSettingsOpen ? (
          <SettingsPreferencesScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClose={() => setIsSettingsOpen(false)}
            onResetDefaults={handleResetDefaults}
            onExportData={handleExportData}
            onTriggerSync={async () => {
              const res = await SyncEngine.sync({ force: true });
              setNotes(StorageAdapter.getNotes());
              setLinks(StorageAdapter.getLinks());
              setTasks(StorageAdapter.getTasks());
              setNotebooks(StorageAdapter.getNotebooks());
              return res;
            }}
          />
        ) : activeTab === 'editor' && selectedNote ? (
          <NoteEditorScreen
            note={selectedNote}
            onSave={handleSaveNote}
            onBack={() => {
              setSelectedNote(null);
              setActiveTab('notes');
            }}
            onDelete={handleDeleteNote}
          />
        ) : activeTab === 'notes' ? (
          <AllNotesFeedScreen
            notes={notes}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setActiveTab('editor');
            }}
            onNewNote={handleNewNote}
            onTogglePin={handleTogglePinNote}
            onDeleteNote={handleDeleteNote}
            onSaveQuickThought={handleSaveQuickThought}
          />
        ) : activeTab === 'workspace' ? (
          <DailyWorkspaceHubScreen
            notebooks={notebooks}
            recentNotes={notes}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setActiveTab('editor');
            }}
            onOpenNotebook={() => setActiveTab('notes')}
            onNewNote={() => handleNewNote()}
          />
        ) : activeTab === 'tasks' ? (
          <TaskActionTrackerScreen
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        ) : activeTab === 'links' ? (
          <LinkShelfScreen
            links={links}
            onAddLink={handleAddLink}
            onToggleRead={handleToggleReadLink}
            onDeleteLink={handleDeleteLink}
          />
        ) : activeTab === 'widget' ? (
          <AndroidWidgetSimulator
            onWidgetCaptured={(msg) => {
              setNotes(StorageAdapter.getNotes());
              setLinks(StorageAdapter.getLinks());
              setTasks(StorageAdapter.getTasks());
              addToast({
                title: 'Widget Intent Executed',
                subtitle: msg,
                icon: 'widgets',
                color: '#C25E00',
              });
            }}
            recentNotes={notes}
          />
        ) : (
          <AllNotesFeedScreen
            notes={notes}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setActiveTab('editor');
            }}
            onNewNote={handleNewNote}
            onTogglePin={handleTogglePinNote}
            onDeleteNote={handleDeleteNote}
            onSaveQuickThought={handleSaveQuickThought}
          />
        )}
      </main>

      {/* Quick Share Modal Dialog for manual intent simulation */}
      {isQuickShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">share</span>
                <h3 className="text-sm font-semibold text-on-surface">
                  Simulate Android Share Intent
                </h3>
              </div>
              <button
                onClick={() => setIsQuickShareModalOpen(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant font-sans leading-relaxed">
              Paste any URL. It will be <strong>automatically categorized by domain</strong>, filed into a domain folder, and saved directly to local storage without any confirmation prompt.
            </p>

            <form onSubmit={handleQuickShareSubmit} className="space-y-3">
              <input
                type="text"
                value={quickShareInput}
                onChange={(e) => setQuickShareInput(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-sans"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsQuickShareModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quickShareInput.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-medium shadow-xs hover:opacity-90 disabled:opacity-50"
                >
                  Save Silently
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setIsSettingsOpen(false);
          setActiveTab(tab);
          if (tab === 'editor' && !selectedNote) {
            handleNewNote();
          }
        }}
        pendingTasksCount={pendingTasksCount}
        savedLinksCount={unreadLinksCount}
      />
    </div>
  );
};
