import { ThemeMode, SyncStatusInfo } from '../types';

interface HeaderProps {
  currentScreen: string;
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  syncStatus: SyncStatusInfo;
  onCycleTheme: () => void;
  onOpenSettings: () => void;
  onQuickLinkShare: () => void;
  onOpenSearch?: () => void;
  onTriggerSync?: () => void;
  unreadLinksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  themeMode,
  effectiveTheme,
  syncStatus,
  onCycleTheme,
  onOpenSettings,
  onQuickLinkShare,
  onOpenSearch,
  onTriggerSync,
  unreadLinksCount,
}) => {
  const getScreenTitle = (screen: string) => {
    switch (screen) {
      case 'notes':
        return 'All Notes & Feed';
      case 'editor':
        return 'Longform Editor';
      case 'workspace':
        return 'Daily Workspace';
      case 'tasks':
        return 'Action Tracker';
      case 'links':
        return 'Domain Link Shelf';
      case 'widget':
        return 'Android Widget Preview';
      case 'settings':
        return 'Settings & Preferences';
      default:
        return 'Mine Notes';
    }
  };

  const getThemeTooltip = () => {
    if (themeMode === 'auto') {
      return `Theme: Auto Time-Based (${effectiveTheme === 'dark' ? 'Night: Dark' : 'Day: Light'}) • 6pm–6am Dark`;
    }
    return `Theme: Always ${themeMode === 'dark' ? 'Dark' : 'Light'}`;
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/40 transition-all">
      <div className="max-w-5xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface-container-highest border border-outline-variant/50 flex items-center justify-center text-primary shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">draw</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-headline text-[19px] font-semibold text-on-surface leading-none tracking-tight">
                Mine
              </span>
              <span className="text-[10px] font-sans font-bold tracking-widest text-primary uppercase bg-primary-fixed/50 px-1.5 py-0.5 rounded">
                Notes
              </span>
            </div>
            <span className="text-[11px] font-sans text-on-surface-variant/80 truncate mt-0.5">
              {getScreenTitle(currentScreen)}
            </span>
          </div>
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick link share trigger simulator button */}
          <button
            onClick={onQuickLinkShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary-container/40 hover:bg-secondary-container text-secondary text-xs font-medium border border-secondary/20 transition-all active:scale-95 shadow-xs"
            title="Simulate receiving shared link from Android without confirmation"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span className="hidden sm:inline">Share Link</span>
            {unreadLinksCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-secondary text-on-secondary text-[10px] flex items-center justify-center">
                {unreadLinksCount}
              </span>
            )}
          </button>

          {/* Theme Quick Toggle (Auto Time-based / Light / Dark) */}
          <button
            onClick={onCycleTheme}
            aria-label="Toggle theme mode"
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title={getThemeTooltip()}
          >
            <span className="material-symbols-outlined text-[20px]">
              {themeMode === 'auto'
                ? (effectiveTheme === 'dark' ? 'bedtime' : 'light_mode')
                : (themeMode === 'dark' ? 'dark_mode' : 'light_mode')}
            </span>
            {themeMode === 'auto' && (
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" title="Auto Time-Based"></span>
            )}
          </button>

          {/* Search button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              aria-label="Search"
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              title="Search notes, tags, quotes"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
          )}

          {/* Live Hugging Face Sync Pill */}
          <button
            onClick={onTriggerSync}
            disabled={syncStatus.status === 'syncing'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium border transition-all active:scale-95 ${
              syncStatus.status === 'syncing'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : syncStatus.status === 'synced'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : syncStatus.status === 'offline'
                ? 'bg-surface-container border-outline-variant/40 text-on-surface-variant'
                : syncStatus.status === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-surface-container border-outline-variant/40 text-on-surface-variant'
            }`}
            title={`Hugging Face Space Sync: ${syncStatus.status.toUpperCase()} ${
              syncStatus.lastSyncedAt
                ? '• Synced ' + new Date(syncStatus.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''
            } • Click to Sync Now`}
          >
            <span
              className={`material-symbols-outlined text-[14px] ${
                syncStatus.status === 'syncing' ? 'animate-spin text-amber-600' :
                syncStatus.status === 'synced' ? 'text-emerald-600' :
                syncStatus.status === 'offline' ? 'text-outline' :
                syncStatus.status === 'error' ? 'text-rose-600' : 'text-primary'
              }`}
            >
              {syncStatus.status === 'syncing' ? 'sync' :
               syncStatus.status === 'synced' ? 'cloud_done' :
               syncStatus.status === 'offline' ? 'cloud_off' :
               syncStatus.status === 'error' ? 'sync_problem' : 'cloud_sync'}
            </span>
            <span className="hidden sm:inline">
              {syncStatus.status === 'syncing'
                ? 'Syncing...'
                : syncStatus.status === 'synced'
                ? 'Synced'
                : syncStatus.status === 'offline'
                ? 'Offline Vault'
                : syncStatus.status === 'error'
                ? 'Sync Error'
                : 'HF Sync'}
            </span>
            {syncStatus.pendingChangesCount > 0 && syncStatus.status !== 'syncing' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`${syncStatus.pendingChangesCount} local changes pending sync`}></span>
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Settings & Preferences"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </div>
    </header>
  );
};
