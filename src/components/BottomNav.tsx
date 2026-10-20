import React from 'react';

export type ScreenTab = 'notes' | 'editor' | 'workspace' | 'tasks' | 'links' | 'widget';

interface BottomNavProps {
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  pendingTasksCount: number;
  savedLinksCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingTasksCount,
  savedLinksCount,
}) => {
  const navItems: { id: ScreenTab; label: string; icon: string; badge?: number }[] = [
    { id: 'notes', label: 'Notes', icon: 'edit_note' },
    { id: 'editor', label: 'Editor', icon: 'stylus' },
    { id: 'workspace', label: 'Workspace', icon: 'grid_view' },
    { id: 'tasks', label: 'Tasks', icon: 'check_circle', badge: pendingTasksCount },
    { id: 'links', label: 'Link Shelf', icon: 'folder_data', badge: savedLinksCount },
    { id: 'widget', label: 'Widget', icon: 'widgets' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-surface-container-high/70 pb-safe shadow-[0_-4px_20px_rgba(25,25,25,0.04)]">
      <div className="max-w-lg mx-auto h-16 px-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive ? 'text-primary scale-105' : 'text-on-surface-variant/70 hover:text-on-surface'
              }`}
            >
              <div className="relative">
                <span
                  className={`material-symbols-outlined text-[22px] transition-transform ${
                    isActive ? 'fill' : ''
                  }`}
                >
                  {item.icon}
                </span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 px-1 min-w-[15px] h-[15px] rounded-full bg-primary text-on-primary text-[9px] font-mono font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-sans font-medium mt-0.5 tracking-tight ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
