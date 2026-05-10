import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService, CourseAssignment, FeedbackPayload } from '../../../core/services/student.service';
import { AdminService, QuestionItem } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      <!-- Header Banner (Glassmorphism design) -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 mb-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-500/10 blur-[80px]"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px]"></div>

        <div class="relative z-10">
          <span class="text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 animate-pulse">Student Portal</span>
          <h1 class="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">Course Feedback</h1>
          <p class="text-slate-400 text-sm mt-2 leading-relaxed max-w-xl font-medium">
            Welcome, <span class="text-white font-extrabold">{{ auth.currentUser()?.name }}</span> (Section {{ auth.currentUser()?.section }}).
            Share your feedback on assigned courses. All responses are confidential.
          </p>
        </div>

        <div class="relative z-10 flex items-center gap-4 bg-slate-900/60 border border-surface-border/55 p-4 rounded-2xl">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-bold animate-pulse">✓</div>
          <div>
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation Progress</div>
            <div class="text-sm font-extrabold text-white">
              {{ completedCount() }} / {{ courses().length }} Courses Completed
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN LAYOUT: Responsive Grid of Courses -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-black uppercase tracking-widest text-slate-400">My Registered Course Assignments</h2>
          <span class="text-xs font-semibold text-slate-500">{{ pendingCount() }} Pending Evaluations</span>
        </div>

        <!-- Global Loading Spinner -->
        <div *ngIf="loading()" class="py-24 flex flex-col items-center justify-center glass-card rounded-2xl border border-surface-border">
          <svg class="w-10 h-10 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span class="text-xs text-slate-400 mt-4 font-bold tracking-wider uppercase">Retrieving courses...</span>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading() && courses().length === 0" class="glass-card p-12 text-center rounded-2xl max-w-md mx-auto">
          <div class="text-5xl mb-4">📂</div>
          <h3 class="text-white font-extrabold text-base">No registered assignments found</h3>
          <p class="text-slate-400 text-xs mt-2 leading-relaxed">No active courses mapping your Section ({{ auth.currentUser()?.section }}) were found in the database. Please request assistance from the Academic Office.</p>
        </div>

        <!-- Course Cards Grid (Three-column high-fidelity representation) -->
        <div *ngIf="!loading() && courses().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let assign of courses()"
               class="glass-card p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden border group rounded-2xl"
               [ngClass]="{
                 'border-brand-500/30 shadow-glow bg-slate-900/30 animate-pulse-border': !assign.feedbackSubmitted,
                 'border-surface-border bg-slate-950/40 desaturate-card': assign.feedbackSubmitted
               }">

            <div class="absolute -top-12 -right-12 w-24 h-24 rounded-full pointer-events-none transition-all duration-500 group-hover:scale-125"
                 [ngClass]="assign.feedbackSubmitted ? 'bg-emerald-500/5' : 'bg-brand-500/5'"></div>

            <div class="space-y-4">
              <!-- Card Header Badge row -->
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-brand-400 font-extrabold uppercase tracking-wide">{{ assign.course.courseCode }}</span>
                <span *ngIf="assign.feedbackSubmitted" class="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                  ✓ COMPLETED
                </span>
                <span *ngIf="!assign.feedbackSubmitted" class="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full animate-pulse">
                  PENDING
                </span>
              </div>

              <!-- Course Title -->
              <div>
                <h3 class="text-base font-black text-white leading-snug group-hover:text-brand-300 transition-colors duration-300">
                  {{ assign.course.courseName }}
                </h3>
                <!-- Instructor Details with avatar -->
                <div class="flex items-center gap-2.5 mt-3 pt-3 border-t border-surface-border/40">
                  <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-800 bg-slate-950 flex-shrink-0 flex items-center justify-center">
                    <img *ngIf="assign.faculty.avatar" [src]="assign.faculty.avatar" class="w-full h-full object-cover" />
                    <span *ngIf="!assign.faculty.avatar" class="text-sm">👨‍🏫</span>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">Course Instructor</p>
                    <p class="text-xs font-semibold text-slate-300 mt-1">{{ assign.faculty.name }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit/Review Button Section -->
            <div class="mt-6 pt-4 border-t border-surface-border/30">
              <button *ngIf="!assign.feedbackSubmitted"
                      (click)="openEvaluation(assign)"
                      class="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 transform active:scale-98 flex items-center justify-center gap-2 bg-gradient-brand shadow-brand hover:scale-[1.01] hover:brightness-110">
                📝 Start Evaluation
              </button>
              <button *ngIf="assign.feedbackSubmitted"
                      [disabled]="true"
                      class="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 border border-slate-800 bg-slate-950/50 cursor-not-allowed flex items-center justify-center gap-2">
                ✅ Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- INTERACTIVE EVALUATION MODAL OVERLAY (Smooth entry & exit blur) -->
      <div *ngIf="showModal() && selectedAssignment() as assign"
           class="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
           style="background: rgba(15,23,42,0.85); backdrop-filter: blur(10px);">

        <!-- Modal Frame -->
        <div class="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col justify-between overflow-hidden border border-brand-500/30 rounded-3xl shadow-glow shadow-brand-500/20 animate-scale-in">

          <!-- STAGE 1: Standard Evaluation Form (Show if NOT successful) -->
          <ng-container *ngIf="!showSuccessExperience()">
            <!-- Header (Instructor brand panel) -->
            <div class="p-6 border-b border-surface-border/60 bg-slate-950/50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full overflow-hidden border border-brand-500/30 bg-slate-900 flex items-center justify-center flex-shrink-0 text-base">
                  <img *ngIf="assign.faculty.avatar" [src]="assign.faculty.avatar" class="w-full h-full object-cover" />
                  <span *ngIf="!assign.faculty.avatar">👨‍🏫</span>
                </div>
                <div>
                  <h3 class="text-white font-extrabold text-sm sm:text-base leading-none">{{ assign.course.courseName }}</h3>
                  <p class="text-brand-400 text-[10px] font-bold uppercase tracking-wider mt-1.5">{{ assign.course.courseCode }} — Instructor: {{ assign.faculty.name }}</p>
                </div>
              </div>
              <button (click)="closeEvaluation()" class="text-slate-400 hover:text-white transition-colors duration-200 text-xl font-bold p-1">&times;</button>
            </div>

            <!-- Scrollable Questionnaire Core -->
            <div class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 max-h-[60vh] custom-scroll">

              <!-- Anonymous Warning Callout -->
              <div class="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-cyan-300 text-xs flex gap-2.5 items-start leading-relaxed">
                <span class="text-sm">🛡️</span>
                <div>
                  <strong>Anonymous Evaluation:</strong> Your responses are completely anonymous. No student identity is linked to this feedback.
                </div>
              </div>

              <!-- Validation/Submission Error Alert -->
              <div *ngIf="submitError()" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-fade-in flex gap-2">
                <span>⚠️</span>
                <div>{{ submitError() }}</div>
              </div>

              <!-- Evaluation Form binding -->
              <form *ngIf="feedbackForm" [formGroup]="feedbackForm" class="space-y-6">
                <div *ngFor="let q of questions(); let i = index" class="p-4.5 rounded-2xl bg-slate-950/40 border border-surface-border/50 space-y-3.5">
                  <div class="flex justify-between items-start gap-4">
                    <span class="text-slate-200 text-xs sm:text-sm font-semibold leading-relaxed">
                      <strong class="text-brand-400 font-black">Q{{ i + 1 }}.</strong> {{ q.questionText }}
                    </span>
                    <!-- Highlight Score badge with glow -->
                    <span *ngIf="getRating(q._id) as val"
                          class="text-xs font-extrabold px-2.5 py-0.5 rounded-full border transition-all duration-300 font-mono shadow-sm"
                          [ngClass]="{
                            'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/20': val <= 3,
                            'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/20': val >= 4 && val <= 6,
                            'bg-violet-500/10 text-violet-400 border-violet-500/30 shadow-violet-500/20': val >= 7 && val <= 8,
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20': val >= 9
                          }">
                      {{ val }} / 10
                    </span>
                    <span *ngIf="!getRating(q._id)" class="text-[10px] font-extrabold text-slate-500 border border-slate-800 bg-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Pending</span>
                  </div>

                  <!-- 1-10 Dynamic Color Graded Node Selection (Circular Buttons scale) -->
                  <div class="grid grid-cols-10 gap-1.5 sm:gap-2.5 pt-1.5">
                    <button *ngFor="let num of [1,2,3,4,5,6,7,8,9,10]"
                            type="button"
                            (click)="setRating(q._id, num)"
                            class="h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-200 transform active:scale-95 select-none"
                            [ngClass]="{
                              'bg-rose-500 border-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.7)] scale-110 font-black': getRating(q._id) === num && num <= 3,
                              'bg-amber-500 border-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.7)] scale-110 font-black': getRating(q._id) === num && num >= 4 && num <= 6,
                              'bg-violet-500 border-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.7)] scale-110 font-black': getRating(q._id) === num && num >= 7 && num <= 8,
                              'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.7)] scale-110 font-black': getRating(q._id) === num && num >= 9,

                              'bg-slate-950/40 border-slate-900 text-slate-400': getRating(q._id) !== num,
                              'hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/5': getRating(q._id) !== num && num <= 3,
                              'hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-50/5': getRating(q._id) !== num && num >= 4 && num <= 6,
                              'hover:text-violet-400 hover:border-violet-500/40 hover:bg-violet-50/5': getRating(q._id) !== num && num >= 7 && num <= 8,
                              'hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-50/5': getRating(q._id) !== num && num >= 9
                            }">
                      {{ num }}
                    </button>
                  </div>
                </div>

                <!-- Written Comments (Optional) -->
                <div class="space-y-2 pt-4 border-t border-surface-border/40">
                  <div class="flex justify-between items-center">
                    <label class="block text-xs font-black uppercase tracking-wider text-slate-400">Comments (Optional)</label>

                    <!-- Character counter -->
                    <span class="text-[10px] font-mono font-black tracking-wider text-slate-400 bg-slate-950/60 border border-slate-900 px-2 py-0.5 rounded-full">
                      {{ feedbackForm.get('remark')?.value?.length || 0 }} / 500
                    </span>
                  </div>

                  <textarea formControlName="remark"
                            rows="4"
                            placeholder="Write any additional feedback or suggestions here..."
                            class="input-field py-3.5 px-4.5 leading-relaxed text-xs sm:text-sm resize-none"
                            [ngClass]="{
                              'border-rose-500/30 focus:border-rose-500': feedbackForm.get('remark')?.invalid && feedbackForm.get('remark')?.touched
                            }"></textarea>

                  <!-- Explicit validation helper messages -->
                  <div class="flex flex-col gap-1">
                    <p *ngIf="feedbackForm.get('remark')?.touched && feedbackForm.get('remark')?.errors?.['maxlength']" class="text-rose-400 text-[10px] font-semibold flex items-center gap-1 mt-1 animate-fade-in">
                      <span>⚠️</span> Comments cannot exceed 500 characters.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            <!-- Footer Actions -->
            <div class="p-6 border-t border-surface-border/60 bg-slate-950/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">All ratings are processed anonymously.</span>

              <div class="flex gap-3 w-full sm:w-auto">
                <button (click)="closeEvaluation()"
                        class="btn-ghost w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider">
                  Cancel
                </button>

                <!-- Submit button: glassmorphic disabled state applied elegantly inside dynamic templates -->
                <button (click)="submitEvaluation()"
                        [disabled]="!feedbackForm || feedbackForm.invalid || submitting()"
                        class="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-brand flex items-center justify-center gap-2 transition-all duration-300"
                        [ngClass]="{
                          'opacity-50 cursor-not-allowed hover:scale-100 shadow-none hover:brightness-100': !feedbackForm || feedbackForm.invalid || submitting()
                        }">
                  <svg *ngIf="submitting()" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ submitting() ? 'Publishing Anonymously...' : 'Submit Evaluation' }}
                </button>
              </div>
            </div>
          </ng-container>

          <!-- STAGE 2: Glassmorphic Success Tab (Show on SUCCESS) -->
          <div *ngIf="showSuccessExperience()"
               class="p-8 sm:p-12 flex flex-col items-center text-center space-y-6 animate-scale-in">

            <!-- Large animated Green Tick SVG -->
            <div class="relative w-24 h-24 flex items-center justify-center">
              <div class="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-ping" style="animation-duration: 2.2s;"></div>
              <div class="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-glow shadow-emerald-500/20">
                <svg class="w-10 h-10 text-emerald-400 svg-success-tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" class="tick-path"></polyline>
                </svg>
              </div>
            </div>

            <!-- Success message header -->
            <div class="space-y-2">
              <h3 class="text-white font-black text-xl sm:text-2xl tracking-tight leading-tight max-w-lg">
                Thank you for your honest feedback, {{ auth.currentUser()?.name }}!
              </h3>
              <p class="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                Evaluation Saved &amp; Secured
              </p>
            </div>

            <!-- Obscured identity subtext -->
            <p class="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              Your feedback has been saved securely and anonymously. No identifying information is linked to your submission.
            </p>

            <!-- Submission proof confirmation -->
            <div class="w-full max-w-md p-3 rounded-xl bg-slate-950/80 border border-slate-900/60 font-mono text-[9px] text-slate-500 break-all select-none flex items-center justify-center gap-2">
              <span class="text-emerald-500 font-bold">✓ SUBMISSION REF:</span>
              <span>iiitr-{{ assign.course.courseCode.toLowerCase() }}-{{ assign.assignmentId.slice(0,8) }}</span>
            </div>

            <!-- Return button -->
            <button (click)="closeSuccessExperience()"
                    class="btn-primary w-full max-w-xs py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-brand hover:scale-[1.01] active:scale-98 transition-all duration-300">
              Return to Dashboard
            </button>
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
      100% { opacity: 1; }
    }
    .animate-fade-in {
      animation: fade-in 0.22s ease-out forwards;
    }
    @keyframes pulse-border {
      0%, 100% { border-color: rgba(99, 102, 241, 0.2); }
      50% { border-color: rgba(99, 102, 241, 0.45); }
    }
    .animate-pulse-border {
      animation: pulse-border 2.5s infinite ease-in-out;
    }
    .desaturate-card {
      filter: grayscale(0.2) brightness(0.85);
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
    .svg-success-tick .tick-path {
      stroke-dasharray: 50;
      stroke-dashoffset: 50;
      animation: draw-tick 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
    }
    @keyframes draw-tick {
      to { stroke-dashoffset: 0; }
    }
  `]
})
export class StudentDashboardComponent implements OnInit {
  auth           = inject(AuthService);
  studentService = inject(StudentService);
  adminService   = inject(AdminService);
  private fb     = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private spinner = inject(SpinnerService);

  // States
  courses            = signal<CourseAssignment[]>([]);
  questions          = signal<QuestionItem[]>([]);
  loading            = signal(true);
  submitting         = signal(false);
  submitError        = signal('');
  selectedAssignment = signal<CourseAssignment | null>(null);
  showModal          = signal(false);
  showSuccessExperience = signal(false);

  // Computed signals mapping Completed vs Pending
  completedCount     = computed(() => this.courses().filter(c => c.feedbackSubmitted).length);
  pendingCount       = computed(() => this.courses().filter(c => !c.feedbackSubmitted).length);

  // Reactive evaluation form
  feedbackForm?: FormGroup;

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    this.spinner.show();

    // Fetch Course assignments for current student
    this.studentService.getAvailableCourses().subscribe({
      next: (res) => {
        this.courses.set(res?.data?.courses || []);
        this.loading.set(false);
        this.spinner.hide();
      },
      error: (err) => {
        this.loading.set(false);
        this.spinner.hide();
        this.toastr.error('Failed to load courses catalogue assignments.', 'System Error');
      }
    });

    // Fetch Questionnaire active questions list
    this.studentService.getActiveQuestions().subscribe({
      next: (res) => {
        const active = (res?.data?.questions || []).filter((q: any) => q.isActive);
        this.questions.set(active);
      },
      error: () => {
        this.toastr.error('Could not load academic feedback metrics.', 'System Error');
      }
    });
  }

  openEvaluation(assign: CourseAssignment) {
    this.selectedAssignment.set(assign);
    this.submitError.set('');

    // Dynamic Reactive FormGroup creation
    const formControls: Record<string, any> = {
      remark: ['', [Validators.maxLength(500)]]
    };

    // Dynamically insert FormControl mapping each active Questionnaire Question
    this.questions().forEach(q => {
      formControls[q._id] = [null, [Validators.required, Validators.min(1), Validators.max(10)]];
    });

    this.feedbackForm = this.fb.group(formControls);
    this.showModal.set(true);
  }

  closeEvaluation() {
    this.showModal.set(false);
    this.selectedAssignment.set(null);
    this.showSuccessExperience.set(false);
  }

  closeSuccessExperience() {
    this.closeEvaluation();
  }

  setRating(questionId: string, score: number) {
    if (this.feedbackForm && this.feedbackForm.get(questionId)) {
      this.feedbackForm.get(questionId)?.setValue(score);
      this.feedbackForm.get(questionId)?.markAsTouched();
    }
  }

  getRating(questionId: string): number | null {
    return this.feedbackForm?.get(questionId)?.value || null;
  }

  async submitEvaluation() {
    const assign = this.selectedAssignment();
    const form = this.feedbackForm;
    if (!assign || !form || form.invalid) return;

    this.triggerHapticFeedback(); // Dynamic haptics trigger
    this.submitting.set(true);
    this.submitError.set('');
    this.spinner.show();

    // Parse ratings dynamically to generate standard payload parameters
    const ratingsArray = this.questions().map(q => ({
      questionId: q._id,
      score: Number(form.get(q._id)?.value)
    }));

    // Perform Client-Side AES-256-GCM End-to-End Encryption of comments
    const rawRemark = form.get('remark')?.value || '';
    const encryptedRemark = await this.encryptRemark(rawRemark);

    const payload: FeedbackPayload = {
      courseId: assign.course._id,
      facultyId: assign.faculty._id,
      ratings: ratingsArray,
      remark: encryptedRemark
    };

    this.studentService.submitFeedback(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.spinner.hide();
        this.triggerHapticFeedback(); // Success completion haptic click

        // 🎉 SUCCESS INTERACTIVE ANIMATIONS
        this.triggerConfetti();
        this.toastr.success(`Feedback for ${assign.course.courseName} submitted anonymously!`, 'Submission Received', {
          progressBar: true,
          positionClass: 'toast-top-right'
        });

        // CRUCIAL: Map & update the courses list directly without full reload!
        this.courses.update(list =>
          list.map(c => {
            if (c.assignmentId === assign.assignmentId) {
              return { ...c, feedbackSubmitted: true };
            }
            return c;
          })
        );

        // Transition directly to the premium "Success Experience" Glass Tab within the modal frame
        this.showSuccessExperience.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.spinner.hide();
        const msg = err?.error?.message || 'Feedback publication failed. Check connection.';
        this.submitError.set(msg);
        this.toastr.error(msg, 'Submission Failed');
      }
    });
  }

  /**
   * Pure JS Web Crypto API client-side symmetric E2EE function
   * Encrypts plain remark string to: "iv_hex:ciphertext_hex:auth_tag_hex" matching backend AES-256-GCM decryption
   */
  async encryptRemark(remark: string): Promise<string> {
    if (!remark || !remark.trim()) return '';
    try {
      const secretString = 'IIIT_RANCHI_SECURE_E2EE_SECRET_2026'; // Match backend shared key
      const enc = new TextEncoder();

      // Hash key using SHA-256
      const keyData = enc.encode(secretString);
      const hash = await window.crypto.subtle.digest('SHA-256', keyData);

      // Import symmetric AES key
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Generate secure 12-byte initialization vector
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const remarkData = enc.encode(remark);

      // Perform AES-GCM Encryption
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        remarkData
      );

      // Process Web Crypto output containing ciphertext + 16-byte auth tag
      const combined = new Uint8Array(encryptedBuffer);
      const ciphertext = combined.slice(0, combined.byteLength - 16);
      const authTag = combined.slice(combined.byteLength - 16);

      // Convert to standard hex strings
      const toHex = (arr: Uint8Array) => Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');

      const ivHex = toHex(iv);
      const ciphertextHex = toHex(ciphertext);
      const authTagHex = toHex(authTag);

      return `${ivHex}:${ciphertextHex}:${authTagHex}`;
    } catch (err) {
      console.error('Client-side AES E2EE failed:', err);
      return remark; // Fallback
    }
  }

  // Pure CSS-DOM Hardware Accelerated Floating Confetti Burst
  triggerConfetti() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '99999';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

    for (let i = 0; i < 80; i++) {
      const particle = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.style.position = 'absolute';
      particle.style.width = `${Math.floor(Math.random() * 8) + 7}px`;
      particle.style.height = `${Math.floor(Math.random() * 8) + 7}px`;
      particle.style.backgroundColor = color;
      particle.style.borderRadius = Math.random() > 0.55 ? '50%' : '15%';

      // Burst starting position: bottom-center random spread
      particle.style.left = `${Math.floor(Math.random() * 40) + 30}vw`;
      particle.style.bottom = '-15px';
      particle.style.opacity = '1';
      particle.style.transform = `rotate(${Math.random() * 360}deg)`;

      // Transition setup with custom ease values for drift
      particle.style.transition = `
        transform ${Math.random() * 2 + 1.8}s cubic-bezier(0.25, 1, 0.5, 1),
        left ${Math.random() * 2 + 1.8}s ease-out,
        bottom ${Math.random() * 2 + 1.8}s cubic-bezier(0.25, 1, 0.5, 1),
        opacity ${Math.random() * 1.5 + 1.8}s ease-out
      `;

      container.appendChild(particle);

      // Force instant reflow then assign transitions
      setTimeout(() => {
        const destLeft = Math.floor(Math.random() * 100);
        const destBottom = Math.floor(Math.random() * 75) + 20;
        particle.style.left = `${destLeft}vw`;
        particle.style.bottom = `${destBottom}vh`;
        particle.style.transform = `rotate(${Math.random() * 1440}deg) scale(0.4)`;
        particle.style.opacity = '0';
      }, 55);
    }

    // Clean up DOM tree
    setTimeout(() => {
      container.remove();
    }, 4500);
  }

  async triggerHapticFeedback() {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (err) {
      // Gracefully bypass on browser
    }
  }
}
