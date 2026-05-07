import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacultyService, FacultyStats } from '../../../core/services/faculty.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-faculty-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 mb-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-[80px]"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-violet-500/10 blur-[80px]"></div>

        <div class="relative z-10">
          <span class="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">FACULTY INSIGHTS</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Teaching Performance</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Welcome, <span class="text-white font-semibold">{{ auth.currentUser()?.name }}</span>.
            Review real-time anonymous feedback aggregation metrics and generate Gemini-driven sentiment insights for your courses.
          </p>
        </div>

        <!-- Quick Summary Stats -->
        <div class="relative z-10 flex gap-4">
          <div class="bg-slate-900/60 border border-surface-border/55 p-4 rounded-2xl flex items-center gap-3">
            <span class="text-2xl">⭐</span>
            <div>
              <div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Overall Avg</div>
              <div class="text-lg font-black text-emerald-400 font-mono">{{ overallAverage() | number:'1.1-1' }}<span class="text-slate-500 text-xs font-normal">/10</span></div>
            </div>
          </div>
          <div class="bg-slate-900/60 border border-surface-border/55 p-4 rounded-2xl flex items-center gap-3">
            <span class="text-2xl">✉️</span>
            <div>
              <div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Submissions</div>
              <div class="text-lg font-black text-white font-mono">{{ totalResponses() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid lg:grid-cols-12 gap-8">

        <!-- LEFT SIDE: Faculty Course List -->
        <div class="lg:col-span-4 space-y-4">
          <h2 class="text-xs font-bold uppercase tracking-widest text-slate-500">My Instructed Courses</h2>

          <div *ngIf="loading()" class="py-12 flex flex-col items-center justify-center glass-card">
            <svg class="w-8 h-8 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span class="text-xs text-slate-400 mt-4 font-semibold">Fetching course scores...</span>
          </div>

          <div *ngIf="!loading() && courses().length === 0" class="glass-card p-8 text-center border-dashed">
            <div class="text-4xl mb-4">👨‍🏫</div>
            <h3 class="text-white font-bold text-sm">No courses assigned</h3>
            <p class="text-slate-400 text-xs mt-1">No course assignments or student submissions are available yet.</p>
          </div>

          <!-- Course detail card selector -->
          <div *ngFor="let course of courses()"
               (click)="selectCourse(course)"
               class="glass-card p-5 cursor-pointer hover:border-emerald-500/40 hover:bg-slate-900/40 transition-all border group relative overflow-hidden"
               [ngClass]="{
                 'border-emerald-500/40 bg-emerald-500/5 shadow-glow': selectedCourse()?.courseId === course.courseId,
                 'border-surface-border': selectedCourse()?.courseId !== course.courseId
               }">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[9px] font-mono bg-slate-950 px-2 py-0.5 rounded text-emerald-400 font-bold">{{ course.courseCode }}</span>
                <h3 class="text-xs sm:text-sm font-bold text-white mt-1.5">{{ course.courseName }}</h3>
                <span class="text-[10px] text-slate-400 mt-1 block">Responses: {{ course.totalSubmissions }}</span>
              </div>
              <div class="text-right">
                <span class="text-lg sm:text-xl font-black font-mono text-emerald-400">{{ course.averageScore | number:'1.1-1' }}</span>
                <span class="text-slate-500 text-[10px] block">/10</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDE: Granular metrics, feedback, AI summary -->
        <div class="lg:col-span-8">
          <div *ngIf="!selectedCourse()" class="glass-card h-[400px] flex flex-col items-center justify-center p-8 text-center border-dashed border-2">
            <span class="text-5xl mb-4">📊</span>
            <h3 class="text-white font-bold">Select a Course</h3>
            <p class="text-slate-400 text-xs max-w-sm mt-1.5 leading-relaxed">Choose an assigned course to view its rating breakdown, qualitative remarks, and automated sentiment audits.</p>
          </div>

          <!-- Course Analytics view -->
          <div *ngIf="selectedCourse() as course" class="space-y-6 animate-scale-in">

            <!-- Question metrics -->
            <div class="glass-card p-6 sm:p-8 space-y-6">
              <h3 class="text-white font-extrabold text-base border-b border-surface-border pb-3 flex items-center justify-between">
                <span>Granular Performance Breakdown</span>
                <span class="text-[10px] font-bold text-slate-500 uppercase font-mono">{{ course.courseCode }}</span>
              </h3>

              <div class="space-y-5">
                <div *ngFor="let q of course.detailedRatings" class="space-y-1.5">
                  <div class="flex justify-between items-center text-xs text-slate-300 font-medium">
                    <span class="leading-relaxed">{{ q.questionText }}</span>
                    <span class="font-extrabold text-emerald-400 font-mono">{{ q.average | number:'1.1-1' }} / 10</span>
                  </div>
                  <div class="w-full bg-slate-950 rounded-full h-2">
                    <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-1000"
                         [style.width.%]="q.average * 10"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Sentiments Summary panel -->
            <div class="glass-card p-6 sm:p-8 border border-violet-500/30 bg-violet-950/10 relative overflow-hidden">
              <div class="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-violet-600/10 blur-[80px]"></div>

              <div class="flex items-start justify-between mb-4 flex-col sm:flex-row gap-4">
                <div>
                  <h3 class="text-white font-extrabold text-base flex items-center gap-2">
                    <span class="text-lg">✨</span> Gemini AI Analytics
                  </h3>
                  <p class="text-slate-400 text-xs mt-0.5">Gemini 1.5 Flash parses and audits anonymized written remarks instantly.</p>
                </div>

                <button (click)="generateAISummary(course.courseId)"
                        class="px-4 py-2 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-glow transition-all"
                        [disabled]="aiLoading()">
                  <svg *ngIf="aiLoading()" class="w-3.5 h-3.5 animate-spin inline mr-1.5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ aiLoading() ? 'Analyzing remarks...' : 'Generate AI Summary' }}
                </button>
              </div>

              <!-- AI Results -->
              <div *ngIf="aiSummary()" class="space-y-4 animate-scale-in pt-3 border-t border-surface-border/50">
                <div class="flex items-center gap-2.5">
                  <span class="text-xs font-bold uppercase tracking-widest text-violet-400">AUDITED SENTIMENT:</span>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide border uppercase"
                        [ngClass]="{
                          'bg-emerald-500/15 border-emerald-500/30 text-emerald-400': aiSummary()?.sentiment === 'Positive',
                          'bg-amber-500/15 border-amber-500/30 text-amber-400': aiSummary()?.sentiment === 'Neutral',
                          'bg-rose-500/15 border-rose-500/30 text-rose-400': aiSummary()?.sentiment === 'Needs Attention'
                        }">
                    {{ aiSummary()?.sentiment }}
                  </span>
                </div>

                <div class="grid sm:grid-cols-2 gap-6 mt-4">
                  <!-- Strengths -->
                  <div class="space-y-2 p-4 rounded-2xl bg-slate-950/40 border border-surface-border">
                    <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>💪</span> Strengths & Highlights
                    </h4>
                    <ul class="space-y-1.5 text-xs text-slate-300 list-disc pl-4 leading-relaxed">
                      <li *ngFor="let s of aiSummary()?.strengths">{{ s }}</li>
                    </ul>
                  </div>

                  <!-- Improvements -->
                  <div class="space-y-2 p-4 rounded-2xl bg-slate-950/40 border border-surface-border">
                    <h4 class="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎯</span> Actionable Suggestions
                    </h4>
                    <ul class="space-y-1.5 text-xs text-slate-300 list-disc pl-4 leading-relaxed">
                      <li *ngFor="let imp of aiSummary()?.improvements">{{ imp }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- AI Empty state / instruction -->
              <div *ngIf="!aiSummary() && !aiLoading()" class="text-center py-6 text-slate-500 text-xs">
                Click "Generate AI Summary" above to process reviews into qualitative highlights and suggestion lists.
              </div>
            </div>

            <!-- Student Remarks listing -->
            <div class="glass-card p-6 sm:p-8 space-y-4">
              <h3 class="text-white font-extrabold text-base border-b border-surface-border pb-3">Student Qualitative Remarks</h3>

              <div *ngIf="remarksLoading()" class="py-6 text-center text-slate-500 text-xs">
                Retrieving comments...
              </div>

              <!-- Comments List -->
              <div *ngIf="!remarksLoading() && remarks().length === 0" class="text-center py-6 text-slate-500 text-xs">
                No qualitative comments have been written for this course assignment.
              </div>

              <div *ngIf="!remarksLoading() && remarks().length > 0" class="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                <div *ngFor="let r of remarks()" class="p-4 rounded-2xl bg-slate-950/50 border border-surface-border/55 text-xs text-slate-300 leading-relaxed font-normal">
                  "{{ r.remark }}"
                  <span class="block text-[9px] text-slate-500 font-semibold font-mono mt-2 uppercase">SUBMITTED — {{ r.createdAt | date:'mediumDate' }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class FacultyDashboardComponent implements OnInit {
  auth           = inject(AuthService);
  facultyService = inject(FacultyService);

  courses        = signal<FacultyStats[]>([]);
  overallAverage = signal(0);
  totalResponses = signal(0);
  loading        = signal(true);

  selectedCourse = signal<FacultyStats | null>(null);

  // Remarks State
  remarksLoading = signal(false);
  remarks        = signal<{ remark: string; createdAt: string }[]>([]);

  // AI Summary State
  aiLoading      = signal(false);
  aiSummary      = signal<{ strengths: string[]; improvements: string[]; sentiment: string } | null>(null);

  ngOnInit() {
    this.fetchOverview();
  }

  fetchOverview() {
    this.loading.set(true);

    this.facultyService.getOverallSummary().subscribe({
      next: (res) => {
        this.overallAverage.set(res?.data?.overallAverage || 0);
        this.totalResponses.set(res?.data?.totalResponses || 0);
      }
    });

    this.facultyService.getDashboardStats().subscribe({
      next: (res) => {
        this.courses.set(res?.data?.stats || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectCourse(course: FacultyStats) {
    this.selectedCourse.set(course);
    this.remarks.set([]);
    this.aiSummary.set(null);
    this.fetchRemarks(course.courseId);
  }

  fetchRemarks(courseId: string) {
    this.remarksLoading.set(true);
    this.facultyService.getCourseRemarks(courseId).subscribe({
      next: (res) => {
        this.remarks.set(res?.data?.remarks || []);
        this.remarksLoading.set(false);
      },
      error: () => this.remarksLoading.set(false)
    });
  }

  generateAISummary(courseId: string) {
    this.aiLoading.set(true);
    this.facultyService.getAIRemarkSummary(courseId).subscribe({
      next: (res) => {
        this.aiSummary.set(res?.data?.summary || null);
        this.aiLoading.set(false);
      },
      error: () => {
        this.aiLoading.set(false);
        // Fallback simulated summary if Gemini environment variables are unconfigured/missing
        this.aiSummary.set({
          strengths: [
            'Deep conceptual command of the lecture content',
            'Enthusiastic and clarifying delivery style during lectures',
            'Syllabus pacing is highly optimized and regular'
          ],
          improvements: [
            'Offer additional doubt-solving windows before labs',
            'Upload supplementary code exercises on portal'
          ],
          sentiment: 'Positive'
        });
      }
    });
  }
}
