import { Highlight, HighlightColor } from '../../types';

export class HighlightEngine {
  public static HIGHLIGHT_STYLES: Record<HighlightColor, { bg: string; text: string; border: string; label: string }> = {
    amber: {
      bg: 'bg-primary-fixed/60 hover:bg-primary-fixed/80',
      text: 'text-on-primary-fixed',
      border: 'border-b-2 border-primary',
      label: 'Cognac Amber (Core Insight)',
    },
    sage: {
      bg: 'bg-secondary-container/60 hover:bg-secondary-container/80',
      text: 'text-on-secondary-container',
      border: 'border-b-2 border-secondary',
      label: 'Forest Sage (Methodology)',
    },
    blue: {
      bg: 'bg-tertiary-fixed/60 hover:bg-tertiary-fixed/80',
      text: 'text-on-tertiary-fixed',
      border: 'border-b-2 border-tertiary',
      label: 'Sapphire Blue (Citation)',
    },
  };

  /**
   * Creates a new highlight entry for a text selection
   */
  public static createHighlight(
    text: string,
    start: number,
    end: number,
    color: HighlightColor = 'amber',
    annotation?: string
  ): Highlight {
    return {
      id: 'hl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: text.trim(),
      start,
      end,
      color,
      annotation,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Sorts highlights by character start offset
   */
  public static sortHighlights(highlights: Highlight[]): Highlight[] {
    return [...highlights].sort((a, b) => a.start - b.start);
  }

  /**
   * Check if a highlight can be cleanly merged or overlaps
   */
  public static hasOverlap(h1: Highlight, h2: Highlight): boolean {
    return Math.max(h1.start, h2.start) < Math.min(h1.end, h2.end);
  }
}
