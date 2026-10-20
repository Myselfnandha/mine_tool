import { describe, it, expect } from 'vitest';
import { HighlightEngine } from './highlightEngine';

describe('HighlightEngine Module', () => {
  it('creates a highlight with correct color, offsets, and metadata', () => {
    const hl = HighlightEngine.createHighlight(
      'Tactile stationery palette',
      12,
      38,
      'amber',
      'Core insight note'
    );

    expect(hl.text).toBe('Tactile stationery palette');
    expect(hl.start).toBe(12);
    expect(hl.end).toBe(38);
    expect(hl.color).toBe('amber');
    expect(hl.annotation).toBe('Core insight note');
    expect(hl.id).toContain('hl_');
  });

  it('supports sage and blue highlight colors with correct styling definitions', () => {
    expect(HighlightEngine.HIGHLIGHT_STYLES.sage.label).toContain('Sage');
    expect(HighlightEngine.HIGHLIGHT_STYLES.blue.label).toContain('Blue');
    expect(HighlightEngine.HIGHLIGHT_STYLES.amber.label).toContain('Amber');
  });

  it('sorts multiple highlights chronologically by start offset', () => {
    const h1 = HighlightEngine.createHighlight('first', 50, 60);
    const h2 = HighlightEngine.createHighlight('second', 10, 20);
    const h3 = HighlightEngine.createHighlight('third', 30, 40);

    const sorted = HighlightEngine.sortHighlights([h1, h2, h3]);
    expect(sorted[0].text).toBe('second');
    expect(sorted[1].text).toBe('third');
    expect(sorted[2].text).toBe('first');
  });

  it('detects overlapping highlight ranges accurately', () => {
    const h1 = HighlightEngine.createHighlight('range1', 10, 30);
    const h2 = HighlightEngine.createHighlight('range2', 25, 45);
    const h3 = HighlightEngine.createHighlight('range3', 50, 70);

    expect(HighlightEngine.hasOverlap(h1, h2)).toBe(true);
    expect(HighlightEngine.hasOverlap(h1, h3)).toBe(false);
  });
});
