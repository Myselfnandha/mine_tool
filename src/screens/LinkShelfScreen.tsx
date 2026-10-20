import React, { useState } from 'react';
import { SharedLink } from '../types';
import { LinkCategorizer } from '../modules/links/linkCategorizer';

interface LinkShelfScreenProps {
  links: SharedLink[];
  onAddLink: (link: SharedLink) => void;
  onToggleRead: (id: string) => void;
  onDeleteLink: (id: string) => void;
}

export const LinkShelfScreen: React.FC<LinkShelfScreenProps> = ({
  links,
  onAddLink,
  onToggleRead,
  onDeleteLink,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Group links by folder category
  const folderStats = links.reduce<Record<string, { count: number; icon: string; color: string }>>(
    (acc, link) => {
      if (!acc[link.folderCategory]) {
        acc[link.folderCategory] = {
          count: 0,
          icon: link.folderIcon || 'folder',
          color: link.folderColor || '#005EA4',
        };
      }
      acc[link.folderCategory].count += 1;
      return acc;
    },
    {}
  );

  const sampleUrls = [
    { label: 'GitHub Repo', url: 'https://github.com/astral-sh/uv' },
    { label: 'Arxiv Preprint', url: 'https://arxiv.org/abs/2402.12345' },
    { label: 'YouTube Video', url: 'https://youtube.com/watch?v=calm-computing-doc' },
    { label: 'Figma System', url: 'https://figma.com/@nordic-minimalism' },
    { label: 'Substack Essay', url: 'https://substack.com/@unhurried-craft' },
  ];

  const handleSimulateShare = (rawUrl: string) => {
    if (!rawUrl.trim()) return;
    // ZERO CONFIRMATION INVARIANT:
    // Process URL, categorize domain into folder, and save immediately without prompt!
    const processedLink = LinkCategorizer.processIncomingShare(rawUrl);
    onAddLink(processedLink);
    setInputUrl('');
  };

  const filteredLinks = links.filter((link) => {
    if (selectedFolder !== 'all' && link.folderCategory !== selectedFolder) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        link.title.toLowerCase().includes(q) ||
        link.domain.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Zero-Confirmation Share Intent Simulation Header */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">share</span>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface">
                Instant Share & Auto-Folder Engine
              </h2>
            </div>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              When you share a link from Android or your browser, Mine Notes automatically parses the domain, assigns it to a curated domain folder, and persists it <strong>silently with zero confirmation dialogues</strong>.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-medium flex-shrink-0">
            Zero-Confirmation Active
          </span>
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSimulateShare(inputUrl);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
              link
            </span>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste any URL here (e.g., https://github.com/torvalds/linux)..."
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl pl-9 pr-3.5 py-2.5 font-sans text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={!inputUrl.trim()}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-medium shadow-xs hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            <span>Auto-File</span>
            <span className="material-symbols-outlined text-[16px]">bolt</span>
          </button>
        </form>

        {/* Quick test presets */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
          <span className="text-outline font-medium">Quick Simulators:</span>
          {sampleUrls.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSimulateShare(s.url)}
              className="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              + {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Domain Folders Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
            <span>Domain Folders ({Object.keys(folderStats).length})</span>
          </h3>
          <button
            onClick={() => setSelectedFolder('all')}
            className={`text-xs font-medium transition-colors ${
              selectedFolder === 'all' ? 'text-primary font-bold' : 'text-outline hover:text-on-surface'
            }`}
          >
            Show All ({links.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {Object.entries(folderStats).map(([folderName, info]) => {
            const isSelected = selectedFolder === folderName;
            return (
              <button
                key={folderName}
                onClick={() => setSelectedFolder(isSelected ? 'all' : folderName)}
                className={`flex flex-col items-start justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-surface-container-lowest border-primary shadow-card ring-1 ring-primary'
                    : 'bg-surface-container-low/60 border-outline-variant/30 hover:bg-surface-container-lowest hover:border-outline-variant'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white mb-2"
                  style={{ backgroundColor: info.color }}
                >
                  <span className="material-symbols-outlined text-[16px]">{info.icon}</span>
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-on-surface truncate leading-tight">
                    {folderName}
                  </p>
                  <p className="text-[11px] font-mono text-outline mt-0.5">{info.count} saved</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Saved Links Stream */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-surface-container-high/60">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {selectedFolder === 'all' ? 'All Captured Links' : selectedFolder}
            </h3>
            <span className="text-xs font-mono text-outline">({filteredLinks.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter links..."
              className="bg-surface-container-low border border-outline-variant/40 rounded-lg px-2.5 py-1 text-xs text-on-surface placeholder:text-outline focus:outline-none"
            />
          </div>
        </div>

        {filteredLinks.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-low/40 rounded-xl border border-dashed border-outline-variant/50">
            <span className="material-symbols-outlined text-[36px] text-outline mb-1">
              bookmark_border
            </span>
            <p className="font-headline text-base text-on-surface">No links in this folder</p>
            <p className="font-sans text-xs text-outline mt-0.5">
              Paste a URL above to auto-categorize into this folder.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLinks.map((link) => (
              <div
                key={link.id}
                className="group bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <img
                    src={link.faviconUrl || `https://www.google.com/s2/favicons?domain=${link.domain}&sz=64`}
                    alt={link.domain}
                    className="w-5 h-5 rounded mt-0.5 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: `${link.folderColor}15`,
                          color: link.folderColor,
                        }}
                      >
                        {link.folderCategory}
                      </span>
                      <span className="text-[11px] font-mono text-outline">{link.domain}</span>
                      <span className="text-[10px] text-outline">
                        {new Date(link.savedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-medium text-on-surface hover:text-primary transition-colors flex items-center gap-1.5 leading-snug"
                    >
                      <span>{link.title}</span>
                      <span className="material-symbols-outlined text-[14px] text-outline">
                        open_in_new
                      </span>
                    </a>

                    <p className="font-sans text-xs text-on-surface-variant line-clamp-1">
                      {link.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => onToggleRead(link.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      link.isRead
                        ? 'bg-surface-container text-outline'
                        : 'bg-primary-fixed text-on-primary-fixed'
                    }`}
                  >
                    {link.isRead ? 'Archived' : 'Unread'}
                  </button>
                  <button
                    onClick={() => onDeleteLink(link.id)}
                    className="text-outline hover:text-error p-1 rounded transition-colors"
                    title="Delete link"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
