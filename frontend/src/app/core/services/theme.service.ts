import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor() {
    // Always enforce professional academic light mode globally
    document.documentElement.classList.remove('theme-cyber');
    document.documentElement.classList.add('theme-academic');
    localStorage.setItem('theme', 'academic');
  }
}
