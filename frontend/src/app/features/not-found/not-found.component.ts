import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="text-center animate-slide-up">
        <div class="text-8xl font-black text-transparent mb-4"
             style="background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; background-clip: text;">
          404
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p class="text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
        <a routerLink="/login" class="btn-primary">Go Back Home</a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
