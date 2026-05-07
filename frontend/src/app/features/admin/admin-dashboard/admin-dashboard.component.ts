import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStats, FacultyLeaderboardItem, QuestionItem, FeedbackSessionItem } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 mb-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-violet-500/10 blur-[80px]"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px]"></div>

        <div class="relative z-10">
          <span class="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">SYSTEM CONTROL</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Administrative Portal</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Welcome, <span class="text-white font-semibold">{{ auth.currentUser()?.name }}</span>.
            Manage evaluation survey structures, soft-toggle active questionnaire items, monitor sessions, and inspect leaderboards.
          </p>
        </div>

        <!-- Global stats cards -->
        <div class="relative z-10 flex flex-wrap gap-4">
          <div class="bg-slate-900/60 border border-surface-border p-4 rounded-2xl flex items-center gap-3 w-40 sm:w-44">
            <span class="text-2xl">🎓</span>
            <div>
              <div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Students</div>
              <div class="text-base font-black text-white font-mono">{{ stats()?.totalStudents || 0 }}</div>
            </div>
          </div>
          <div class="bg-slate-900/60 border border-surface-border p-4 rounded-2xl flex items-center gap-3 w-40 sm:w-44">
            <span class="text-2xl">📋</span>
            <div>
              <div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Feedback</div>
              <div class="text-base font-black text-white font-mono">{{ stats()?.totalFeedback || 0 }}</div>
            </div>
          </div>
          <div class="bg-slate-900/60 border border-surface-border p-4 rounded-2xl flex items-center gap-3 w-40 sm:w-44">
            <span class="text-2xl">🏛️</span>
            <div>
              <div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Institute Avg</div>
              <div class="text-base font-black text-brand-400 font-mono">
                {{ stats()?.averageInstituteScore || 0 | number:'1.1-1' }}<span class="text-slate-500 text-xs">/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Admin Sections -->
      <div class="grid lg:grid-cols-12 gap-8">

        <!-- LEFT COLUMN: Leaderboard & Feedback Sessions (Lg: 7cols) -->
        <div class="lg:col-span-7 space-y-8">

          <!-- SECTION 1: Questionnaire soft-toggle CRUD -->
          <div class="glass-card p-6 sm:p-8 space-y-6">
            <div class="pb-3 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 class="text-white font-extrabold text-base">Questionnaire Structure</h2>
                <p class="text-slate-400 text-xs mt-0.5">Toggling preserves historical evaluations instead of deleting.</p>
              </div>
              <span class="text-xs font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded font-bold">SOFT-TOGGLE</span>
            </div>

            <!-- Add Question Form -->
            <form (ngSubmit)="onAddQuestion()" class="flex gap-3">
              <input type="text" [(ngModel)]="newQuestionText" name="newQuestion" placeholder="Enter new survey question text..."
                     class="input-field py-3 text-xs flex-1" required />
              <button type="submit" class="btn-primary py-3 px-5 text-xs font-bold uppercase tracking-wider whitespace-nowrap" [disabled]="!newQuestionText.trim()">
                Add Question
              </button>
            </form>

            <!-- Questions list -->
            <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <div *ngFor="let q of questions(); let i = index"
                   class="p-4 rounded-2xl border bg-slate-950/40 flex items-center justify-between gap-4"
                   [ngClass]="q.isActive ? 'border-surface-border' : 'border-dashed border-slate-800 opacity-60'">
                <div class="flex-1">
                  <span class="text-[10px] font-mono text-slate-500 block uppercase font-bold">QUESTION #{{ i + 1 }}</span>
                  <p class="text-xs text-white font-medium mt-1 leading-relaxed">{{ q.questionText }}</p>
                </div>

                <button (click)="toggleQuestion(q._id)"
                        class="px-3.5 py-1.5 text-[10px] font-extrabold tracking-wider rounded-xl uppercase transition-all"
                        [ngClass]="q.isActive ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'">
                  {{ q.isActive ? 'DEACTIVATE' : 'ACTIVATE' }}
                </button>
              </div>
            </div>
          </div>

          <!-- SECTION 2: Faculty Performance Leaderboard -->
          <div class="glass-card p-6 sm:p-8 space-y-4">
            <h2 class="text-white font-extrabold text-base border-b border-surface-border pb-3">Faculty Leaderboard</h2>

            <div *ngIf="leaderboard().length === 0" class="text-center py-6 text-slate-500 text-xs">
              No performance feedback is populated yet. Once students submit, leaderboards will update.
            </div>

            <div *ngIf="leaderboard().length > 0" class="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              <div *ngFor="let item of leaderboard(); let idx = index"
                   class="p-3.5 rounded-2xl bg-slate-950/40 border border-surface-border flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 font-extrabold text-xs flex items-center justify-center font-mono">
                    #{{ idx + 1 }}
                  </span>
                  <div>
                    <h4 class="text-xs font-bold text-white">{{ item.name }}</h4>
                    <p class="text-[10px] text-slate-500 font-medium">{{ item.email }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <span class="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Responses</span>
                    <span class="text-xs font-extrabold text-white font-mono">{{ item.totalSubmissions }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Avg Score</span>
                    <span class="text-sm font-black text-emerald-400 font-mono">{{ item.averageScore | number:'1.1-1' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Evaluation Session Controls (Lg: 5cols) -->
        <div class="lg:col-span-5 space-y-8">

          <!-- SECTION 3: Feedback Session Admin Controls -->
          <div class="glass-card p-6 sm:p-8 space-y-6">
            <div class="pb-3 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 class="text-white font-extrabold text-base">Evaluation Windows</h2>
                <p class="text-slate-400 text-xs mt-0.5">Control active gates for student submissions.</p>
              </div>
              <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">ACTIVE LOCKS</span>
            </div>

            <!-- Create Session Form -->
            <form (ngSubmit)="onCreateSession()" class="space-y-3.5">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule Evaluation Period</h3>
              <div>
                <input type="text" [(ngModel)]="newSessionName" name="sessionName" placeholder="Session Name (e.g. Autumn Midterm 2026)"
                       class="input-field py-2.5 text-xs" required />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Start Date</label>
                  <input type="date" [(ngModel)]="sessionStart" name="start" class="input-field py-2 text-xs" required />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">End Date</label>
                  <input type="date" [(ngModel)]="sessionEnd" name="end" class="input-field py-2 text-xs" required />
                </div>
              </div>
              <button type="submit" class="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider" [disabled]="!newSessionName || !sessionStart || !sessionEnd">
                Open Evaluation Window
              </button>
            </form>

            <!-- Sessions List -->
            <div class="space-y-3 pt-4 border-t border-surface-border/50">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Windows</h3>
              <div *ngFor="let s of sessions()"
                   class="p-4 rounded-2xl border bg-slate-950/40 flex items-center justify-between gap-4"
                   [ngClass]="s.isOpen ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-surface-border opacity-70'">
                <div>
                  <h4 class="text-xs font-bold text-white">{{ s.sessionName }}</h4>
                  <p class="text-[10px] text-slate-400 mt-1">Period: {{ s.startDate | date:'shortDate' }} - {{ s.endDate | date:'shortDate' }}</p>
                </div>

                <button (click)="toggleSession(s._id)"
                        class="px-3 py-1.5 text-[9px] font-black tracking-wider rounded-xl uppercase transition-all"
                        [ngClass]="s.isOpen ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'">
                  {{ s.isOpen ? 'CLOSE WINDOW' : 'OPEN WINDOW' }}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  auth         = inject(AuthService);
  adminService = inject(AdminService);

  stats        = signal<AdminStats | null>(null);
  leaderboard  = signal<FacultyLeaderboardItem[]>([]);
  questions    = signal<QuestionItem[]>([]);
  sessions     = signal<FeedbackSessionItem[]>([]);

  // Add Question Input
  newQuestionText = '';

  // Add Session Inputs
  newSessionName = '';
  sessionStart = '';
  sessionEnd = '';

  ngOnInit() {
    this.fetchGlobalData();
  }

  fetchGlobalData() {
    // 1. Fetch Stats
    this.adminService.getGlobalStats().subscribe({
      next: (res) => this.stats.set(res?.data || null)
    });

    // 2. Fetch Leaderboard
    this.adminService.getFacultyLeaderboard().subscribe({
      next: (res) => this.leaderboard.set(res?.data?.leaderboard || [])
    });

    // 3. Fetch Questions
    this.adminService.getAllQuestions().subscribe({
      next: (res) => this.questions.set(res?.data?.questions || [])
    });

    // 4. Fetch Sessions
    this.adminService.getAllSessions().subscribe({
      next: (res) => this.sessions.set(res?.data?.sessions || [])
    });
  }

  onAddQuestion() {
    if (!this.newQuestionText.trim()) return;

    this.adminService.addQuestion(this.newQuestionText.trim()).subscribe({
      next: () => {
        this.newQuestionText = '';
        // Re-fetch questions list
        this.adminService.getAllQuestions().subscribe({
          next: (res) => this.questions.set(res?.data?.questions || [])
        });
      }
    });
  }

  toggleQuestion(qid: string) {
    this.adminService.toggleQuestion(qid).subscribe({
      next: () => {
        // Toggle active status in local signal immediately
        this.questions.update(items =>
          items.map(q => q._id === qid ? { ...q, isActive: !q.isActive } : q)
        );
      }
    });
  }

  onCreateSession() {
    if (!this.newSessionName || !this.sessionStart || !this.sessionEnd) return;

    const payload = {
      sessionName: this.newSessionName,
      startDate: new Date(this.sessionStart).toISOString(),
      endDate: new Date(this.sessionEnd).toISOString()
    };

    this.adminService.createSession(payload).subscribe({
      next: () => {
        this.newSessionName = '';
        this.sessionStart = '';
        this.sessionEnd = '';
        // Re-fetch sessions list
        this.adminService.getAllSessions().subscribe({
          next: (res) => this.sessions.set(res?.data?.sessions || [])
        });
      }
    });
  }

  toggleSession(sid: string) {
    this.adminService.toggleSession(sid).subscribe({
      next: () => {
        // Toggle status in local signal immediately
        this.sessions.update(items =>
          items.map(s => s._id === sid ? { ...s, isOpen: !s.isOpen } : s)
        );
      }
    });
  }
}
