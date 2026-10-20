import React, { useState } from 'react';
import { Note } from '../types';

interface AllNotesFeedScreenProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onNewNote: (initialText?: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onSaveQuickThought: (text: string) => void;
}

export const AllNotesFeedScreen: React.FC<AllNotesFeedScreenProps> = ({
  notes,
  onSelectNote,
  onNewNote,
  onTogglePin,
  onDeleteNote,
  onSaveQuickThought,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [quickInput, setQuickInput] = useState('');

  const filterOptions = [
    { id: 'all', label: 'All', count: notes.length },
    { id: 'pinned', label: 'Pinned', dot: true, count: notes.filter((n) => n.isPinned).length },
    { id: 'ideas', label: '💡 Ideas', count: notes.filter((n) => n.category.toLowerCase().includes('idea')).length },
    { id: 'studio', label: '💼 Studio & Work', count: notes.filter((n) => n.category.toLowerCase().includes('studio') || n.category.toLowerCase().includes('work')).length },
    { id: 'reading', label: '📖 Reading', count: notes.filter((n) => n.category.toLowerCase().includes('read')).length },
  ];

  const filteredNotes = notes.filter((note) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchContent = note.content.toLowerCase().includes(q);
      const matchTag = note.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTag) return false;
    }

    // Filter chip match
    if (activeFilter === 'pinned') return note.isPinned;
    if (activeFilter === 'ideas') return note.category.toLowerCase().includes('idea');
    if (activeFilter === 'studio') return note.category.toLowerCase().includes('studio') || note.category.toLowerCase().includes('work');
    if (activeFilter === 'reading') return note.category.toLowerCase().includes('read');

    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const streamNotes = filteredNotes.filter((n) => !n.isPinned);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onSaveQuickThought(quickInput);
    setQuickInput('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Search Capsule */}
      <div className="relative w-full">
        <div className="flex items-center w-full h-11 px-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 shadow-xs focus-within:bg-surface-container-lowest focus-within:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-[20px] text-outline mr-2.5 select-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${notes.length} entries, tags, highlights, quotes...`}
            className="w-full bg-transparent font-sans text-sm text-on-surface placeholder:text-outline focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-outline hover:text-on-surface p-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-surface-container text-outline text-[11px] font-mono ml-2">
            ⌘K
          </span>
        </div>
      </div>

      {/* Tag Pills Horizontal Strip */}
      <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2 min-w-max pb-1">
          {filterOptions.map((f) => {
            const isSelected = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`h-7 px-3.5 rounded-full font-sans text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-on-surface text-surface-container-lowest font-medium shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                {f.dot && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
                <span>{f.label}</span>
                <span className="opacity-70 text-[10px] font-mono tabular-nums">{f.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fast Quick Capture Input Bar */}
      <form
        onSubmit={handleQuickSubmit}
        className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-2.5 shadow-card focus-within:shadow-card-hover focus-within:border-primary/50 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">stylus</span>
          </div>
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Type a thought, paste a link to auto-file, or drop a memo..."
            className="flex-1 bg-transparent font-sans text-sm text-on-surface placeholder:text-outline focus:outline-none min-w-0"
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNewNote(quickInput)}
              className="w-8 h-8 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low flex items-center justify-center transition-colors"
              title="Expand into full editor"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
            </button>
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                quickInput.trim()
                  ? 'bg-primary text-on-primary shadow-xs active:scale-90'
                  : 'bg-surface-container text-outline cursor-not-allowed'
              }`}
              title="Quick save"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
          </div>
        </div>
      </form>

      {/* Pinned Section Bento Grid */}
      {pinnedNotes.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/60">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Pinned Architecture
              </h2>
            </div>
            <span className="text-xs font-mono text-outline">{pinnedNotes.length} pinned</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {pinnedNotes.map((note) => (
              <article
                key={note.id}
                onClick={() => onSelectNote(note)}
                className="group relative bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 shadow-card hover:shadow-card-hover hover:border-primary/40 flex flex-col justify-between transition-all cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary text-xs font-medium">
                      {note.categoryEmoji} {note.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(note.id);
                      }}
                      className="text-primary hover:opacity-80 p-0.5"
                      title="Unpin note"
                    >
                      <span className="material-symbols-outlined text-[20px] fill">bookmark</span>
                    </button>
                  </div>

                  <h3 className="font-headline text-lg font-medium text-on-surface group-hover:text-primary transition-colors leading-snug">
                    {note.title}
                  </h3>

                  {/* Checklist preview if present */}
                  {note.checklists && note.checklists.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-surface-container-low">
                      {note.checklists.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${item.completed ? 'bg-secondary text-white' : 'border border-outline'}`}>
                            {item.completed ? '✓' : ''}
                          </span>
                          <span className={item.completed ? 'line-through text-outline' : ''}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Snippet */}
                  <p className="font-sans text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container-low text-[11px] text-outline">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {note.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono">{note.readTime}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Chronological Stream */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/60">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Chronological Stream
          </h2>
          <span className="text-xs font-mono text-outline">{streamNotes.length} notes</span>
        </div>

        {streamNotes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-surface-container-low/50 rounded-xl border border-dashed border-outline-variant/60">
            <span className="material-symbols-outlined text-[36px] text-outline mb-2">
              note_stack
            </span>
            <p className="font-headline text-base text-on-surface">
              {notes.length === 0 ? 'Your writing sanctuary is empty' : 'No entries match your filter'}
            </p>
            <p className="font-sans text-xs text-outline mt-1">
              {notes.length === 0
                ? 'Capture a thought above, paste a link to auto-file, or compose your first entry.'
                : 'Clear your active tag filter or try another search term.'}
            </p>
            <button
              onClick={() => onNewNote()}
              className="mt-3.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-medium shadow-xs hover:opacity-90 transition-opacity"
            >
              Compose New Note
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {streamNotes.map((note) => (
              <article
                key={note.id}
                onClick={() => onSelectNote(note)}
                className="group bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-card hover:shadow-card-hover hover:border-primary/40 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-secondary">
                        {note.categoryEmoji} {note.category}
                      </span>
                      <span className="text-[10px] text-outline font-mono">
                        {new Date(note.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="font-headline text-lg font-medium text-on-surface group-hover:text-primary transition-colors leading-snug">
                      {note.title}
                    </h3>

                    <p className="font-sans text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>

                    {/* Audio memo pill if present */}
                    {note.voiceMemoDuration && (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface font-mono">
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          mic
                        </span>
                        <span>Voice Memo ({note.voiceMemoDuration})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onTogglePin(note.id)}
                      className="p-1.5 text-outline hover:text-primary rounded-full hover:bg-surface-container-low transition-colors"
                      title="Pin note"
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1.5 text-outline hover:text-error rounded-full hover:bg-surface-container-low transition-colors"
                      title="Delete note"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container-low text-[11px] text-outline">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {note.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono">{note.readTime}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
