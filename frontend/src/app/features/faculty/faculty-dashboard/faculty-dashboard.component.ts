import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacultyService, FacultyStats } from '../../../core/services/faculty.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../shared/components/spinner/spinner.component';

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
          <span class="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Faculty Portal</span>
          <h1 class="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">Performance Overview</h1>
          <p class="text-slate-400 text-sm mt-2 leading-relaxed max-w-xl font-medium">
            Welcome, <span class="text-white font-extrabold">{{ auth.currentUser()?.name }}</span>.
            Review feedback scores and student comments.
          </p>
        </div>

        <div class="relative z-10 flex items-center gap-4 bg-slate-900/60 border border-surface-border/55 p-4 rounded-2xl">
          <div class="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-2xl font-bold">🏫</div>
          <div>
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic Session</div>
            <div class="text-sm font-extrabold text-white">{{ currentSession() }}</div>
          </div>
        </div>
      </div>

      <!-- 1. KEY PERFORMANCE INDICATORS (Sole high-fidelity glass-card) -->
      <div class="mb-8">

        <!-- CARD A: Overall Avg Rating (SVG progress ring) -->
        <div class="glass-card p-6 border border-surface-border flex items-center justify-between relative overflow-hidden">
          <div class="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-emerald-500/5 pointer-events-none"></div>
          <div>
            <span class="text-[10px] font-black tracking-widest uppercase text-slate-500">Overall Rating</span>
            <p class="text-2xl font-black text-white mt-1 leading-none font-mono">
              {{ overallAverage() | number:'1.1-1' }} <span class="text-slate-500 text-xs font-normal">/ 10</span>
            </p>
            <p class="text-[10px] text-emerald-400 font-semibold mt-2.5 flex items-center gap-1">
              <span>★</span> Aggregate Evaluation
            </p>
          </div>
          <div class="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
            <svg class="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="33" stroke="rgba(255, 255, 255, 0.05)" stroke-width="6" fill="transparent" />
              <circle cx="40" cy="40" r="33"
                      stroke="#10b981"
                      stroke-width="6"
                      fill="transparent"
                      [attr.stroke-dasharray]="2 * 3.14159 * 33"
                      [attr.stroke-dashoffset]="2 * 3.14159 * 33 * (1 - (overallAverage() / 10))"
                      stroke-linecap="round"
                      class="transition-all duration-1000 ease-out" />
            </svg>
            <span class="absolute text-xs font-mono font-extrabold text-white">{{ (overallAverage() * 10) | number:'1.0-0' }}%</span>
          </div>
        </div>

      </div>

      <!-- MAIN LAYOUT: Split Grid -->
      <div class="grid lg:grid-cols-12 gap-8">

        <!-- LEFT SIDE: Course Selector Panel -->
        <div class="lg:col-span-4 space-y-4">
          <h2 class="text-xs font-black uppercase tracking-widest text-slate-500">My Assigned Courses</h2>

          <!-- Course Loading -->
          <div *ngIf="loading()" class="py-12 flex flex-col items-center justify-center glass-card">
            <svg class="w-8 h-8 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span class="text-xs text-slate-400 mt-4 font-bold tracking-wider uppercase">Fetching courses...</span>
          </div>

          <!-- Empty list state -->
          <div *ngIf="!loading() && courses().length === 0" class="glass-card p-8 text-center rounded-2xl border-dashed">
            <div class="text-4xl mb-4">👨‍🏫</div>
            <h3 class="text-white font-bold text-sm">No courses assigned</h3>
            <p class="text-slate-400 text-xs mt-2">No active class mappings or student feedback evaluations were found in the database.</p>
          </div>

          <!-- Course select button list -->
          <div *ngFor="let course of courses()"
               (click)="selectCourse(course)"
               class="glass-card p-5 cursor-pointer hover:border-emerald-500/40 hover:bg-slate-900/30 transition-all border group relative overflow-hidden rounded-2xl"
               [ngClass]="{
                 'border-emerald-500/40 bg-emerald-500/5 shadow-glow': selectedCourse()?.courseId === course.courseId,
                 'border-surface-border bg-slate-950/20': selectedCourse()?.courseId !== course.courseId
               }">
            <div class="flex items-center justify-between gap-4">
              <div>
                <span class="text-[9px] font-mono bg-slate-950 px-2 py-0.5 rounded text-emerald-400 border border-slate-800 font-extrabold uppercase tracking-wide">{{ course.courseCode }}</span>
                <h3 class="text-sm font-black text-white mt-2 group-hover:text-emerald-300 transition-colors duration-300">{{ course.courseCode }}</h3>
                <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1.5">Submitted Responses: {{ course.totalSubmissions }}</span>
              </div>
              <div class="text-right">
                <span class="text-lg sm:text-xl font-black font-mono text-emerald-400">{{ course.averageScore | number:'1.1-1' }}</span>
                <span class="text-slate-500 text-[10px] font-bold block">/ 10</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDE: Granular Performance & Qualitative reviews -->
        <div class="lg:col-span-8">

          <!-- Empty pane state -->
          <div *ngIf="!selectedCourse()" class="glass-card h-[450px] flex flex-col items-center justify-center p-8 text-center border-dashed border-2 rounded-3xl">
            <span class="text-5xl mb-4">📊</span>
            <h3 class="text-white font-black text-base">Select a Course</h3>
            <p class="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">Select a course from the left panel to view its feedback ratings and student comments.</p>
          </div>

          <!-- Selected Course Core Analytics View -->
          <div *ngIf="selectedCourse() as course" class="space-y-6 animate-scale-in">

            <!-- A. Quantitative Charts View (Question Averages progress bars) -->
            <div class="glass-card p-6 sm:p-8 space-y-6 rounded-3xl border border-surface-border">
              <h3 class="text-white font-black text-base border-b border-surface-border pb-3.5 flex items-center justify-between">
                <span>Granular Performance Metrics</span>
                <span class="text-[10px] font-black bg-slate-950 px-2.5 py-1 border border-slate-800 rounded-lg text-emerald-400 font-mono tracking-wider">{{ course.courseCode }}</span>
              </h3>

              <div class="space-y-5">
                <div *ngFor="let q of course.detailedRatings" class="space-y-2">
                  <div class="flex justify-between items-center text-xs sm:text-sm text-slate-300 font-bold">
                    <span class="leading-relaxed">{{ q.questionText }}</span>
                    <!-- Color dynamic ratings badge -->
                    <span class="font-black font-mono px-2.5 py-0.5 rounded-full border text-xs"
                          [ngClass]="{
                            'bg-rose-500/10 text-rose-400 border-rose-500/20': q.average <= 3.9,
                            'bg-amber-500/10 text-amber-400 border-amber-500/20': q.average >= 4.0 && q.average <= 6.9,
                            'bg-violet-500/10 text-violet-400 border-violet-500/20': q.average >= 7.0 && q.average <= 8.9,
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': q.average >= 9.0
                          }">
                      {{ q.average | number:'1.1-1' }} / 10
                    </span>
                  </div>
                  <!-- Dynamic background gradient progress bar -->
                  <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-900">
                    <div class="h-full rounded-full transition-all duration-1000 ease-out"
                         [ngClass]="getGradeColor(q.average)"
                         [style.width.%]="q.average * 10"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- B. Student Feedback Comments -->
            <div class="glass-card p-6 sm:p-8 space-y-4 rounded-3xl border border-surface-border">
              <h3 class="text-white font-black text-base border-b border-surface-border pb-3.5 flex items-center justify-between">
                <span>Student Written Feedback</span>
                <span class="text-[9px] font-black bg-slate-950 border border-slate-900 rounded-full px-3 py-1 text-slate-400 uppercase tracking-widest font-mono">Anonymous</span>
              </h3>

              <div *ngIf="remarksLoading()" class="py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                Loading comments...
              </div>

              <!-- Comments List -->
              <div *ngIf="!remarksLoading() && remarks().length === 0" class="text-center py-8 text-slate-500 text-xs font-bold uppercase tracking-wider">
                No written comments available for this course.
              </div>

              <div *ngIf="!remarksLoading() && remarks().length > 0" class="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scroll">
                <div *ngFor="let r of remarks(); let idx = index"
                     (click)="toggleRemarkReveal(idx)"
                     class="p-5 rounded-2xl bg-slate-950/50 border border-surface-border/50 cursor-pointer hover:border-brand-500/30 transition-all duration-300 relative overflow-hidden group">

                  <!-- Blur-to-focus comment body -->
                  <div class="transition-all duration-500 ease-out select-none leading-relaxed text-sm font-semibold pr-4"
                       [ngClass]="{
                         'blur-none text-slate-300': revealedRemarks()[idx],
                         'blur-[6px] text-slate-500 select-none pointer-events-none': !revealedRemarks()[idx]
                       }">
                    "{{ r.remark }}"
                  </div>

                  <!-- Lock Overlay for encrypted comments -->
                  <div *ngIf="!revealedRemarks()[idx]"
                       class="absolute inset-0 bg-slate-950/20 flex items-center justify-center transition-all duration-300 group-hover:bg-slate-950/40">
                    <span class="text-[9px] font-black uppercase tracking-widest text-brand-400 bg-brand-500/10 px-4 py-2 rounded-full border border-brand-500/20 flex items-center gap-1.5 shadow-sm">
                      🔒 Click to view comment
                    </span>
                  </div>

                  <!-- Footer indexes ensuring full anonymity -->
                  <div class="flex items-center justify-between mt-3.5 pt-3 border-t border-surface-border/30 text-[9px] text-slate-500 font-extrabold uppercase font-mono tracking-wider">
                    <span>Comment #{{ idx + 1 }}</span>
                    <span>Received: {{ r.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes scale-in {
      0% { transform: scale(0.96); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-scale-in {
      animation: scale-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fade-in {
      0% { opacity: 0; }
    }
    .animate-fade-in {
      animation: fade-in 0.22s ease-out forwards;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 99px;
    }
    .custom-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `]
})
export class FacultyDashboardComponent implements OnInit {
  auth           = inject(AuthService);
  facultyService = inject(FacultyService);
  private toastr = inject(ToastrService);
  private spinner = inject(SpinnerService);

  readonly currentSession = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month < 6 ? `Spring ${year} Term` : `Autumn ${year} Term`;
  });

  // Core States
  courses        = signal<FacultyStats[]>([]);
  overallAverage = signal(0);
  totalResponses = signal(0);
  loading        = signal(true);
  selectedCourse = signal<FacultyStats | null>(null);

  // Remarks Encryption states
  remarksLoading  = signal(false);
  remarks         = signal<{ remark: string; createdAt: string }[]>([]);
  revealedRemarks = signal<Record<number, boolean>>({});

  ngOnInit() {
    this.fetchOverview();
  }

  fetchOverview() {
    this.loading.set(true);
    this.spinner.show();

    // Fetch aggregate average scores
    this.facultyService.getSummary().subscribe({
      next: (res) => {
        this.overallAverage.set(res?.data?.overallAverage || 0);
        this.totalResponses.set(res?.data?.totalResponses || 0);
      },
      error: () => {
        this.toastr.error('Failed to retrieve institution averages summaries.', 'System Error');
      }
    });

    // Fetch Courses listing
    this.facultyService.getDashboardStats().subscribe({
      next: (res) => {
        this.courses.set(res?.data?.stats || []);
        this.loading.set(false);
        this.spinner.hide();
      },
      error: () => {
        this.loading.set(false);
        this.spinner.hide();
        this.toastr.error('Failed to load courses.', 'Error');
      }
    });
  }

  selectCourse(course: FacultyStats) {
    this.selectedCourse.set(course);
    this.remarks.set([]);
    this.revealedRemarks.set({}); // Reset blur locks
    this.fetchRemarks(course.courseId);
  }

  fetchRemarks(courseId: string) {
    this.remarksLoading.set(true);
    this.facultyService.getCourseRemarks(courseId).subscribe({
      next: (res) => {
        this.remarks.set(res?.data?.remarks || []);
        this.remarksLoading.set(false);
      },
      error: () => {
        this.remarksLoading.set(false);
        this.toastr.error('Could not load comments.', 'Error');
      }
    });
  }

  toggleRemarkReveal(index: number) {
    this.revealedRemarks.update(rec => ({
      ...rec,
      [index]: !rec[index]
    }));
  }

  // Helper method mapping dynamic background gradients from average evaluation scores
  getGradeColor(score: number): string {
    if (score <= 3.9) {
      return 'bg-gradient-to-r from-rose-500 to-rose-400 border-rose-500/20';
    } else if (score >= 4.0 && score <= 6.9) {
      return 'bg-gradient-to-r from-amber-500 to-amber-400 border-amber-500/20';
    } else if (score >= 7.0 && score <= 8.9) {
      return 'bg-gradient-to-r from-violet-500 to-violet-400 border-violet-500/20';
    } else {
      return 'bg-gradient-to-r from-emerald-500 to-emerald-400 border-emerald-500/20';
    }
  }
}
