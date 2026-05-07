import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService, CourseAssignment } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Global Mesh Background Elements -->
    <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none z-0"></div>
    <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-teal-500/10 blur-[80px] pointer-events-none z-0"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10 space-y-8">
      
      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">VERIFICATION</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Audit & Status</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Review your evaluation logs, verify security parameters, and download institutional double-anonymity certificates.
          </p>
        </div>
      </div>

      <!-- Main Layout Cards Grid -->
      <div class="grid lg:grid-cols-12 gap-8">
        
        <!-- LEFT: Security Compliance (5cols) -->
        <div class="lg:col-span-5 space-y-8">
          <div class="glass-card p-6 sm:p-8 space-y-6">
            <h2 class="text-white font-extrabold text-base border-b border-surface-border pb-3">Security Checklist</h2>
            
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <span class="text-emerald-400 text-lg">🛡️</span>
                <div>
                  <h4 class="text-xs font-bold text-white uppercase tracking-wider">Double-Anonymity Guard</h4>
                  <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">No tracking tags are persisted. The system separates your auth context from submitted questionnaire rating vectors.</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span class="text-emerald-400 text-lg">🔑</span>
                <div>
                  <h4 class="text-xs font-bold text-white uppercase tracking-wider">Cryptographic Insulation</h4>
                  <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">Evaluation payloads are compiled using one-way cryptographic tokens. Neither faculty nor administrative observers can reverse-map responses.</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span class="text-emerald-400 text-lg">🔒</span>
                <div>
                  <h4 class="text-xs font-bold text-white uppercase tracking-wider">Server-Side Sandbox</h4>
                  <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">Completed feedback runs on insulated backend processors to strictly limit horizontal cross-site scraping attempts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Verified Progression Standings (7cols) -->
        <div class="lg:col-span-7">
          <div class="glass-card p-6 sm:p-8 space-y-4">
            <h2 class="text-white font-extrabold text-base border-b border-surface-border pb-3 flex items-center justify-between">
              <span>Verified Submissions Audit</span>
              <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded font-bold uppercase">SECURE PORTAL</span>
            </h2>

            <div *ngIf="loading()" class="text-center py-12 space-y-3">
              <div class="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-slate-500 text-xs font-mono">Retrieving progress index...</p>
            </div>

            <div *ngIf="!loading() && courses().length === 0" class="text-center py-16 text-slate-500 text-xs">
              No registered institutional assignments found for your Section.
            </div>

            <div *ngIf="!loading() && courses().length > 0" class="space-y-3">
              <div *ngFor="let assign of courses()"
                   class="p-4 rounded-2xl border bg-slate-950/40 flex items-center justify-between gap-4"
                   [ngClass]="assign.feedbackSubmitted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-surface-border opacity-70'">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-extrabold text-white font-mono uppercase">{{ assign.course.courseCode }}</span>
                    <span class="text-slate-500 text-[10px]">•</span>
                    <span class="text-slate-300 text-xs font-medium">{{ assign.course.courseName }}</span>
                  </div>
                  <p class="text-[10px] text-slate-500 mt-1">Instructor: {{ assign.faculty.name }}</p>
                </div>

                <div>
                  <span *ngIf="assign.feedbackSubmitted" class="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> SECURED
                  </span>
                  <span *ngIf="!assign.feedbackSubmitted" class="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> INCOMPLETE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `
})
export class StudentStatusComponent implements OnInit {
  private student = inject(StudentService);
  readonly auth    = inject(AuthService);

  readonly courses = signal<CourseAssignment[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.loadProgress();
  }

  loadProgress() {
    this.loading.set(true);
    this.student.getAvailableCourses().subscribe({
      next: (res) => {
        if (res?.success) {
          this.courses.set(res.data.courses || []);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
