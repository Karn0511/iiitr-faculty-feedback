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
    <div class="min-h-screen w-full flex items-center justify-center relative p-4 sm:p-6 overflow-y-auto py-12 bg-surface">

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
          <div class="inline-flex items-center justify-center w-14 h-14 mb-3">
            <svg class="w-12 h-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Outer circle border with golden glow -->
              <circle cx="50" cy="50" r="45" stroke="url(#logoGold)" stroke-width="3" fill="rgba(15, 23, 42, 0.6)"></circle>
              <circle cx="50" cy="50" r="40" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"></circle>
              
              <!-- Technology / Network Hub Nodes -->
              <g opacity="0.85">
                <line x1="32" y1="50" x2="50" y2="32" stroke="url(#logoBlue)" stroke-width="1.5"></line>
                <line x1="50" y1="32" x2="68" y2="50" stroke="url(#logoBlue)" stroke-width="1.5"></line>
                <line x1="68" y1="50" x2="50" y2="68" stroke="url(#logoBlue)" stroke-width="1.5"></line>
                <line x1="50" y1="68" x2="32" y2="50" stroke="url(#logoBlue)" stroke-width="1.5"></line>
                
                <line x1="50" y1="22" x2="50" y2="78" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" stroke-dasharray="2 2"></line>
                <line x1="22" y1="50" x2="78" y2="50" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" stroke-dasharray="2 2"></line>
              </g>

              <!-- Central Crest / Shield -->
              <path d="M42 38C42 38 46 36 50 36C54 36 58 38 58 38V54C58 60 50 64 50 64C50 64 42 60 42 54V38Z" fill="url(#crestBg)" stroke="url(#logoGold)" stroke-width="2" filter="url(#glow)"></path>

              <!-- Central symbol: Glowing IT Node with Rising Sun / Lamp -->
              <circle cx="50" cy="46" r="4" fill="#ffffff" filter="url(#glow)"></circle>
              <circle cx="50" cy="46" r="2" fill="url(#logoGold)"></circle>
              
              <!-- Abstract Book at the bottom of the crest -->
              <path d="M45 54H55M45 57H55" stroke="rgba(255, 255, 255, 0.6)" stroke-width="1" stroke-linecap="round"></path>

              <!-- Gradients & Filters Definition -->
              <defs>
                <linearGradient id="logoGold" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#fbbf24"></stop>
                  <stop offset="50%" stop-color="#f59e0b"></stop>
                  <stop offset="100%" stop-color="#d97706"></stop>
                </linearGradient>
                <linearGradient id="logoBlue" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#3b82f6"></stop>
                  <stop offset="100%" stop-color="#8b5cf6"></stop>
                </linearGradient>
                <linearGradient id="crestBg" x1="42" y1="36" x2="58" y2="64" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#1e1b4b"></stop>
                  <stop offset="100%" stop-color="#030712"></stop>
                </linearGradient>
                <filter id="glow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
                  <feGaussianBlur stdDeviation="1.5" result="blur"></feGaussianBlur>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                </filter>
              </defs>
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
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Institutional Email</label>
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
