import React, { useState } from 'react';
import { Note, Highlight, HighlightColor, NoteChecklistItem } from '../types';
import { HighlightEngine } from '../modules/editor/highlightEngine';

interface NoteEditorScreenProps {
  note: Note;
  onSave: (updatedNote: Note) => void;
  onBack: () => void;
  onDelete?: (id: string) => void;
}

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({
  note,
  onSave,
  onBack,
  onDelete,
}) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [newTagInput, setNewTagInput] = useState('');
  const [checklists, setChecklists] = useState<NoteChecklistItem[]>(note.checklists || []);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [highlights, setHighlights] = useState<Highlight[]>(note.highlights || []);
  const [activeHighlightColor, setActiveHighlightColor] = useState<HighlightColor>('amber');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasVoiceMemo, setHasVoiceMemo] = useState(!!note.voiceMemoDuration);

  // Compute word count & read time
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

  const handleApplyHighlight = (color: HighlightColor) => {
    setActiveHighlightColor(color);
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      alert('Select text inside the note content first, then click a highlight marker.');
      return;
    }
    const selectedText = selection.toString().trim();
    const start = content.indexOf(selectedText);
    const end = start >= 0 ? start + selectedText.length : 0;

    const newHl = HighlightEngine.createHighlight(
      selectedText,
      start,
      end,
      color,
      `Annotated on ${new Date().toLocaleDateString()}`
    );
    const updated = [...highlights, newHl];
    setHighlights(updated);
  };

  const handleRemoveHighlight = (id: string) => {
    setHighlights(highlights.filter((h) => h.id !== id));
  };

  const handleToggleChecklist = (id: string) => {
    setChecklists(
      checklists.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: NoteChecklistItem = {
      id: 'c_' + Date.now(),
      text: newChecklistText.trim(),
      completed: false,
    };
    setChecklists([...checklists, newItem]);
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklists(checklists.filter((c) => c.id !== id));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const clean = newTagInput.trim().replace(/^#/, '');
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    const updatedNote: Note = {
      ...note,
      title: title.trim() || 'Untitled Note',
      content,
      category,
      isPinned,
      tags,
      checklists,
      highlights,
      readTime: `${readTimeMinutes} min read`,
      voiceMemoDuration: hasVoiceMemo ? note.voiceMemoDuration || '02:15' : undefined,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedNote);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-36 space-y-6">
      {/* Top action header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/60">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
              isPinned
                ? 'bg-primary-fixed text-on-primary-fixed font-medium'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className={`material-symbols-outlined text-[16px] ${isPinned ? 'fill text-primary' : ''}`}>
              bookmark
            </span>
            <span>{isPinned ? 'Pinned' : 'Pin'}</span>
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 text-outline hover:text-error rounded-full hover:bg-surface-container transition-colors"
              title="Delete note"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Category & Tag Strip */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/60 rounded-lg px-2.5 py-1 text-on-surface font-sans text-xs focus:outline-none focus:border-primary"
        >
          <option value="Studio & Work">💼 Studio & Work</option>
          <option value="Ideas">💡 Ideas & Concept</option>
          <option value="Reading">📖 Reading & Articles</option>
          <option value="Research">🔬 Research & Academic</option>
          <option value="Personal Sanctuary">🌿 Personal Sanctuary</option>
        </select>

        {/* Existing tags */}
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px]"
          >
            #{t}
            <button
              onClick={() => handleRemoveTag(t)}
              className="hover:text-error"
            >
              ×
            </button>
          </span>
        ))}

        {/* Add tag input */}
        <input
          type="text"
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="+ Add tag (Enter)"
          className="bg-transparent text-[11px] text-outline placeholder:text-outline/70 focus:outline-none w-28"
        />
      </div>

      {/* Main Title Input (Newsreader Editorial Display) */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note Title..."
        className="w-full font-display text-3xl sm:text-4xl font-normal text-on-surface bg-transparent border-none focus:outline-none placeholder:text-outline/50 tracking-tight"
      />

      {/* Reading Metadata */}
      <div className="flex items-center gap-3 text-xs text-outline font-mono">
        <span>{words} words</span>
        <span>•</span>
        <span>{readTimeMinutes} min read</span>
        <span>•</span>
        <span>
          Edited {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Highlighting Toolbar (Physical Highlighter Metaphor) */}
      <div className="flex items-center justify-between p-2.5 bg-surface-container-low/70 border border-outline-variant/50 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-sans font-medium text-on-surface-variant uppercase tracking-wider mr-1">
            Ink Highlights:
          </span>
          <button
            onClick={() => handleApplyHighlight('amber')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FFDBC7] text-[#733500] text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-xs"
            title="Highlight selection in Cognac Amber (Core insight)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#C25E00]"></span>
            <span>Amber</span>
          </button>
          <button
            onClick={() => handleApplyHighlight('sage')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#C5F090] text-[#2E4F00] text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-xs"
            title="Highlight selection in Forest Sage (Methodology)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#3F6212]"></span>
            <span>Sage</span>
          </button>
          <button
            onClick={() => handleApplyHighlight('blue')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#D2E4FF] text-[#004880] text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-xs"
            title="Highlight selection in Sapphire Blue (Citation)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#005EA4]"></span>
            <span>Blue</span>
          </button>
        </div>

        <button
          onClick={() => setHasVoiceMemo(!hasVoiceMemo)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            hasVoiceMemo
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
          }`}
          title="Toggle voice memo attachment"
        >
          <span className="material-symbols-outlined text-[16px]">mic</span>
          <span>{hasVoiceMemo ? 'Voice Attached' : '+ Voice Memo'}</span>
        </button>
      </div>

      {/* Voice Memo Audio Waveform Capsule if enabled */}
      {hasVoiceMemo && (
        <div className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3.5 shadow-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-xs active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isPlayingAudio ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <div>
              <p className="text-xs font-medium text-on-surface">Field Recording Audio Capsule</p>
              <p className="text-[11px] text-outline font-mono">
                {isPlayingAudio ? 'Playing 01:24 / 03:42' : 'Duration 03:42 • 44.1kHz PCM'}
              </p>
            </div>
          </div>

          {/* Dynamic simulated audio waveform bars */}
          <div className="flex items-center gap-1 h-8 flex-1 max-w-xs justify-end pr-2">
            {[30, 65, 45, 90, 80, 50, 75, 40, 95, 60, 35, 85, 70, 40, 60, 90, 50].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isPlayingAudio ? 'bg-primary animate-pulse' : 'bg-outline-variant'
                }`}
                style={{
                  height: `${isPlayingAudio ? Math.max(20, (h * (i % 2 === 0 ? 1 : 0.7))) : h * 0.4}%`,
                }}
              ></span>
            ))}
          </div>
        </div>
      )}

      {/* In-Editor Highlight Cards Section (if highlights exist) */}
      {highlights.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-[11px] font-sans font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">highlight</span>
            <span>Active Highlights & Marginalia ({highlights.length})</span>
          </h4>
          <div className="space-y-2">
            {highlights.map((hl) => (
              <div
                key={hl.id}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg border bg-surface-container-low/50 border-outline-variant/40 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <p
                    className={`font-headline italic text-sm ${
                      hl.color === 'amber'
                        ? 'text-[#733500] bg-[#FFDBC7]/60 px-1.5 py-0.5 rounded'
                        : hl.color === 'sage'
                        ? 'text-[#2E4F00] bg-[#C5F090]/60 px-1.5 py-0.5 rounded'
                        : 'text-[#004880] bg-[#D2E4FF]/60 px-1.5 py-0.5 rounded'
                    }`}
                  >
                    "{hl.text}"
                  </p>
                  {hl.annotation && (
                    <p className="text-[11px] text-outline font-sans">
                      Annotation: {hl.annotation}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveHighlight(hl.id)}
                  className="text-outline hover:text-error p-1"
                  title="Remove highlight"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Embedded Checklists */}
      <div className="space-y-2 pt-2">
        <h4 className="text-[11px] font-sans font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary">checklist</span>
            <span>Actionable Items ({checklists.filter((c) => c.completed).length}/{checklists.length})</span>
          </span>
        </h4>

        <div className="space-y-1.5">
          {checklists.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 p-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg"
            >
              <label className="flex items-center gap-2.5 text-xs text-on-surface cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleChecklist(item.id)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span className={item.completed ? 'line-through text-outline' : ''}>
                  {item.text}
                </span>
              </label>
              <button
                onClick={() => handleRemoveChecklist(item.id)}
                className="text-outline hover:text-error p-0.5"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}

          {/* Quick add checklist item */}
          <form onSubmit={handleAddChecklist} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              placeholder="+ Add checklist task..."
              className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-1.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!newChecklistText.trim()}
              className="px-3 py-1.5 rounded-lg bg-secondary text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Main Longform Editor Textarea */}
      <div className="pt-2">
        <label className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-outline mb-1.5">
          Prose & Observations
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          placeholder="Begin writing... Select any passage above to apply an ink highlight."
          className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 font-body text-base text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary leading-relaxed resize-y shadow-card"
        />
      </div>
    </div>
  );
};
