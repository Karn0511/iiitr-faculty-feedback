import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div class="mb-8">
        <h1 class="section-header">My Courses</h1>
        <p class="section-sub">Welcome, {{ auth.currentUser()?.name }}. Submit your feedback below.</p>
      </div>
      <div class="glass-card p-8 text-center">
        <div class="text-4xl mb-4">📚</div>
        <p class="text-white font-semibold">Student portal ready</p>
        <p class="text-slate-400 text-sm mt-1">Your course list and feedback forms are coming next.</p>
      </div>
    </div>
  `
})
export class StudentDashboardComponent {
  auth = inject(AuthService);
}
