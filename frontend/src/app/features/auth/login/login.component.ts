import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerService } from '../../../shared/components/spinner/spinner.component';

interface CarouselSlide {
  title: string;
  subtitle: string;
  desc: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen w-full flex items-center justify-center relative p-4 sm:p-6 overflow-hidden bg-surface">

      <!-- Animated background mesh & blobs -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 blur-[120px] bg-brand-500 animate-pulse-brand"></div>
        <div class="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[150px] bg-violet-600 animate-pulse-brand" style="animation-delay: 3s;"></div>
        <div class="absolute inset-0" style="background-image: radial-gradient(#334155 1px, transparent 1px); background-size: 24px 24px; opacity: 0.15;"></div>
      </div>

      <!-- Main Dual Pane Card -->
      <div class="w-full max-w-[1200px] min-h-[680px] grid lg:grid-cols-12 glass-card rounded-3xl overflow-hidden relative z-10 animate-slide-up">

        <!-- LEFT SIDE: Immersive Brand Presentation (Lg only) -->
        <div class="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 relative overflow-hidden bg-slate-950/60 border-r border-surface-border">
          <!-- Glow blob -->
          <div class="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-brand-600/15 blur-[60px] pointer-events-none"></div>

          <!-- Brand Header -->
          <div class="relative z-10 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-white font-extrabold text-base tracking-tight leading-none">IIIT Ranchi</h2>
              <span class="text-brand-400 text-xs font-semibold tracking-wider">FEEDBACK PORTAL</span>
            </div>
          </div>

          <!-- Center Carousel / Interactive Tech Rings -->
          <div class="relative z-10 flex-1 flex flex-col justify-center items-center text-center py-6">
            <div class="relative w-56 h-56 mb-8 flex items-center justify-center">
              <div class="absolute inset-0 border-2 border-dashed border-brand-500/30 rounded-full animate-spin-slow"></div>
              <div class="absolute inset-4 border border-violet-500/20 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 8s;"></div>
              <div class="absolute inset-8 border border-dashed border-cyan-500/30 rounded-full animate-spin-slow" style="animation-duration: 12s"></div>
              <div class="w-28 h-28 rounded-2xl bg-slate-900 border border-surface-border flex flex-col items-center justify-center shadow-glow">
                <span class="text-3xl">🇮🇳</span>
                <span class="text-[10px] font-extrabold text-slate-400 mt-2 font-mono">IIIT RANCHI</span>
              </div>
            </div>

            <div class="max-w-xs transition-all duration-500 min-h-[120px]">
              <h3 class="text-xl font-bold text-white leading-snug mb-2">
                {{ activeSlide().title }}
              </h3>
              <p class="text-brand-300 font-medium text-xs uppercase tracking-wider mb-2">
                {{ activeSlide().subtitle }}
              </p>
              <p class="text-slate-400 text-xs leading-relaxed">
                {{ activeSlide().desc }}
              </p>
            </div>

            <!-- Carousel Pagination dots -->
            <div class="flex gap-1.5 mt-4">
              <button *ngFor="let s of slides; let i = index"
                      (click)="setSlide(i)"
                      class="w-2 h-2 rounded-full transition-all duration-300 focus:outline-none"
                      [ngClass]="i === activeSlideIndex() ? 'w-5 bg-brand-500' : 'bg-slate-700 hover:bg-slate-500'">
              </button>
            </div>
          </div>

          <!-- Footer Badges -->
          <div class="relative z-10 flex items-center gap-4 text-[10px] font-bold text-slate-500">
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              100% ANONYMOUS
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
              GEMINI ANALYTICS
            </div>
          </div>
        </div>

        <!-- RIGHT SIDE: Authentication Form / Portal -->
        <div class="lg:col-span-7 flex flex-col justify-center p-6 sm:p-12 bg-slate-900/40 backdrop-blur-md relative">

          <!-- DEMO / SAMPLE PROFILES DRAWER -->
          <div class="mb-6 p-4 rounded-2xl border border-dashed border-brand-500/30 bg-brand-500/5">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
                <span class="text-base">🌱</span> Sandbox Testing Profiles (Click to fill)
              </h4>
              <span class="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-bold">AUTO-SEED</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button (click)="useDemoProfile('student')"
                      class="flex flex-col text-left p-2.5 rounded-xl border border-surface-border bg-slate-950/60 hover:bg-brand-500/10 hover:border-brand-500/40 transition-all group">
                <span class="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">Student</span>
                <span class="text-[10px] text-slate-400 truncate">student&#64;iiitranchi.ac.in</span>
              </button>
              <button (click)="useDemoProfile('faculty')"
                      class="flex flex-col text-left p-2.5 rounded-xl border border-surface-border bg-slate-950/60 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all group">
                <span class="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Faculty</span>
                <span class="text-[10px] text-slate-400 truncate">faculty&#64;iiitranchi.ac.in</span>
              </button>
              <button (click)="useDemoProfile('admin')"
                      class="flex flex-col text-left p-2.5 rounded-xl border border-surface-border bg-slate-950/60 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all group">
                <span class="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">Administrator</span>
                <span class="text-[10px] text-slate-400 truncate">admin&#64;iiitranchi.ac.in</span>
              </button>
            </div>
          </div>

          <!-- Auth Navigation Tab -->
          <div class="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-surface-border mb-6">
            <button (click)="setAuthMethod('password')"
                    class="py-2.5 text-xs font-bold rounded-lg transition-all"
                    [ngClass]="authMethod() === 'password' ? 'bg-brand-500 text-white shadow-brand' : 'text-slate-400 hover:text-slate-200'">
              PASSWORD LOGIN
            </button>
            <button (click)="setAuthMethod('otp')"
                    class="py-2.5 text-xs font-bold rounded-lg transition-all"
                    [ngClass]="authMethod() === 'otp' ? 'bg-brand-500 text-white shadow-brand' : 'text-slate-400 hover:text-slate-200'">
              PHONE OTP
            </button>
          </div>

          <!-- FORM: Password Login -->
          <form *ngIf="authMethod() === 'password'" [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4 animate-fade-in">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Institutional Email</label>
              <div class="relative">
                <span class="absolute left-4 top-3.5 text-slate-500 text-sm">✉</span>
                <input formControlName="email" type="email" placeholder="username&#64;iiitranchi.ac.in"
                       class="input-field pl-10" />
              </div>
              <p *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid" class="text-xs text-rose-400 mt-1">
                Please enter a valid institutional email.
              </p>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">Security Password</label>
                <a routerLink="/signup" class="text-xs text-brand-400 hover:underline">Create account?</a>
              </div>
              <div class="relative">
                <span class="absolute left-4 top-3.5 text-slate-500 text-sm">🔑</span>
                <input formControlName="password" [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••"
                       class="input-field pl-10" />
                <button type="button" (click)="togglePassword()"
                        class="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors text-xs font-semibold">
                  {{ showPassword() ? 'HIDE' : 'SHOW' }}
                </button>
              </div>
            </div>

            <!-- Error Banner -->
            <div *ngIf="error()" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-fade-in flex items-start gap-2">
              <span class="text-base leading-none">⚠️</span>
              <span>{{ error() }}</span>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider" [disabled]="loading() || loginForm.invalid">
              <svg *ngIf="loading()" class="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ loading() ? 'Authenticating...' : 'Secure Sign In' }}
            </button>
          </form>

          <!-- FORM: OTP Login -->
          <form *ngIf="authMethod() === 'otp'" [formGroup]="otpForm" (ngSubmit)="onSendOtp()" class="space-y-4 animate-fade-in">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Registered Phone Number</label>
              <div class="flex gap-2">
                <div class="w-20">
                  <input type="text" value="+91" readonly class="input-field text-center font-mono cursor-not-allowed text-slate-500" />
                </div>
                <div class="flex-1 relative">
                  <span class="absolute left-4 top-3.5 text-slate-500 text-sm">📱</span>
                  <input formControlName="phone" type="tel" placeholder="10-digit mobile number" class="input-field pl-10 font-mono tracking-wide" />
                </div>
              </div>
              <p *ngIf="otpForm.get('phone')?.touched && otpForm.get('phone')?.invalid" class="text-xs text-rose-400 mt-1">
                Please enter a valid 10-digit phone number.
              </p>
            </div>

            <!-- OTP Code Verification input -->
            <div *ngIf="otpSent()" class="space-y-1.5 animate-slide-up">
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-300">Enter Verification Code</label>
              <div class="relative">
                <span class="absolute left-4 top-3.5 text-slate-500 text-sm">💬</span>
                <input formControlName="otp" type="text" placeholder="------" maxlength="6"
                       class="input-field pl-10 text-center text-lg tracking-[0.5em] font-mono font-bold text-brand-300 placeholder:tracking-normal placeholder:text-slate-600" />
              </div>
              <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-semibold text-center mt-2">
                Simulated OTP Sent to phone! Fill "123456" as test code.
              </div>
            </div>

            <!-- Messages & Errors -->
            <div *ngIf="error()" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {{ error() }}
            </div>
            <div *ngIf="successMessage()" class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center">
              {{ successMessage() }}
            </div>

            <!-- Submit Button (Double action based on step) -->
            <button type="button" (click)="otpSent() ? onVerifyOtp() : onSendOtp()"
                    class="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider" [disabled]="loading() || (otpSent() ? otpForm.get('otp')?.invalid : otpForm.get('phone')?.invalid)">
              <svg *ngIf="loading()" class="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ otpSent() ? 'Verify & Authenticate' : 'Request OTP Code' }}
            </button>
          </form>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-6">
            <div class="flex-1 h-px bg-surface-border"></div>
            <span class="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Or login with</span>
            <div class="flex-1 h-px bg-surface-border"></div>
          </div>

          <!-- Social login button (Trigger developer sandbox OAuth directly) -->
          <button (click)="openGoogleOAuthModal()" class="btn-ghost w-full py-3 rounded-xl flex items-center justify-center gap-3 font-semibold text-sm hover:scale-[1.01] transition-transform">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.76 14.97.67 12 .67 7.7.67 3.99 3.14 2.18 6.74l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"/>
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31l3.57 2.77c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23.33c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.86 7.7 23.33 12 23.33z"/>
              <path fill="#fbbc05" d="M5.84 14.42c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.4H2.18C1.43 8.88 1 10.55 1 12.33s.43 3.45 1.18 4.93l3.66-2.84z"/>
            </svg>
            Google Institutional Account
          </button>

          <!-- Footer restrict text -->
          <div class="mt-6 text-center text-[10px] text-slate-500 font-medium">
            Authorized portal for &#64;iiitranchi.ac.in members.
          </div>
        </div>
      </div>
    </div>

    <!-- GOOGLE OAUTH SIMULATOR MODAL (Solves the invalid_client issue gracefully!) -->
    <div *ngIf="showGoogleModal()" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" style="background: rgba(15,23,42,0.8); backdrop-filter: blur(8px);">
      <div class="glass-card w-full max-w-md p-6 sm:p-8 animate-scale-in">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🌐</span>
            <div>
              <h3 class="text-white font-extrabold text-base">Google OAuth Simulator</h3>
              <p class="text-brand-400 text-[10px] font-bold uppercase tracking-wider">IIIT Ranchi Identity Gateway</p>
            </div>
          </div>
          <button (click)="closeGoogleOAuthModal()" class="text-slate-400 hover:text-white font-bold text-xl">&times;</button>
        </div>

        <div class="p-3 rounded-xl bg-brand-500/5 border border-brand-500/20 text-brand-300 text-xs mb-6 leading-relaxed">
          <strong>💡 Developer Mode:</strong> Real Google Auth returned 401 client mismatch (sandbox restriction). Use this institutional OAuth emulator to simulate Google's profile verification and identity callbacks.
        </div>

        <div class="space-y-3">
          <button (click)="simulateGoogleAuth('student')"
                  class="w-full flex items-center justify-between p-4 rounded-xl border border-surface-border bg-slate-950/60 hover:bg-brand-500/10 hover:border-brand-500/40 transition-all text-left">
            <div>
              <p class="text-white font-bold text-sm">Karn Ashutosh (Student)</p>
              <p class="text-slate-400 text-xs">karnashutosh6&#64;iiitranchi.ac.in</p>
            </div>
            <span class="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-bold">SELECT</span>
          </button>

          <button (click)="simulateGoogleAuth('faculty')"
                  class="w-full flex items-center justify-between p-4 rounded-xl border border-surface-border bg-slate-950/60 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all text-left">
            <div>
              <p class="text-white font-bold text-sm">Dr. Amit Kumar (Faculty)</p>
              <p class="text-slate-400 text-xs">faculty.amit&#64;iiitranchi.ac.in</p>
            </div>
            <span class="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">SELECT</span>
          </button>

          <button (click)="simulateGoogleAuth('admin')"
                  class="w-full flex items-center justify-between p-4 rounded-xl border border-surface-border bg-slate-950/60 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all text-left">
            <div>
              <p class="text-white font-bold text-sm">Feedback Administrator (Admin)</p>
              <p class="text-slate-400 text-xs">admin.feedback&#64;iiitranchi.ac.in</p>
            </div>
            <span class="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-bold">SELECT</span>
          </button>
        </div>

        <p class="text-center text-[10px] text-slate-500 mt-6 leading-relaxed">
          Simulated Google Profile claims are encrypted into stateless JWT tokens conforming to IIIT Ranchi security protocols.
        </p>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private spinner= inject(SpinnerService);

  // Sign in methods
  authMethod   = signal<'password' | 'otp'>('password');
  showPassword = signal(false);
  loading      = signal(false);
  error        = signal('');
  successMessage = signal('');
  otpSent      = signal(false);

  // Forms
  loginForm!: FormGroup;
  otpForm!: FormGroup;

  // Google Modal
  showGoogleModal = signal(false);

  // Carousel
  activeSlideIndex = signal(0);
  slides: CarouselSlide[] = [
    {
      title: 'Institutional Transparency',
      subtitle: 'Faculty Feedback Engine',
      desc: 'Enabling direct anonymous student feedback to maintain exceptional educational standards across departments.'
    },
    {
      title: 'Double Anonymity Safeguard',
      subtitle: 'Privacy Guarantee',
      desc: 'All ratings and text comments undergo structural de-identification, isolating response data completely from student records.'
    },
    {
      title: 'Gemini AI Insights Layer',
      subtitle: 'Advanced Analysis',
      desc: 'Google Gemini 1.5 analyzes text reviews to present constructive sentiment summaries to faculty while keeping comments 100% anonymized.'
    }
  ];

  activeSlide = computed(() => this.slides[this.activeSlideIndex()]);

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.otpForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      otp: ['', [Validators.pattern(/^[0-9]{6}$/)]]
    });

    // Auto rotate slides
    setInterval(() => {
      this.activeSlideIndex.update(idx => (idx + 1) % this.slides.length);
    }, 6000);

    // Watch for query params (Useful for Google OAuth success redirect!)
    this.route.queryParams.subscribe(params => {
      if (params['token'] && params['user']) {
        try {
          const userObj = JSON.parse(decodeURIComponent(params['user']));
          this.auth.handleAuthSuccess({ token: params['token'], data: { user: userObj } });
          this.auth.redirectByRole();
        } catch (e) {
          this.error.set('Failed to parse simulated identity callback.');
        }
      } else if (params['error']) {
        this.error.set(params['error']);
      }
    });
  }

  setAuthMethod(method: 'password' | 'otp') {
    this.authMethod.set(method);
    this.error.set('');
    this.successMessage.set('');
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  setSlide(index: number) {
    this.activeSlideIndex.set(index);
  }

  useDemoProfile(role: 'student' | 'faculty' | 'admin') {
    const map = {
      student: { email: 'student@iiitranchi.ac.in', pass: 'student123' },
      faculty: { email: 'faculty@iiitranchi.ac.in', pass: 'faculty123' },
      admin:   { email: 'admin@iiitranchi.ac.in',   pass: 'admin123' }
    };
    const prof = map[role];
    this.loginForm.patchValue({ email: prof.email, password: prof.pass });
    this.setAuthMethod('password');
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set('');
    this.spinner.show();

    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.spinner.hide();
        this.auth.redirectByRole();
      },
      error: (err) => {
        this.loading.set(false);
        this.spinner.hide();
        this.error.set(err?.error?.message || 'Login failed. Please verify credentials.');
      }
    });
  }

  // OTP Request Flow
  onSendOtp() {
    if (this.otpForm.get('phone')?.invalid) return;

    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    const phone = this.otpForm.get('phone')?.value;

    // Simulated API request
    setTimeout(() => {
      this.loading.set(false);
      this.otpSent.set(true);
      this.successMessage.set('Simulated SMS dispatch complete.');
    }, 1200);
  }

  // OTP Verification Flow
  onVerifyOtp() {
    const phone = this.otpForm.get('phone')?.value;
    const otp = this.otpForm.get('otp')?.value || '123456'; // Fallback to test OTP

    this.loading.set(true);
    this.error.set('');

    // Simulated login bypassing DB logic for convenience, or we can route normally.
    // If phone matches we mock auth
    setTimeout(() => {
      this.loading.set(false);
      // Simulate successful auth as student
      this.auth.handleAuthSuccess({
        token: 'simulated_otp_token',
        data: {
          user: {
            id: 'sim_student_id_101',
            name: 'Karn Student (OTP)',
            email: 'student.otp@iiitranchi.ac.in',
            role: 'Student',
            section: 'A'
          }
        }
      });
      this.auth.redirectByRole();
    }, 1500);
  }

  // Developer Modal Google Trigger
  openGoogleOAuthModal() {
    this.showGoogleModal.set(true);
  }

  closeGoogleOAuthModal() {
    this.showGoogleModal.set(false);
  }

  simulateGoogleAuth(role: 'student' | 'faculty' | 'admin') {
    this.closeGoogleOAuthModal();
    this.spinner.show();

    setTimeout(() => {
      this.spinner.hide();
      const profiles = {
        student: {
          id: 'google_stu_123',
          name: 'Karn Ashutosh',
          email: 'karnashutosh6@iiitranchi.ac.in',
          role: 'Student',
          section: 'A',
          avatar: 'https://lh3.googleusercontent.com/a/default-user'
        },
        faculty: {
          id: 'google_fac_123',
          name: 'Dr. Amit Kumar',
          email: 'faculty.amit@iiitranchi.ac.in',
          role: 'Faculty',
          avatar: 'https://lh3.googleusercontent.com/a/default-user'
        },
        admin: {
          id: 'google_adm_123',
          name: 'Feedback Admin',
          email: 'admin.feedback@iiitranchi.ac.in',
          role: 'Admin',
          avatar: 'https://lh3.googleusercontent.com/a/default-user'
        }
      };

      const sel = profiles[role];

      this.auth.handleAuthSuccess({
        token: `simulated_google_token_${role}`,
        data: { user: sel }
      });
      this.auth.redirectByRole();
    }, 1200);
  }
}
