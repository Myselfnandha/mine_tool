import { describe, it, expect } from 'vitest';
import { ThemeManager } from './themeManager';

describe('ThemeManager Module', () => {
  it('detects nighttime correctly across evening and night hours (18:00 to 05:59)', () => {
    // 8:00 PM (20:00) -> night
    const evening = new Date('2026-10-21T20:00:00');
    expect(ThemeManager.isNightTime(evening)).toBe(true);

    // 00:30 AM -> night
    const midnight = new Date('2026-10-21T00:30:00');
    expect(ThemeManager.isNightTime(midnight)).toBe(true);

    // 05:45 AM -> night
    const dawn = new Date('2026-10-21T05:45:00');
    expect(ThemeManager.isNightTime(dawn)).toBe(true);
  });

  it('detects daytime correctly across daylight hours (06:00 to 17:59)', () => {
    // 06:00 AM -> daytime
    const morning = new Date('2026-10-21T06:00:00');
    expect(ThemeManager.isNightTime(morning)).toBe(false);

    // 12:00 PM -> daytime
    const noon = new Date('2026-10-21T12:00:00');
    expect(ThemeManager.isNightTime(noon)).toBe(false);

    // 17:59 PM -> daytime
    const dusk = new Date('2026-10-21T17:59:00');
    expect(ThemeManager.isNightTime(dusk)).toBe(false);
  });

  it('resolves auto mode dynamically based on time of day', () => {
    const nightTime = new Date('2026-10-21T21:00:00');
    const dayTime = new Date('2026-10-21T11:00:00');

    expect(ThemeManager.resolveEffectiveTheme('auto', nightTime)).toBe('dark');
    expect(ThemeManager.resolveEffectiveTheme('auto', dayTime)).toBe('light');
  });

  it('respects manual light or dark overrides', () => {
    const nightTime = new Date('2026-10-21T23:00:00');
    const dayTime = new Date('2026-10-21T14:00:00');

    // Manual light override during night
    expect(ThemeManager.resolveEffectiveTheme('light', nightTime)).toBe('light');

    // Manual dark override during day
    expect(ThemeManager.resolveEffectiveTheme('dark', dayTime)).toBe('dark');
  });
});
