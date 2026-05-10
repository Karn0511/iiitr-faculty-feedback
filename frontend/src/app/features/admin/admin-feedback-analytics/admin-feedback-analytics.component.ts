import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-feedback-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10">

      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 mb-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-[80px]"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px]"></div>

        <div class="relative z-10">
          <span class="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Analytics</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Feedback Analytics</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Detailed view of all student feedback submissions and faculty ratings across the institute.
          </p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex p-1 bg-slate-950/60 border border-surface-border rounded-xl mb-8 w-fit">
        <button (click)="activeTab.set('students')"
                class="px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200"
                [ngClass]="activeTab() === 'students' ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black' : 'text-slate-400 hover:text-white'">
          👥 Students Feedback
        </button>
        <button (click)="activeTab.set('faculty')"
                class="px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200"
                [ngClass]="activeTab() === 'faculty' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black' : 'text-slate-400 hover:text-white'">
          👨‍🏫 Faculty Ratings
        </button>
      </div>

      <!-- STUDENTS FEEDBACK TAB -->
      <div *ngIf="activeTab() === 'students'" class="space-y-6 animate-fade-in">
        <div class="glass-card p-6 sm:p-8 border border-surface-border bg-slate-950/40 rounded-3xl">
          <h3 class="text-white font-black text-lg mb-4">Student Feedback Summary</h3>

          <!-- Summary Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20">
              <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Total Students</div>
              <div class="text-2xl font-black text-blue-400">{{ totalStudents() }}</div>
            </div>
            <div class="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
              <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Submitted Feedback</div>
              <div class="text-2xl font-black text-emerald-400">{{ feedbackSubmitted() }}</div>
            </div>
            <div class="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20">
              <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Participation Rate</div>
              <div class="text-2xl font-black text-purple-400">{{ getParticipationRate() }}%</div>
            </div>
          </div>

          <!-- Student List Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b border-slate-800">
                <tr>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Student Name</th>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Roll No</th>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Section</th>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Status</th>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Feedback Count</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let student of studentsList()" class="border-b border-slate-900/50 hover:bg-slate-900/30 transition-colors">
                  <td class="py-3 px-4 text-slate-300 font-semibold">{{ student.name }}</td>
                  <td class="py-3 px-4 text-slate-400">{{ student.rollNo }}</td>
                  <td class="py-3 px-4 text-slate-400">{{ student.section }}</td>
                  <td class="py-3 px-4">
                    <span *ngIf="student.submitted" class="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      Submitted
                    </span>
                    <span *ngIf="!student.submitted" class="inline-block px-2.5 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-400 text-xs font-semibold">
                      Pending
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-300 font-bold">{{ student.feedbackCount || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- FACULTY RATINGS TAB -->
      <div *ngIf="activeTab() === 'faculty'" class="space-y-6 animate-fade-in">
        <div class="glass-card p-6 sm:p-8 border border-surface-border bg-slate-950/40 rounded-3xl">
          <h3 class="text-white font-black text-lg mb-4">Faculty Performance Ratings</h3>

          <!-- Summary Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
              <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Total Faculty</div>
              <div class="text-2xl font-black text-emerald-400">{{ totalFaculty() }}</div>
            </div>
            <div class="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20">
              <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Total Feedback</div>
              <div class="text-2xl font-black text-blue-400">{{ totalFeedbackCount() }}</div>
            </div>
            <div class="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20">
              <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Institute Average</div>
              <div class="text-2xl font-black text-purple-400">{{ instituteAverage() | number:'1.1-1' }}/10</div>
            </div>
          </div>

          <!-- Faculty Rankings Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b border-slate-800">
                <tr>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Rank</th>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Faculty Name</th>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Email</th>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Courses</th>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Feedback Count</th>
                  <th class="text-left py-3 px-4 text-xs font-bold uppercase text-slate-400">Average Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let faculty of facultyList(); let idx = index" class="border-b border-slate-900/50 hover:bg-slate-900/30 transition-colors">
                  <td class="py-3 px-4 text-slate-300 font-black">#{{ idx + 1 }}</td>
                  <td class="py-3 px-4 text-slate-300 font-semibold">{{ faculty.name }}</td>
                  <td class="py-3 px-4 text-slate-400">{{ faculty.email }}</td>
                  <td class="py-3 px-4 text-slate-400">{{ faculty.courseCount || 0 }}</td>
                  <td class="py-3 px-4 text-slate-300 font-bold">{{ faculty.feedbackCount || 0 }}</td>
                  <td class="py-3 px-4">
                    <span class="inline-block px-3 py-1 rounded-full font-black text-sm font-mono"
                          [ngClass]="{
                            'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30': faculty.averageScore >= 8,
                            'bg-blue-500/15 text-blue-400 border border-blue-500/30': faculty.averageScore >= 7 && faculty.averageScore < 8,
                            'bg-amber-500/15 text-amber-400 border border-amber-500/30': faculty.averageScore < 7
                          }">
                      {{ faculty.averageScore | number:'1.1-1' }}/10
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    .animate-fade-in {
      animation: fade-in 0.22s ease-out forwards;
    }
  `]
})
export class AdminFeedbackAnalyticsComponent implements OnInit {
  private admin = inject(AdminService);
  private auth = inject(AuthService);

  readonly activeTab = signal<'students' | 'faculty'>('students');

  // Students data
  readonly studentsList = signal<any[]>([]);
  readonly totalStudents = signal(0);
  readonly feedbackSubmitted = signal(0);

  // Faculty data
  readonly facultyList = signal<any[]>([]);
  readonly totalFaculty = signal(0);
  readonly totalFeedbackCount = signal(0);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load admin stats
    this.admin.getGlobalStats().subscribe({
      next: (res: any) => {
        this.totalStudents.set(res?.data?.totalStudents || 0);
        this.feedbackSubmitted.set(res?.data?.totalFeedback || 0);
      },
      error: () => {}
    });

    // Load faculty leaderboard
    this.admin.getFacultyLeaderboard().subscribe({
      next: (res: any) => {
        const data = res?.data?.leaderboard || [];
        this.facultyList.set(data);
        this.totalFaculty.set(data.length);
        this.totalFeedbackCount.set(data.reduce((sum: number, f: any) => sum + (f.totalSubmissions || 0), 0));
      },
      error: () => {}
    });

    // Mock student data for now
    this.studentsList.set([
      { name: 'Karn Ashutosh', rollNo: '2026-CS-42', section: 'A', submitted: true, feedbackCount: 4 },
      { name: 'Raj Kumar', rollNo: '2026-CS-43', section: 'A', submitted: true, feedbackCount: 3 },
      { name: 'Priya Singh', rollNo: '2026-CS-44', section: 'B', submitted: false, feedbackCount: 0 },
      { name: 'Amit Patel', rollNo: '2026-CS-45', section: 'B', submitted: true, feedbackCount: 4 },
      { name: 'Sneha Das', rollNo: '2026-CS-46', section: 'A', submitted: false, feedbackCount: 0 }
    ]);
  }

  getParticipationRate(): number {
    const total = this.totalStudents();
    if (total === 0) return 0;
    return Math.round((this.feedbackSubmitted() / total) * 100);
  }

  instituteAverage(): number {
    const faculty = this.facultyList();
    if (faculty.length === 0) return 0;
    const sum = faculty.reduce((acc, f) => acc + (f.averageScore || 0), 0);
    return sum / faculty.length;
  }
}
