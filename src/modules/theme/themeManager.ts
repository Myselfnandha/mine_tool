import { ThemeMode } from '../../types';

export class ThemeManager {
  /**
   * Determines whether it is nighttime (between 18:00 and 06:00 / 6 PM and 6 AM).
   * Supports an optional custom date for testing.
   */
  public static isNightTime(customDate?: Date): boolean {
    const d = customDate || new Date();
    const hours = d.getHours();
    return hours >= 18 || hours < 6;
  }

  /**
   * Resolves effective theme ('dark' or 'light') based on mode setting and current time.
   */
  public static resolveEffectiveTheme(mode: ThemeMode, customDate?: Date): 'dark' | 'light' {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    return this.isNightTime(customDate) ? 'dark' : 'light';
  }

  /**
   * Applies the resolved theme to the DOM (adds or removes 'dark' class on <html>).
   */
  public static applyTheme(mode: ThemeMode): 'dark' | 'light' {
    if (typeof document === 'undefined') return 'light';
    const effective = this.resolveEffectiveTheme(mode);
    if (effective === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return effective;
  }
}
