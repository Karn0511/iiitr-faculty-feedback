import { Component, signal, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SpinnerService {
  readonly loading = signal(false);
  show() { this.loading.set(true);  }
  hide() { this.loading.set(false); }
}

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="spinner.loading()"
         class="fixed inset-0 z-[9999] flex items-center justify-center"
         style="background: rgba(15,23,42,0.7); backdrop-filter: blur(4px);">
      <div class="flex flex-col items-center gap-4">
        <!-- Animated ring spinner -->
        <div class="relative w-16 h-16">
          <div class="absolute inset-0 rounded-full border-4 border-surface-border"></div>
          <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin"></div>
          <div class="absolute inset-2 rounded-full border-4 border-transparent border-t-violet-400 animate-spin"
               style="animation-direction: reverse; animation-duration: 0.75s;"></div>
        </div>
        <p class="text-slate-300 text-sm font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  `
})
export class SpinnerComponent {
  constructor(public spinner: SpinnerService) {}
}
