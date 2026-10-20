import { describe, it, expect } from 'vitest';
import { LinkCategorizer } from './linkCategorizer';

describe('LinkCategorizer Module', () => {
  it('extracts domain correctly from various URL formats', () => {
    expect(LinkCategorizer.extractDomain('https://github.com/torvalds/linux')).toBe('github.com');
    expect(LinkCategorizer.extractDomain('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube.com');
    expect(LinkCategorizer.extractDomain('arxiv.org/abs/2301.00001')).toBe('arxiv.org');
    expect(LinkCategorizer.extractDomain('http://subdomain.medium.com/post/123')).toBe('subdomain.medium.com');
  });

  it('correctly maps GitHub to Dev & Engineering', () => {
    const classification = LinkCategorizer.classifyDomain('github.com');
    expect(classification.category).toBe('Dev & Engineering');
    expect(classification.folderName).toBe('Code & Repositories');
    expect(classification.icon).toBe('terminal');
  });

  it('correctly maps YouTube to Media & Video', () => {
    const classification = LinkCategorizer.classifyDomain('youtube.com');
    expect(classification.category).toBe('Media & Video');
    expect(classification.folderName).toBe('Video & Audio Logs');
  });

  it('correctly maps Figma to Design & Aesthetics', () => {
    const classification = LinkCategorizer.classifyDomain('figma.com');
    expect(classification.category).toBe('Design & Aesthetics');
    expect(classification.folderName).toBe('Design Systems & Inspiration');
  });

  it('auto-creates custom domain folder for unlisted domains without failing', () => {
    const classification = LinkCategorizer.classifyDomain('rust-lang.org');
    expect(classification.category).toBe('General Reference');
    expect(classification.folderName).toBe('Rust lang Archive');
  });

  it('executes zero-confirmation processIncomingShare invariant', () => {
    const shared = LinkCategorizer.processIncomingShare('Check this out: https://github.com/facebook/react');
    expect(shared.domain).toBe('github.com');
    expect(shared.folderCategory).toBe('Dev & Engineering');
    expect(shared.url).toBe('https://github.com/facebook/react');
    expect(shared.title).toBeDefined();
    expect(shared.id).toContain('link_');
    expect(shared.isRead).toBe(false);
  });
});
