import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService, CourseAssignment } from '../../../core/services/student.service';
import { AdminService, QuestionItem } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 mb-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-500/10 blur-[80px]"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px]"></div>

        <div class="relative z-10">
          <span class="text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">STUDENT PORTAL</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Academic Feedback</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Welcome, <span class="text-white font-semibold">{{ auth.currentUser()?.name }}</span> (Section {{ auth.currentUser()?.section }}).
            Your evaluations help maintain the highest standards of teaching quality at IIIT Ranchi. Submissions are 100% anonymous.
          </p>
        </div>

        <div class="relative z-10 flex items-center gap-4 bg-slate-900/60 border border-surface-border/55 p-4 rounded-2xl">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-bold">✓</div>
          <div>
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completion Status</div>
            <div class="text-sm font-extrabold text-white">
              {{ completedCount() }} / {{ courses().length }} Courses Evaluated
            </div>
          </div>
        </div>
      </div>

      <!-- Main Section -->
      <div class="grid lg:grid-cols-12 gap-8">

        <!-- LEFT SIDE: Course & Instructor List -->
        <div class="lg:col-span-5 space-y-4">
          <h2 class="text-xs font-bold uppercase tracking-widest text-slate-500">My Course Assignments</h2>

          <div *ngIf="loading()" class="py-12 flex flex-col items-center justify-center glass-card">
            <svg class="w-8 h-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span class="text-xs text-slate-400 mt-4 font-semibold">Loading assignments...</span>
          </div>

          <!-- Empty state -->
          <div *ngIf="!loading() && courses().length === 0" class="glass-card p-8 text-center">
            <div class="text-4xl mb-4">📂</div>
            <h3 class="text-white font-bold text-sm">No assignments found</h3>
            <p class="text-slate-400 text-xs mt-1">No faculty assignments were found for Section {{ auth.currentUser()?.section }}. Contact admin.</p>
          </div>

          <!-- Course Cards -->
          <div *ngFor="let assign of courses()"
               (click)="selectAssignment(assign)"
               class="glass-card p-5 cursor-pointer hover:border-brand-500/40 hover:bg-slate-900/40 transition-all relative overflow-hidden group border"
               [ngClass]="{
                 'border-brand-500/40 shadow-glow bg-brand-500/5': selectedAssignment()?.assignmentId === assign.assignmentId,
                 'border-surface-border': selectedAssignment()?.assignmentId !== assign.assignmentId,
                 'opacity-75 hover:opacity-100': assign.feedbackSubmitted
               }">

            <div class="flex items-center justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-brand-400 font-extrabold">{{ assign.course.courseCode }}</span>
                  <span *ngIf="assign.feedbackSubmitted" class="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">✓ COMPLETED</span>
                  <span *ngIf="!assign.feedbackSubmitted" class="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">PENDING</span>
                </div>
                <h3 class="text-sm font-bold text-white mt-2 group-hover:text-brand-300 transition-colors">{{ assign.course.courseName }}</h3>
                <p class="text-slate-400 text-xs mt-1">Instructor: <span class="text-slate-300 font-medium">{{ assign.faculty.name }}</span></p>
              </div>

              <div class="w-10 h-10 rounded-full overflow-hidden border border-surface-border bg-slate-950 flex items-center justify-center text-lg">
                <img *ngIf="assign.faculty.avatar" [src]="assign.faculty.avatar" class="w-full h-full object-cover" />
                <span *ngIf="!assign.faculty.avatar">👨‍🏫</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDE: Evaluation Card -->
        <div class="lg:col-span-7">
          <!-- Default empty state -->
          <div *ngIf="!selectedAssignment()" class="glass-card h-[400px] flex flex-col items-center justify-center p-8 text-center border-dashed border-2">
            <span class="text-5xl mb-4">✏️</span>
            <h3 class="text-white font-bold">Select a Course</h3>
            <p class="text-slate-400 text-xs max-w-sm mt-1.5 leading-relaxed">Choose a course from the left pane to begin your anonymous academic evaluation.</p>
          </div>

          <!-- Evaluation Form -->
          <div *ngIf="selectedAssignment() as assign" class="space-y-4 animate-scale-in">

            <div *ngIf="assign.feedbackSubmitted" class="glass-card p-8 text-center border-emerald-500/20 bg-emerald-500/5">
              <div class="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl font-bold mx-auto mb-4">✓</div>
              <h3 class="text-white font-bold text-lg">Evaluation Submitted Successfully</h3>
              <p class="text-slate-400 text-xs max-w-sm mx-auto mt-2 leading-relaxed">
                Thank you! Your feedback for <span class="text-white font-semibold">{{ assign.course.courseName }}</span> by <span class="text-white font-semibold">{{ assign.faculty.name }}</span> has been submitted anonymously.
              </p>
            </div>

            <div *ngIf="!assign.feedbackSubmitted" class="glass-card p-6 sm:p-8 space-y-6">
              <div class="pb-4 border-b border-surface-border flex items-center justify-between">
                <div>
                  <h3 class="text-white font-extrabold text-base">Course Evaluation</h3>
                  <p class="text-brand-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{{ assign.course.courseCode }} — {{ assign.faculty.name }}</p>
                </div>
                <span class="text-slate-500 text-xs font-mono">Anonymous Channel</span>
              </div>

              <!-- Question Ratings -->
              <div class="space-y-6">
                <div *ngFor="let q of questions(); let i = index" class="space-y-2">
                  <div class="flex justify-between items-start gap-4">
                    <span class="text-slate-300 text-xs font-medium leading-relaxed">
                      <strong class="text-brand-400">Q{{ i + 1 }}.</strong> {{ q.questionText }}
                    </span>
                    <span class="text-sm font-extrabold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 font-mono">
                      {{ formRatings[q._id] || 5 }} / 10
                    </span>
                  </div>

                  <!-- Range Slider -->
                  <div class="relative pt-1 flex items-center gap-3">
                    <span class="text-[10px] font-bold text-slate-500">1</span>
                    <input type="range" min="1" max="10" step="1"
                           [(ngModel)]="formRatings[q._id]"
                           class="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand" />
                    <span class="text-[10px] font-bold text-slate-500">10</span>
                  </div>
                </div>
              </div>

              <!-- Written Comment -->
              <div class="space-y-1.5 pt-4 border-t border-surface-border">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">Qualitative Remarks (Optional)</label>
                <textarea [(ngModel)]="formRemark" rows="4" placeholder="Provide anonymous comments on class dynamics, lecture pacing, strengths or specific suggestions for improvement..."
                          class="input-field py-3.5 leading-relaxed text-xs resize-none"></textarea>
                <p class="text-[10px] text-slate-500">Remarks are structured to prevent direct or indirect identification. Be professional and constructive.</p>
              </div>

              <!-- Error Box -->
              <div *ngIf="submitError()" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-fade-in">
                ⚠️ {{ submitError() }}
              </div>

              <!-- Submit -->
              <button (click)="submitEvaluation()" class="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider" [disabled]="submitting()">
                <svg *ngIf="submitting()" class="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ submitting() ? 'Publishing Anonymously...' : 'Publish Evaluation' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  auth           = inject(AuthService);
  studentService = inject(StudentService);
  adminService   = inject(AdminService);

  courses            = signal<CourseAssignment[]>([]);
  questions          = signal<QuestionItem[]>([]);
  loading            = signal(true);
  submitting         = signal(false);
  submitError        = signal('');

  selectedAssignment = signal<CourseAssignment | null>(null);
  completedCount     = signal(0);

  // Form State
  formRatings: Record<string, number> = {};
  formRemark = '';

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);

    // Fetch assignments + Questionnaire
    this.studentService.getAvailableCourses().subscribe({
      next: (res) => {
        this.courses.set(res?.data?.courses || []);
        this.completedCount.set(this.courses().filter(c => c.feedbackSubmitted).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.adminService.getAllQuestions().subscribe({
      next: (res) => {
        // Active questions only
        const active = (res?.data?.questions || []).filter((q: any) => q.isActive);
        this.questions.set(active);
        // Set default slider scores to 5
        active.forEach((q: any) => {
          this.formRatings[q._id] = 5;
        });
      }
    });
  }

  selectAssignment(assign: CourseAssignment) {
    this.selectedAssignment.set(assign);
    this.submitError.set('');
    this.formRemark = '';
    // Reset rating values to 5
    this.questions().forEach(q => {
      this.formRatings[q._id] = 5;
    });
  }

  submitEvaluation() {
    const assign = this.selectedAssignment();
    if (!assign) return;

    this.submitting.set(true);
    this.submitError.set('');

    // Map formRatings to ratings API payload model
    const ratingsArray = Object.keys(this.formRatings).map(qid => ({
      questionId: qid,
      score: Number(this.formRatings[qid])
    }));

    const payload = {
      courseId: assign.course._id,
      facultyId: assign.faculty._id,
      ratings: ratingsArray,
      remark: this.formRemark
    };

    this.studentService.submitFeedback(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        // Mark as completed locally
        assign.feedbackSubmitted = true;
        this.completedCount.set(this.courses().filter(c => c.feedbackSubmitted).length);
        // Clear forms
        this.formRemark = '';
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message || 'Failed to submit feedback. Ensure session is active.');
      }
    });
  }
}
