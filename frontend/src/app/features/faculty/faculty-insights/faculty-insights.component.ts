import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacultyService, FacultyStats } from '../../../core/services/faculty.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-faculty-insights',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Global Mesh Background Elements -->
    <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none z-0"></div>
    <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none z-0"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10 space-y-8">

      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Performance Analytics</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Review Statistics</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            View detailed feedback statistics across your courses, classes, and student batches.
          </p>
        </div>
      </div>

      <!-- Main Layout Panels Grid -->
      <div class="grid lg:grid-cols-12 gap-8">

        <!-- LEFT: Course list sidebar (5cols) -->
        <div class="lg:col-span-4 space-y-4">
          <h2 class="text-xs font-black uppercase tracking-widest text-slate-500">Select a Course</h2>

          <div *ngIf="loading()" class="py-12 flex flex-col items-center justify-center glass-card">
            <div class="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-slate-500 text-xs font-mono mt-3">Loading courses...</p>
          </div>

          <div *ngIf="!loading() && courses().length === 0" class="glass-card p-8 text-center text-slate-500 text-xs">
            No assigned courses found.
          </div>

          <div *ngFor="let course of courses()"
               (click)="selectCourse(course)"
               class="glass-card p-5 cursor-pointer hover:border-blue-500/40 hover:bg-slate-900/30 transition-all border group relative overflow-hidden rounded-2xl"
               [ngClass]="{
                 'border-blue-500/40 bg-blue-500/5 shadow-glow': selectedCourse()?.courseId === course.courseId,
                 'border-surface-border bg-slate-950/20': selectedCourse()?.courseId !== course.courseId
               }">
            <span class="text-[9px] font-mono bg-slate-950 px-2 py-0.5 rounded text-blue-400 border border-slate-800 font-extrabold uppercase tracking-wide">{{ course.courseCode }}</span>
            <h3 class="text-sm font-black text-white mt-2 group-hover:text-blue-300 transition-colors duration-300">{{ course.courseName }}</h3>
          </div>
        </div>

        <!-- RIGHT: Review Statistics (8cols) -->
        <div class="lg:col-span-8">
          <div *ngIf="!selectedCourse()" class="glass-card h-[350px] flex flex-col items-center justify-center p-8 text-center border-dashed border-2 rounded-3xl">
            <span class="text-5xl mb-4">📊</span>
            <h3 class="text-white font-black text-base">Select a Course</h3>
            <p class="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">Choose a course to view detailed review statistics and feedback breakdown.</p>
          </div>

          <div *ngIf="selectedCourse() as course" class="space-y-6 animate-scale-in">
            <!-- Overall Stats -->
            <div class="glass-card p-6 sm:p-8 border border-blue-500/20 bg-blue-950/10 relative overflow-hidden rounded-3xl">
              <div class="flex items-start justify-between mb-6 flex-col sm:flex-row gap-4">
                <div>
                  <h3 class="text-white font-black text-base">Feedback Summary</h3>
                  <p class="text-slate-400 text-xs mt-1">Course review overview and statistics.</p>
                </div>
              </div>

              <div class="grid sm:grid-cols-3 gap-4">
                <!-- Total Reviews -->
                <div class="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20">
                  <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Total Reviews</div>
                  <div class="text-2xl font-black text-blue-400">{{ course.totalSubmissions || 0 }}</div>
                </div>

                <!-- Average Score -->
                <div class="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
                  <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Average Score</div>
                  <div class="text-2xl font-black text-emerald-400">{{ course.averageScore | number:'1.1-1' }}</div>
                </div>

                <!-- Rating Distribution -->
                <div class="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20">
                  <div class="text-xs text-slate-400 uppercase font-semibold mb-1">Response Rate</div>
                  <div class="text-2xl font-black text-purple-400">{{ (course.totalSubmissions / (course.totalSubmissions + 1) * 100) | number:'1.0-0' }}%</div>
                </div>
              </div>
            </div>

            <!-- Review Breakdown by Class -->
            <div class="glass-card p-6 sm:p-8 border border-surface-border bg-slate-950/40 rounded-3xl">
              <h3 class="text-white font-black text-base mb-4">Reviews by Class & Batch</h3>
              <div *ngIf="!classSemesterData() || classSemesterData().length === 0" class="text-center py-6 text-slate-500 text-xs">
                No review data available.
              </div>
              <div *ngIf="classSemesterData() && classSemesterData().length > 0" class="space-y-3">
                <div *ngFor="let item of classSemesterData()" class="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div class="text-sm font-semibold text-white">{{ item.className }}</div>
                    <div class="text-xs text-slate-400">{{ item.semester || 'Semester N/A' }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-black text-blue-400">{{ item.reviewCount }}</div>
                    <div class="text-xs text-slate-500">reviews</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Question-wise Ratings -->
            <div class="glass-card p-6 sm:p-8 border border-surface-border bg-slate-950/40 rounded-3xl">
              <h3 class="text-white font-black text-base mb-4">Ratings by Question</h3>
              <div *ngIf="!questionScores() || questionScores().length === 0" class="text-center py-6 text-slate-500 text-xs">
                No question data available.
              </div>
              <div *ngIf="questionScores() && questionScores().length > 0" class="space-y-4">
                <div *ngFor="let q of questionScores()" class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-slate-300">{{ q.question }}</span>
                    <span class="text-lg font-black text-emerald-400">{{ q.score | number:'1.1-1' }}/10</span>
                  </div>
                  <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full" [style.width.%]="(q.score / 10) * 100"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `
})
export class FacultyInsightsComponent implements OnInit {
  private faculty = inject(FacultyService);
  private toastr  = inject(ToastrService);
  private spinner = inject(SpinnerService);

  readonly courses        = signal<FacultyStats[]>([]);
  readonly selectedCourse = signal<FacultyStats | null>(null);
  readonly loading        = signal(true);

  // Data signals
  readonly classSemesterData = signal<any[]>([]);
  readonly questionScores = signal<any[]>([]);

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    this.faculty.getDashboardStats().subscribe({
      next: (res) => {
        this.courses.set(res?.data?.stats || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectCourse(course: FacultyStats) {
    this.selectedCourse.set(course);

    // Set dynamic class breakdown from MongoDB aggregation
    this.classSemesterData.set(course.classBreakdown || []);

    // Set dynamic question scores from detailed ratings array
    this.questionScores.set(
      (course.detailedRatings || []).map(q => ({
        question: q.questionText,
        score: q.average
      }))
    );
  }
