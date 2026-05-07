import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen w-full flex items-center justify-center p-4 bg-[#020617] text-slate-200">
      <div class="w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-brand-500/30 shadow-2xl shadow-brand-500/10">
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto bg-brand-500/10 border border-brand-500/30 rounded-2xl flex items-center justify-center mb-4">
            <span class="text-3xl">🔐</span>
          </div>
          <h2 class="text-2xl font-black text-white">Action Required</h2>
          <p class="text-xs text-slate-400 font-semibold mt-2">
            For security reasons, you must change your default password before accessing your portal.
          </p>
        </div>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="space-y-1">
            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400">New Password</label>
            <input formControlName="newPassword" type="password" placeholder="Min. 6 characters"
                   class="w-full h-11 px-4 rounded-xl text-xs outline-none bg-slate-950/50 border border-slate-700 text-white focus:border-brand-500 transition-colors" />
            <div *ngIf="resetForm.get('newPassword')?.touched && resetForm.get('newPassword')?.invalid" class="text-[10px] text-rose-400 font-bold mt-1">
              Must be at least 6 characters.
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Confirm Password</label>
            <input formControlName="confirmPassword" type="password" placeholder="Re-enter password"
                   class="w-full h-11 px-4 rounded-xl text-xs outline-none bg-slate-950/50 border border-slate-700 text-white focus:border-brand-500 transition-colors" />
            <div *ngIf="resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched" class="text-[10px] text-rose-400 font-bold mt-1">
              Passwords do not match.
            </div>
          </div>

          <div *ngIf="error()" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {{ error() }}
          </div>

          <button type="submit" [disabled]="resetForm.invalid || loading()"
                  class="w-full py-3.5 mt-4 text-xs font-black uppercase tracking-wider rounded-xl bg-brand-500 hover:bg-brand-400 text-white transition-colors disabled:opacity-50 flex items-center justify-center">
            <svg *ngIf="loading()" class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading() ? 'Saving...' : 'Secure & Continue' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  resetForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.resetForm.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const newPassword = this.resetForm.value.newPassword;

    this.auth.changePassword(newPassword).subscribe({
      next: (res) => {
        this.loading.set(false);
        // On success, the backend returns a new token and user object where requiresPasswordChange is false
        // Auth service will store it, and we can now redirect based on role
        this.auth.redirectByRole();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to update password.');
      }
    });
  }
}
