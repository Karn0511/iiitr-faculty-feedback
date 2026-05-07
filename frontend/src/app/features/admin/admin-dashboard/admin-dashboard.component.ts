import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div class="mb-8">
        <h1 class="section-header">Admin Dashboard</h1>
        <p class="section-sub">Welcome back, {{ auth.currentUser()?.name }}. Manage your institute data.</p>
      </div>

      <!-- Placeholder stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="stat-card" *ngFor="let stat of placeholderStats">
          <div class="text-2xl">{{ stat.icon }}</div>
          <div class="stat-value">—</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>

      <div class="glass-card p-8 text-center">
        <div class="text-4xl mb-4">🚀</div>
        <p class="text-white font-semibold">Admin portal ready</p>
        <p class="text-slate-400 text-sm mt-1">Full dashboard UI coming in the next phase.</p>
      </div>
    </div>
  `
})
export class AdminDashboardComponent {
  auth = inject(AuthService);
  placeholderStats = [
    { icon: '👥', label: 'Total Students' },
    { icon: '🎓', label: 'Total Faculty'  },
    { icon: '📝', label: 'Total Feedback' },
    { icon: '⭐', label: 'Institute Avg'  },
  ];
}
