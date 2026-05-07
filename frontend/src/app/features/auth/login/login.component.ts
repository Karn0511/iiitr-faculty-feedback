import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4"
         style="background: radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 60%);">

      <!-- Animated background orbs -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style="background: radial-gradient(circle, #6366f1, transparent);"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
             style="background: radial-gradient(circle, #8b5cf6, transparent);"></div>
      </div>

      <div class="relative w-full max-w-md animate-slide-up">

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white">Welcome Back</h1>
          <p class="text-slate-400 text-sm mt-1">IIIT Ranchi Faculty Feedback System</p>
        </div>

        <!-- Card -->
        <div class="glass-card p-8">

          <!-- Error Alert -->
          <div *ngIf="error" class="mb-6 p-4 rounded-xl bg-rose-900/40 border border-rose-700/50 text-rose-300 text-sm flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            {{ error }}
          </div>

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input type="email" [(ngModel)]="email" name="email" required
                     placeholder="you@iiitranchi.ac.in"
                     class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input type="password" [(ngModel)]="password" name="password" required
                     placeholder="••••••••"
                     class="input-field" />
            </div>

            <button type="submit" class="btn-primary w-full mt-2" [disabled]="loading">
              <svg *ngIf="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-6">
            <div class="flex-1 h-px bg-surface-border"></div>
            <span class="text-slate-500 text-xs">or continue with</span>
            <div class="flex-1 h-px bg-surface-border"></div>
          </div>

          <!-- Google OAuth -->
          <button (click)="loginWithGoogle()" class="btn-ghost w-full gap-3">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

        </div>

        <p class="text-center text-slate-500 text-xs mt-6">
          Restricted to &#64;iiitranchi.ac.in accounts only
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email    = '';
  password = '';
  loading  = false;
  error    = '';

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Please enter your email and password.';
      return;
    }
    this.loading = true;
    this.error   = '';

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.auth.redirectByRole();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Login failed. Please check your credentials.';
      }
    });
  }

  loginWithGoogle() {
    this.auth.loginWithGoogle();
  }
}
