import React from 'react';
import { Notebook, Note } from '../types';

interface DailyWorkspaceHubScreenProps {
  notebooks: Notebook[];
  recentNotes: Note[];
  onSelectNote: (note: Note) => void;
  onOpenNotebook: (notebook: Notebook) => void;
  onNewNote: () => void;
}

export const DailyWorkspaceHubScreen: React.FC<DailyWorkspaceHubScreenProps> = ({
  notebooks,
  recentNotes,
  onSelectNote,
  onOpenNotebook,
  onNewNote,
}) => {
  const hasNotes = recentNotes.length > 0;
  const activeFocusNote = hasNotes ? recentNotes[0] : null;

  const streakDays = [
    { day: 'M', active: false },
    { day: 'T', active: false },
    { day: 'W', active: false },
    { day: 'T', active: false },
    { day: 'F', active: false },
    { day: 'S', active: false },
    { day: 'S', active: false },
    { day: 'M', active: false },
    { day: 'T', active: false },
    { day: 'W', active: false },
    { day: 'T', active: false },
    { day: 'F', active: false },
    { day: 'S', active: false },
    { day: 'S', active: hasNotes, today: true },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Daily Focus Card */}
      <div className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasNotes ? 'bg-primary animate-pulse' : 'bg-outline'}`}></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Daily Focus • Workspace Session
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-on-surface leading-tight font-normal">
              {activeFocusNote ? activeFocusNote.title : 'Your workspace is ready'}
            </h2>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              {activeFocusNote
                ? (activeFocusNote.content.slice(0, 140) + '...')
                : 'No active focus note yet. Tap below to begin your first writing session.'}
            </p>
          </div>

          {/* Progress circle */}
          <div className="flex items-center gap-3 self-center sm:self-auto flex-shrink-0 bg-surface-container-low/70 px-4 py-3 rounded-xl border border-outline-variant/30">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center font-mono font-bold text-sm text-primary">
              {hasNotes ? '100%' : '0%'}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-on-surface">{hasNotes ? 'Active Session' : 'Ready'}</p>
              <p className="text-[11px] text-outline font-mono">{recentNotes.length} notes captured</p>
            </div>
          </div>
        </div>

        {/* Action button inside card */}
        <div className="flex items-center gap-2.5 pt-4 mt-4 border-t border-surface-container-low">
          <button
            onClick={onNewNote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">stylus</span>
            <span>Begin Log</span>
          </button>
          <span className="text-xs text-outline font-mono">
            {hasNotes ? '1 day active session' : '0 days recorded'}
          </span>
        </div>
      </div>

      {/* Writing Streak Calendar */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-card space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">local_fire_department</span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Creative Momentum
            </h3>
          </div>
          <span className="text-xs font-mono text-primary font-medium">
            {hasNotes ? '1 Day Streak 🔥' : '0 Day Streak'}
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-1">
          {streakDays.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col items-center justify-center py-2 rounded-lg text-xs font-mono transition-all ${
                item.today
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : item.active
                  ? 'bg-secondary-container/40 text-secondary font-medium'
                  : 'bg-surface-container-low text-outline/60'
              }`}
            >
              <span className="text-[10px] opacity-75">{item.day}</span>
              <span className="text-sm mt-0.5">{item.active ? '●' : '○'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notebooks Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">folder</span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Active Notebook Shelves
            </h3>
          </div>
          <span className="text-xs font-mono text-outline">{notebooks.length} collections</span>
        </div>

        {notebooks.length === 0 ? (
          <div className="text-center py-8 bg-surface-container-low/40 rounded-xl border border-dashed border-outline-variant/50">
            <p className="font-headline text-sm text-on-surface">No notebook shelves yet</p>
            <p className="font-sans text-xs text-outline mt-0.5">
              Create a note with tags to automatically organize shelves here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {notebooks.map((nb) => (
              <div
                key={nb.id}
                onClick={() => onOpenNotebook(nb)}
                className="group bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-card hover:shadow-card-hover hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: nb.coverAccent }}
                    >
                      <span className="material-symbols-outlined text-[18px]">{nb.icon}</span>
                    </div>
                    <span className="text-xs font-mono text-outline bg-surface-container px-2 py-0.5 rounded-full">
                      {nb.count} notes
                    </span>
                  </div>

                  <h4 className="font-headline text-base font-medium text-on-surface group-hover:text-primary transition-colors">
                    {nb.title}
                  </h4>
                </div>

                <div className="pt-3 mt-3 border-t border-surface-container-low flex items-center justify-between text-[11px] text-outline">
                  <span>Active</span>
                  <span className="font-mono">{nb.lastEdited}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Workspace Logs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Recent Workspace Activity
          </h3>
          <span className="text-xs font-mono text-outline">{recentNotes.length} entries</span>
        </div>

        {recentNotes.length === 0 ? (
          <div className="text-center py-8 bg-surface-container-low/40 rounded-xl border border-dashed border-outline-variant/50">
            <p className="font-headline text-sm text-on-surface">No recent activity</p>
            <p className="font-sans text-xs text-outline mt-0.5">
              Your writing log is completely clear.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl divide-y divide-surface-container-low shadow-card">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className="p-3.5 hover:bg-surface-container-low/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-on-surface truncate hover:text-primary">
                      {note.title}
                    </p>
                    <p className="text-[11px] text-outline font-sans truncate">
                      {note.category} • {note.tags.map((t) => `#${t}`).join(' ')}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-outline flex-shrink-0">
                  {note.readTime}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
