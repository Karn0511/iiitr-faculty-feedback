import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerService } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen w-full flex items-center justify-center relative p-4 sm:p-6 overflow-hidden bg-surface">

      <!-- Background design -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style="background: radial-gradient(circle, #6366f1, transparent);"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
             style="background: radial-gradient(circle, #8b5cf6, transparent);"></div>
      </div>

      <div class="relative w-full max-w-lg animate-slide-up">

        <!-- Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <h1 class="text-xl font-bold text-white">Create Portal Account</h1>
          <p class="text-slate-400 text-xs mt-1">Feedback Management System for IIIT Ranchi</p>
        </div>

        <!-- Signup Card -->
        <div class="glass-card p-6 sm:p-8">

          <!-- Form -->
          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-4">

            <!-- Full Name -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
              <input formControlName="name" type="text" placeholder="John Doe" class="input-field" />
              <p *ngIf="signupForm.get('name')?.touched && signupForm.get('name')?.invalid" class="text-xs text-rose-400 mt-1">
                Name is required (at least 2 characters).
              </p>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 font-semibold">Institutional Email</label>
              <input formControlName="email" type="email" placeholder="john.doe&#64;iiitranchi.ac.in" class="input-field" />
              <p *ngIf="signupForm.get('email')?.touched && signupForm.get('email')?.invalid" class="text-xs text-rose-400 mt-1">
                A valid institutional email ending in &#64;iiitranchi.ac.in is required.
              </p>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Password</label>
              <input formControlName="password" type="password" placeholder="••••••••" class="input-field" />
              <p *ngIf="signupForm.get('password')?.touched && signupForm.get('password')?.invalid" class="text-xs text-rose-400 mt-1">
                Password must be at least 6 characters.
              </p>
            </div>

            <!-- Role Grid Selector -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Your Portal Role</label>
              <div class="grid grid-cols-2 gap-3">
                <button type="button" (click)="setRole('Student')"
                        class="p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2"
                        [ngClass]="selectedRole() === 'Student' ? 'bg-brand-500/15 border-brand-500 text-brand-300 shadow-glow' : 'bg-slate-950/40 border-surface-border text-slate-400 hover:text-white'">
                  <span>🎓</span> Student
                </button>
                <button type="button" (click)="setRole('Faculty')"
                        class="p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2"
                        [ngClass]="selectedRole() === 'Faculty' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-slate-950/40 border-surface-border text-slate-400 hover:text-white'">
                  <span>👨‍🏫</span> Faculty
                </button>
              </div>
            </div>

            <!-- Section Selector (Only for Students) -->
            <div *ngIf="selectedRole() === 'Student'" class="animate-fade-in">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Academic Section</label>
              <select formControlName="section" class="input-field appearance-none cursor-pointer">
                <option value="" disabled selected>Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="CSE">CSE Branch</option>
                <option value="ECE">ECE Branch</option>
              </select>
              <p *ngIf="signupForm.get('section')?.touched && signupForm.get('section')?.invalid" class="text-xs text-rose-400 mt-1">
                Please select your section.
              </p>
            </div>

            <!-- Error Banner -->
            <div *ngIf="error()" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-fade-in">
              ⚠️ {{ error() }}
            </div>

            <!-- Submit -->
            <button type="submit" class="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider" [disabled]="loading() || signupForm.invalid">
              <svg *ngIf="loading()" class="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ loading() ? 'Creating Account...' : 'Complete Registration' }}
            </button>
          </form>

          <div class="mt-6 text-center text-xs text-slate-500">
            Already have an account? <a routerLink="/login" class="text-brand-400 hover:underline">Sign In</a>
          </div>
        </div>

        <p class="text-center text-[10px] text-slate-600 mt-4 leading-relaxed">
          Account registrations are verified against IIIT Ranchi official records. False information will lead to immediate lockout.
        </p>
      </div>
    </div>
  `
})
export class SignupComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private spinner= inject(SpinnerService);

  signupForm!: FormGroup;
  loading      = signal(false);
  error        = signal('');
  selectedRole = signal<'Student' | 'Faculty'>('Student');

  ngOnInit() {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@iiitranchi\.ac\.in$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['Student', Validators.required],
      section: ['']
    });

    // Handle conditional validation for section
    this.signupForm.get('role')?.valueChanges.subscribe(role => {
      const secControl = this.signupForm.get('section');
      if (role === 'Student') {
        secControl?.setValidators([Validators.required]);
      } else {
        secControl?.clearValidators();
      }
      secControl?.updateValueAndValidity();
    });

    // Trigger initial check
    this.signupForm.get('section')?.setValidators([Validators.required]);
    this.signupForm.get('section')?.updateValueAndValidity();
  }

  setRole(role: 'Student' | 'Faculty') {
    this.selectedRole.set(role);
    this.signupForm.patchValue({ role });
  }

  onSubmit() {
    if (this.signupForm.invalid) return;

    this.loading.set(true);
    this.error.set('');
    this.spinner.show();

    const payload = this.signupForm.value;

    this.auth.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.spinner.hide();
        this.auth.redirectByRole();
      },
      error: (err) => {
        this.loading.set(false);
        this.spinner.hide();
        this.error.set(err?.error?.message || 'Registration failed. Email might be in use.');
      }
    });
  }
}
