import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  activeTheme = signal<'academic' | 'cyber'>('academic');

  constructor() {
    // Check local storage for saved theme
    const savedTheme = localStorage.getItem('theme') as 'academic' | 'cyber';
    if (savedTheme) {
      this.activeTheme.set(savedTheme);
    }

    // Effect automatically runs when activeTheme changes
    effect(() => {
      const theme = this.activeTheme();
      localStorage.setItem('theme', theme);
      
      const root = document.documentElement;
      if (theme === 'cyber') {
        root.classList.add('theme-cyber');
        root.classList.remove('theme-academic');
      } else {
        root.classList.add('theme-academic');
        root.classList.remove('theme-cyber');
      }
    });
  }

  toggleTheme() {
    this.activeTheme.update(t => t === 'academic' ? 'cyber' : 'academic');
  }
}
