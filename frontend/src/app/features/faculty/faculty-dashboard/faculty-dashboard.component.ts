import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-faculty-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div class="mb-8">
        <h1 class="section-header">Faculty Dashboard</h1>
        <p class="section-sub">Hello, {{ auth.currentUser()?.name }}. Your analytics are loading soon.</p>
      </div>
      <div class="glass-card p-8 text-center">
        <div class="text-4xl mb-4">📊</div>
        <p class="text-white font-semibold">Faculty analytics portal ready</p>
        <p class="text-slate-400 text-sm mt-1">Score charts and AI insights coming in the next phase.</p>
      </div>
    </div>
  `
})
export class FacultyDashboardComponent {
  auth = inject(AuthService);
}
