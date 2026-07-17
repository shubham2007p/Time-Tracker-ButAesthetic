/**
 * Theme management for Time Canvas
 */

export class ThemeManager {
  constructor() {
    this.themes = ['light', 'dark', 'system'];
    this.currentTheme = localStorage.getItem('theme') || 'system';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    this.init();
  }

  init() {
    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme();
      }
    });

    this.applyTheme();
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (!this.themes.includes(theme)) return;
    this.currentTheme = theme;
    
    if (theme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', theme);
    }
    
    this.applyTheme();
    this.dispatchThemeChangeEvent();
  }

  cycleTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.setTheme(this.themes[nextIndex]);
  }

  applyTheme() {
    let resolvedTheme = this.currentTheme;
    
    if (this.currentTheme === 'system') {
      resolvedTheme = this.mediaQuery.matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    
    // Update theme toggle UI attribute for accessibility
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', `Current theme: ${this.currentTheme}. Click to change.`);
      themeBtn.setAttribute('data-current-theme', this.currentTheme);
    }
  }

  dispatchThemeChangeEvent() {
    const event = new CustomEvent('themechanged', { detail: { theme: this.currentTheme } });
    window.dispatchEvent(event);
  }
}
