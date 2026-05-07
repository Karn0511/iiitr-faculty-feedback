import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor() {
    // Always enforce dark mode globally — remove any lingering light theme class
    document.documentElement.classList.remove('theme-academic');
    localStorage.setItem('theme', 'cyber');
  }
}
