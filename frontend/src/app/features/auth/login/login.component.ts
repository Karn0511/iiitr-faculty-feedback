import { Component, computed, inject, signal, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
    <div class="min-h-screen w-full flex items-center justify-center relative p-4 sm:p-6 overflow-y-auto py-12 bg-[#020617] text-slate-200">

      <!-- 1. Immersive aurora background grid and floating blobs with Mesh Shader -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <canvas #meshCanvas class="absolute inset-0 w-full h-full opacity-[0.15] mix-blend-screen"></canvas>
        <div class="bg-grid"></div>
        <div class="aurora-blob top-0 left-0"></div>
        <div class="aurora-blob-2 bottom-0 right-0"></div>
      </div>

      <!-- Main Dual Pane Glass Panel Container -->
      <div class="w-full max-w-[1200px] min-h-[600px] md:min-h-[720px] h-auto grid md:grid-cols-12 glass-panel rounded-3xl overflow-hidden relative z-10 animate-fade-in shadow-2xl shadow-black/60">

        <!-- LEFT SIDE: Spinning Tech Rings & Animated Brand Carousel -->
        <div class="hidden md:flex md:col-span-5 flex-col justify-between p-8 xl:p-12 relative overflow-hidden bg-slate-950/40 border-r border-slate-800/40 z-10">
          <div class="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-brand-600/10 blur-[60px] pointer-events-none"></div>

          <!-- Institutional Header branding -->
          <div class="relative z-10 flex items-center gap-3.5">
            <div class="w-11 h-11 flex items-center justify-center bg-slate-900/60 border border-slate-800 rounded-xl p-1.5 shadow-md">
              <img src="/logo.png" class="w-8 h-8 object-contain rounded-lg" alt="IIIT Ranchi Logo" />
            </div>
            <div>
              <h2 class="text-white font-black text-sm tracking-tight leading-none uppercase">IIIT Ranchi</h2>
              <span class="text-brand-400 text-[9px] font-black tracking-widest uppercase block mt-1">Faculty Feedback System</span>
            </div>
          </div>

          <!-- Tech spinning concentric rings visualizer (Separated Sibling 1) -->
          <div class="relative z-10 flex flex-col items-center justify-center text-center py-2">
            <div class="relative w-40 h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 shrink-0 flex items-center justify-center">
              
              <!-- Large Outer Boundary Ring (like the text border in the real logo) -->
              <div class="absolute w-52 h-52 lg:w-60 lg:h-60 xl:w-72 xl:h-72 rounded-full border-[1px] border-slate-700/50 flex items-center justify-center pointer-events-none z-0">
                <div class="absolute inset-0 rounded-full border-[1px] border-dashed border-slate-500/30 spin-reverse" style="animation-duration: 40s;"></div>
                <div class="absolute inset-[-10px] rounded-full border-[1px] border-dotted border-slate-600/40 spin-fast" style="animation-duration: 60s;"></div>
              </div>
              <!-- 3D Atomic Orbits -->
              <div class="orbit-container absolute inset-0">
                <!-- Red Orbit -->
                <div class="orbit orbit-1"></div>
                <!-- Green Orbit -->
                <div class="orbit orbit-2"></div>
                <!-- Blue Orbit with binary bits -->
                <div class="orbit orbit-3">
                  <div class="orbit-dot" style="top: -2px; left: 50%;"><span class="orbit-text">1</span></div>
                  <div class="orbit-dot" style="top: 20%; left: 88%;"><span class="orbit-text">0</span></div>
                  <div class="orbit-dot" style="top: 80%; left: 88%;"><span class="orbit-text">1</span></div>
                  <div class="orbit-dot" style="top: 80%; left: 12%;"><span class="orbit-text">0</span></div>
                </div>
              </div>
              
              <!-- Refined Floating Center Logo -->
              <div class="relative z-20 w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 rounded-full bg-slate-950/80 border border-slate-700/50 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] p-3 backdrop-blur-md">
                <div class="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" class="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 object-contain hover:scale-110 transition-transform duration-500" alt="IIIT Ranchi Emblem" />
                </div>
              </div>
            </div>
          </div>

          <!-- Carousel Slider texts & Dots (Separated Sibling 2) -->
          <div class="relative z-10 flex flex-col items-center text-center py-2">
            <div class="max-w-xs transition-all duration-500 min-h-[110px]">
              <h3 class="text-lg font-black text-white leading-snug mb-1.5">{{ activeSlide().title }}</h3>
              <p class="text-brand-400 font-bold text-[10px] uppercase tracking-wider mb-2">{{ activeSlide().subtitle }}</p>
              <p class="text-slate-400 text-xs leading-relaxed font-semibold">{{ activeSlide().desc }}</p>
            </div>

            <!-- Dots -->
            <div class="flex gap-2 mt-4">
              <button *ngFor="let s of slides; let i = index"
                      (click)="setSlide(i)"
                      class="w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none"
                      [ngClass]="i === activeSlideIndex() ? 'w-6 bg-brand-500 shadow-glow' : 'bg-slate-800 hover:bg-slate-700'">
              </button>
            </div>
          </div>

          <!-- Academic compliance standards footer -->
          <div class="relative z-10 flex items-center gap-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Double-Anonymized
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
              Gemini AI Audited
            </div>
          </div>
        </div>

        <!-- RIGHT SIDE: Integrated Auth Panel / Portal -->
        <div class="col-span-12 md:col-span-7 flex flex-col justify-center p-6 sm:p-10 md:p-12 lg:p-16 bg-slate-900/10 backdrop-blur-sm z-10 relative">

          <!-- Mobile Logo & 3D Orbits (only visible on mobile/tablet below md) -->
          <div class="md:hidden flex flex-col items-center justify-center mb-6 mt-2">
            <div class="relative w-32 h-32 shrink-0 mb-3 flex items-center justify-center">
              
              <!-- Compact 3D Orbits -->
              <div class="orbit-container absolute inset-0" style="perspective: 800px; transform: scale(0.65);">
                <div class="orbit orbit-1" style="inset: -4px;"></div>
                <div class="orbit orbit-2" style="inset: -4px;"></div>
                <div class="orbit orbit-3" style="inset: -4px;">
                  <div class="orbit-dot" style="top: -2px; left: 50%; width: 3px; height: 3px;"><span class="orbit-text" style="font-size: 8px; top: -10px;">1</span></div>
                  <div class="orbit-dot" style="top: 20%; left: 88%; width: 3px; height: 3px;"><span class="orbit-text" style="font-size: 8px; top: -10px;">0</span></div>
                </div>
              </div>
              
              <!-- Compact Floating Center Logo -->
              <div class="relative z-20 w-14 h-14 rounded-full bg-slate-950/80 border border-slate-700/50 flex items-center justify-center shadow-md p-1.5 backdrop-blur-sm">
                <div class="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" class="w-9 h-9 object-contain" alt="IIIT Ranchi Logo" />
                </div>
              </div>
            </div>
            <h2 class="text-white font-black text-sm uppercase tracking-tight text-center leading-none">IIIT Ranchi</h2>
            <span class="text-brand-400 text-[8px] font-black tracking-widest uppercase mt-1 leading-none">Faculty Feedback System</span>
          </div>

          <!-- A. PORTAL ROLE SELECTOR VIEW (If selectedRole is null) -->
          <div *ngIf="selectedRole() === null" class="space-y-8 animate-fade-in">
            <div class="text-center md:text-left space-y-2">
              <span class="text-xs font-black bg-brand-500/10 border border-brand-500/20 text-brand-300 px-3 py-1 rounded-full uppercase tracking-widest">Select Academic Portal</span>
              <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome to IIIT Ranchi</h1>
              <p class="text-slate-400 text-xs sm:text-sm font-semibold max-w-md">Anonymous educational standards assessment console. Select your category role to continue credentials verification.</p>
            </div>

            <!-- Grid displaying the three role button cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">

              <!-- Card: Student -->
              <div (click)="selectRole('student')"
                   class="group relative bg-slate-950/40 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-brand-500/40 hover:bg-brand-500/5 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between min-h-[180px]">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <div class="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 text-xl font-bold group-hover:bg-blue-500/20 transition-colors">🎓</div>
                <div class="mt-4">
                  <h3 class="text-sm font-black text-white">Student</h3>
                  <p class="text-[10px] text-slate-500 leading-normal font-semibold mt-1">Submit class feedback anonymously.</p>
                </div>
                <span class="text-[10px] text-brand-400 font-bold tracking-wider uppercase mt-4 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                  Enter portal ➔
                </span>
              </div>

              <!-- Card: Faculty -->
              <div (click)="selectRole('faculty')"
                   class="group relative bg-slate-950/40 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between min-h-[180px]">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <div class="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-xl font-bold group-hover:bg-emerald-500/20 transition-colors">👨‍🏫</div>
                <div class="mt-4">
                  <h3 class="text-sm font-black text-white">Faculty</h3>
                  <p class="text-[10px] text-slate-500 leading-normal font-semibold mt-1">Analyze scores & AI sentiment charts.</p>
                </div>
                <span class="text-[10px] text-emerald-400 font-bold tracking-wider uppercase mt-4 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                  Enter portal ➔
                </span>
              </div>

              <!-- Card: Admin -->
              <div (click)="selectRole('admin')"
                   class="group relative bg-slate-950/40 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between min-h-[180px]">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <div class="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 text-xl font-bold group-hover:bg-violet-500/20 transition-colors">🛡️</div>
                <div class="mt-4">
                  <h3 class="text-sm font-black text-white">Admin</h3>
                  <p class="text-[10px] text-slate-500 leading-normal font-semibold mt-1">Manage core sessions & questions.</p>
                </div>
                <span class="text-[10px] text-violet-400 font-bold tracking-wider uppercase mt-4 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                  Enter portal ➔
                </span>
              </div>

            </div>

            <!-- Authorized Footer hint -->
            <p class="text-center text-[10px] text-slate-500 font-bold tracking-widest uppercase">
              Authorized Portal — IIIT Ranchi Academic Systems
            </p>
          </div>

          <!-- B. SELECTED PORTAL SIGN IN PANEL (If selectedRole is NOT null) -->
          <div *ngIf="selectedRole() as role" class="space-y-6 animate-scale-in">

            <!-- Category Title Header and back link -->
            <div class="flex items-center justify-between">
              <button (click)="selectRole(null)" class="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 uppercase tracking-wider">
                ⬅ Back to Portals
              </button>
              <span class="text-[10px] font-black border uppercase tracking-widest px-3 py-1 rounded-full"
                    [ngClass]="{
                      'bg-blue-500/10 text-blue-400 border-blue-500/20': role === 'student',
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': role === 'faculty',
                      'bg-violet-500/10 text-violet-400 border-violet-500/20': role === 'admin'
                    }">
                {{ role }} PORTAL
              </span>
            </div>

            <!-- Welcome text details -->
            <div class="space-y-1">
              <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                {{ role === 'student' ? 'Student Evaluation Login' : role === 'faculty' ? 'Faculty Analytics Login' : 'Administrative Console' }}
              </h2>
              <p class="text-slate-400 text-xs font-semibold">Enter your authorized institutional credentials to continue securely.</p>
            </div>

            <!-- ROLE SPECIFIC SANDBOX PROFILES DRAWER -->
            <div class="p-4 rounded-2xl border border-dashed border-brand-500/25 bg-brand-500/5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                  🔑 Sandbox Credentials Profile
                </span>
                <span class="text-[9px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-bold">🎲 Random</span>
              </div>
              <button (click)="useDemoProfile(role)"
                      class="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800/60 bg-slate-950/60 hover:bg-slate-900/60 hover:border-brand-500/30 transition-all text-left group">
                <div class="min-w-0">
                  <div class="text-xs font-bold text-white uppercase truncate">{{ sandboxLabel() }}</div>
                  <div class="text-[10px] text-slate-500 font-mono mt-0.5">Tap again to shuffle ↺</div>
                </div>
                <span class="text-[10px] font-black text-brand-400 uppercase tracking-widest flex-shrink-0 ml-3 group-hover:text-brand-300 transition-colors">TAP TO AUTOFILL ➔</span>
              </button>
            </div>

            <!-- Login tabs (Password vs OTP) - Only shown if not admin -->
            <div *ngIf="role !== 'admin'" class="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button (click)="setAuthMethod('password')"
                      class="py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest"
                      [ngClass]="authMethod() === 'password' ? 'bg-brand-500 text-white shadow-brand' : 'text-slate-400 hover:text-slate-200'">
                PASSWORD LOGIN
              </button>
              <button (click)="setAuthMethod('otp')"
                      class="py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest"
                      [ngClass]="authMethod() === 'otp' ? 'bg-brand-500 text-white shadow-brand' : 'text-slate-400 hover:text-slate-200'">
                MOBILE PHONE OTP
              </button>
            </div>

            <!-- FORM: Password Sign In -->
            <form *ngIf="authMethod() === 'password'" [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4 animate-fade-in">
              <div class="space-y-1">
                <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Institutional Email</label>
                <div class="input-group">
                  <input formControlName="email" type="email" placeholder="username&#64;iiitranchi.ac.in"
                         class="w-full h-11 px-4 rounded-xl text-xs outline-none" />
                </div>
                <p *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid" class="text-[10px] text-rose-400 font-bold font-mono">
                  Enter a valid institutional email.
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Security Password</label>
                  <a *ngIf="role === 'student'" routerLink="/signup" class="text-[10px] text-brand-400 hover:underline font-bold uppercase">Sign up?</a>
                </div>
                <div class="input-group relative">
                  <input formControlName="password" [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••"
                         class="w-full h-11 px-4 rounded-xl text-xs outline-none" />
                  <button type="button" (click)="togglePassword()"
                          class="absolute right-4 top-3 text-slate-500 hover:text-white transition-colors text-[10px] font-extrabold uppercase">
                    {{ showPassword() ? 'HIDE' : 'SHOW' }}
                  </button>
                </div>
              </div>

              <!-- Error Box -->
              <div *ngIf="error()" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-fade-in flex items-start gap-2">
                <span>⚠️</span> <span>{{ error() }}</span>
              </div>

              <!-- Action Row: Theme Toggle + Sign In Button -->
              <div class="flex items-center gap-3">

                <!-- Day / Night Mode Toggle (left of sign-in) -->
                <button type="button" (click)="toggleTheme()"
                        title="Toggle day / night mode"
                        class="flex-shrink-0 w-12 h-12 rounded-xl border transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                        [ngClass]="isDarkMode() ? 'border-slate-700/60 bg-slate-900/50 hover:border-brand-500/40 hover:bg-slate-800/60' : 'border-amber-400/40 bg-amber-50/10 hover:border-amber-400/60 hover:bg-amber-50/20'">
                  <!-- Moon (dark mode) -->
                  <svg *ngIf="isDarkMode()" class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                  <!-- Sun (light mode) -->
                  <svg *ngIf="!isDarkMode()" class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
                  </svg>
                </button>

                <!-- Sign In Button -->
                <button type="submit" class="btn-primary flex-1 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-glow shadow-brand-500/20" [disabled]="loading() || loginForm.invalid">
                  <svg *ngIf="loading()" class="w-4 h-4 animate-spin inline mr-2 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ loading() ? 'Authenticating...' : 'Secure Sign In' }}
                </button>

              </div>
            </form>

            <!-- FORM: Phone OTP Sign In (If not admin) -->
            <form *ngIf="authMethod() === 'otp' && role !== 'admin'" [formGroup]="otpForm" (ngSubmit)="onSendOtp()" class="space-y-4 animate-fade-in">
              <div class="space-y-1">
                <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Registered Phone Number</label>
                <div class="flex gap-2">
                  <div class="w-16">
                    <input type="text" value="+91" readonly class="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl text-xs text-center font-mono cursor-not-allowed text-slate-500" />
                  </div>
                  <div class="flex-1 input-group">
                    <input formControlName="phone" type="tel" placeholder="10-digit mobile number" class="w-full h-11 px-4 rounded-xl text-xs outline-none font-mono tracking-wide" />
                  </div>
                </div>
                <p *ngIf="otpForm.get('phone')?.touched && otpForm.get('phone')?.invalid" class="text-[10px] text-rose-400 font-bold font-mono">
                  Please enter a valid 10-digit phone number.
                </p>
              </div>

              <!-- OTP Verification fields -->
              <div *ngIf="otpSent()" class="space-y-1.5 animate-slide-up">
                <label class="block text-[10px] font-black uppercase tracking-wider text-brand-300">Enter Verification Code</label>
                <div class="input-group">
                  <input formControlName="otp" type="text" placeholder="------" maxlength="6"
                         class="w-full h-11 px-4 rounded-xl text-center text-base tracking-[0.5em] font-mono font-bold text-brand-300 placeholder:tracking-normal placeholder:text-slate-600 outline-none" />
                </div>
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-semibold text-center mt-2 font-mono">
                  Simulated OTP Sent to phone! Use "123456" as test code.
                </div>
              </div>

              <!-- Messages & Errors -->
              <div *ngIf="error()" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {{ error() }}
              </div>
              <div *ngIf="successMessage()" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center font-mono">
                {{ successMessage() }}
              </div>

              <!-- Submission Button -->
              <button type="button" (click)="otpSent() ? onVerifyOtp() : onSendOtp()"
                      class="btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-glow shadow-brand-500/20" [disabled]="loading() || (otpSent() ? otpForm.get('otp')?.invalid : otpForm.get('phone')?.invalid)">
                <svg *ngIf="loading()" class="w-4 h-4 animate-spin inline mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ otpSent() ? 'Verify & Authenticate' : 'Request OTP Code' }}
              </button>
            </form>

            <!-- Role specific Google oauth redirect - Only for faculty -->
            <div *ngIf="role === 'faculty'" class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex-1 h-px bg-slate-800"></div>
                <span class="text-slate-500 text-[9px] font-black uppercase tracking-widest">Or login with</span>
                <div class="flex-1 h-px bg-slate-800"></div>
              </div>

              <button (click)="loginWithGoogle()" class="w-full py-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-slate-700 transition-all flex items-center justify-center gap-3 text-xs font-bold text-slate-300 hover:text-white hover:scale-[1.01]">
                <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#ea4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.76 14.97.67 12 .67 7.7.67 3.99 3.14 2.18 6.74l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"/>
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31l3.57 2.77c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23.33c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.86 7.7 23.33 12 23.33z"/>
                  <path fill="#fbbc05" d="M5.84 14.42c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.4H2.18C1.43 8.88 1 10.55 1 12.33s.43 3.45 1.18 4.93l3.66-2.84z"/>
                </svg>
                Google Institutional Account
              </button>
            </div>

            <!-- Portal footer label -->
            <div class="text-center text-[10px] text-slate-500 font-bold tracking-wider pt-2">
              Authorized portal for &#64;iiitranchi.ac.in members.
            </div>

          </div>

        </div>
      </div>

      <!-- C. PREMIUM ROLE-AWARE BOOT SCREEN OVERLAY -->
      <div *ngIf="isBootingApp"
           class="fixed inset-0 z-[100] flex flex-col items-center justify-center"
           style="background: #020617;">

        <!-- Ambient blobs — colour-keyed to the logged-in role -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <!-- Student: indigo -->
          <ng-container *ngIf="bootingRole() === 'student'">
            <div class="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-20"
                 style="background: radial-gradient(circle, #6366f1 0%, transparent 70%); filter: blur(100px);"></div>
            <div class="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15"
                 style="background: radial-gradient(circle, #818cf8 0%, transparent 70%); filter: blur(80px);"></div>
          </ng-container>
          <!-- Faculty: emerald -->
          <ng-container *ngIf="bootingRole() === 'faculty'">
            <div class="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-20"
                 style="background: radial-gradient(circle, #10b981 0%, transparent 70%); filter: blur(100px);"></div>
            <div class="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15"
                 style="background: radial-gradient(circle, #34d399 0%, transparent 70%); filter: blur(80px);"></div>
          </ng-container>
          <!-- Admin: violet -->
          <ng-container *ngIf="bootingRole() === 'admin'">
            <div class="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-20"
                 style="background: radial-gradient(circle, #8b5cf6 0%, transparent 70%); filter: blur(100px);"></div>
            <div class="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15"
                 style="background: radial-gradient(circle, #a78bfa 0%, transparent 70%); filter: blur(80px);"></div>
          </ng-container>
        </div>

        <!-- Central content -->
        <div class="relative z-10 flex flex-col items-center gap-6 px-10">

          <!-- Role badge chip -->
          <div class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
               [ngClass]="{
                 'bg-brand-500/15 border-brand-500/30 text-brand-300': bootingRole() === 'student',
                 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300': bootingRole() === 'faculty',
                 'bg-violet-500/15 border-violet-500/30 text-violet-300': bootingRole() === 'admin'
               }">
            {{ bootingRole() === 'student' ? '🎓 Student Portal' : bootingRole() === 'faculty' ? '👨‍🏫 Faculty Portal' : '🛡️ Admin Control Panel' }}
          </div>

          <!-- Logo with role-coloured glow ring -->
          <div class="relative flex items-center justify-center">
            <!-- Outer ping ring -->
            <div class="absolute w-32 h-32 rounded-full border animate-ping"
                 style="animation-duration: 2.8s;"
                 [ngClass]="{
                   'border-brand-500/25': bootingRole() === 'student',
                   'border-emerald-500/25': bootingRole() === 'faculty',
                   'border-violet-500/25': bootingRole() === 'admin'
                 }"></div>
            <!-- Static ring -->
            <div class="absolute w-28 h-28 rounded-full border"
                 [ngClass]="{
                   'border-brand-500/15': bootingRole() === 'student',
                   'border-emerald-500/15': bootingRole() === 'faculty',
                   'border-violet-500/15': bootingRole() === 'admin'
                 }"></div>
            <!-- Logo bubble -->
            <div class="w-22 h-22 w-[88px] h-[88px] rounded-full bg-slate-900/90 border border-slate-700/60 flex items-center justify-center"
                 [ngStyle]="{
                   'box-shadow': bootingRole() === 'student'
                     ? '0 0 40px rgba(99,102,241,0.35), 0 0 80px rgba(99,102,241,0.12)'
                     : bootingRole() === 'faculty'
                     ? '0 0 40px rgba(16,185,129,0.35), 0 0 80px rgba(16,185,129,0.12)'
                     : '0 0 40px rgba(139,92,246,0.35), 0 0 80px rgba(139,92,246,0.12)'
                 }">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img src="/logo.png" class="w-12 h-12 object-contain" alt="IIIT Ranchi" />
              </div>
            </div>
          </div>

          <!-- Institution title -->
          <div class="text-center">
            <p class="text-white font-black text-xl tracking-tight">IIIT Ranchi</p>
            <p class="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-0.5">Faculty Feedback System</p>
          </div>

          <!-- Role-aware progress bar -->
          <div class="w-80 space-y-3">
            <div class="w-full h-[3px] bg-slate-800/80 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-200 ease-out"
                   [style.width.%]="bootProgress()"
                   [ngClass]="{
                     'bg-gradient-to-r from-brand-600 via-brand-400 to-violet-400': bootingRole() === 'student',
                     'bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400': bootingRole() === 'faculty',
                     'bg-gradient-to-r from-violet-600 via-brand-500 to-cyan-500': bootingRole() === 'admin'
                   }"></div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">Initializing</span>
              <span class="text-[10px] font-mono font-black tabular-nums"
                    [ngClass]="{
                      'text-brand-400': bootingRole() === 'student',
                      'text-emerald-400': bootingRole() === 'faculty',
                      'text-violet-400': bootingRole() === 'admin'
                    }">{{ bootProgress() }}%</span>
            </div>
          </div>

          <!-- Terminal-style animated status messages -->
          <div class="font-mono text-[11px] text-center px-4 min-h-[18px]">

            <!-- Phase 1: 0-30% (same for all) -->
            <span *ngIf="bootProgress() < 30" class="text-slate-500 animate-pulse">
              &rsaquo; Establishing encrypted channel to cloud...
            </span>

            <!-- Phase 2: 30-65% (role-specific) -->
            <span *ngIf="bootProgress() >= 30 && bootProgress() < 65 && bootingRole() === 'student'" class="text-brand-400 animate-pulse">
              &rsaquo; Fetching course registry &amp; semester assignments...
            </span>
            <span *ngIf="bootProgress() >= 30 && bootProgress() < 65 && bootingRole() === 'faculty'" class="text-emerald-400 animate-pulse">
              &rsaquo; Loading feedback analytics &amp; AI sentiment engine...
            </span>
            <span *ngIf="bootProgress() >= 30 && bootProgress() < 65 && bootingRole() === 'admin'" class="text-violet-400 animate-pulse">
              &rsaquo; Opening control terminal &amp; validating session locks...
            </span>

            <!-- Phase 3: 65-92% -->
            <span *ngIf="bootProgress() >= 65 && bootProgress() < 92" class="text-slate-400 animate-pulse">
              &rsaquo; Verifying role permissions &amp; security scope...
            </span>

            <!-- Phase 4: 92-100% -->
            <span *ngIf="bootProgress() >= 92" class="text-slate-200 animate-pulse">
              &rsaquo; ✓ Access granted. Launching dashboard...
            </span>

          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #020617;
      overflow: hidden;
    }
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(to right, #1e293b 1.5px, transparent 1.5px),
                        linear-gradient(to bottom, #1e293b 1.5px, transparent 1.5px);
      background-size: 5rem 5rem;
      mask-image: radial-gradient(circle at center, black 10%, transparent 85%);
      pointer-events: none;
      opacity: 0.18;
    }
    .aurora-blob {
      position: absolute;
      width: 50vw;
      height: 50vw;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 70%);
      filter: blur(80px);
      border-radius: 50%;
      animation: blob-float 18s infinite alternate ease-in-out;
      pointer-events: none;
    }
    .aurora-blob-2 {
      position: absolute;
      width: 45vw;
      height: 45vw;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, rgba(99, 102, 241, 0.04) 55%, transparent 70%);
      filter: blur(80px);
      border-radius: 50%;
      animation: blob-float 22s infinite alternate-reverse ease-in-out;
      pointer-events: none;
    }
    .glass-panel {
      background: rgba(15, 23, 42, 0.35);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.07);
    }
    .input-group {
      position: relative;
      input {
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #f1f5f9;
        transition: all 0.3s ease;
        &:focus {
          background: rgba(15, 23, 42, 0.75);
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }
      }
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateX(-50%);
      }
      &:focus-within::after {
        width: 100%;
      }
    }
    @keyframes blob-float {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(8%, -8%) scale(1.08); }
      100% { transform: translate(-4%, 4%) scale(0.92); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin-fast {
      animation: spin 6s linear infinite;
    }
    .spin-reverse {
      animation: spin 16s linear infinite reverse;
    }

    /* --- 3D Atomic Orbit Styles --- */
    .orbit-container {
      perspective: 1200px;
      transform-style: preserve-3d;
      z-index: 0;
      /* 3D Tumble animation for the entire atom */
      animation: atom-tumble 24s infinite linear;
    }
    @keyframes atom-tumble {
      0% { transform: rotateX(10deg) rotateY(0deg); }
      50% { transform: rotateX(-10deg) rotateY(180deg); }
      100% { transform: rotateX(10deg) rotateY(360deg); }
    }

    .orbit {
      position: absolute;
      inset: -10px; /* Make orbits slightly larger than container */
      border-radius: 50%;
      transform-style: preserve-3d;
    }
    /* Red Orbit */
    .orbit-1 {
      border: 2px solid rgba(239, 68, 68, 0.2);
      border-left: 2px solid rgba(239, 68, 68, 0.9);
      border-right: 2px solid rgba(239, 68, 68, 0.5);
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.3);
      animation: spin-orbit-1 8s linear infinite;
    }
    /* Green Orbit */
    .orbit-2 {
      border: 2px solid rgba(34, 197, 94, 0.2);
      border-top: 2px solid rgba(34, 197, 94, 0.9);
      border-bottom: 2px solid rgba(34, 197, 94, 0.5);
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.3);
      animation: spin-orbit-2 10s linear infinite;
    }
    /* Blue Orbit */
    .orbit-3 {
      border: 2px solid rgba(59, 130, 246, 0.2);
      border-right: 2px solid rgba(59, 130, 246, 0.9);
      border-left: 2px solid rgba(59, 130, 246, 0.5);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.3);
      animation: spin-orbit-3 12s linear infinite;
    }

    @keyframes spin-orbit-1 {
      0% { transform: rotateX(75deg) rotateY(-45deg) rotateZ(0deg); }
      100% { transform: rotateX(75deg) rotateY(-45deg) rotateZ(360deg); }
    }
    @keyframes spin-orbit-2 {
      0% { transform: rotateX(75deg) rotateY(15deg) rotateZ(0deg); }
      100% { transform: rotateX(75deg) rotateY(15deg) rotateZ(360deg); }
    }
    @keyframes spin-orbit-3 {
      0% { transform: rotateX(75deg) rotateY(75deg) rotateZ(0deg); }
      100% { transform: rotateX(75deg) rotateY(75deg) rotateZ(360deg); }
    }

    .orbit-dot {
      position: absolute;
      width: 4px;
      height: 4px;
      background-color: #60a5fa;
      border-radius: 50%;
      box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.8);
      transform: translate(-50%, -50%);
    }
    .orbit-text {
      position: absolute;
      top: -14px;
      left: 50%;
      color: #93c5fd;
      font-family: monospace;
      font-size: 11px;
      font-weight: 900;
      text-shadow: 0 0 5px rgba(59, 130, 246, 0.8);
      /* Keep text upright towards camera by counter-rotating */
      transform: translateX(-50%) rotateZ(-360deg) rotateY(-55deg) rotateX(-70deg);
      animation: counter-spin-3 10s linear infinite reverse;
    }
    @keyframes counter-spin-3 {
      0% { transform: translateX(-50%) rotateZ(0deg) rotateY(-55deg) rotateX(-70deg); }
      100% { transform: translateX(-50%) rotateZ(360deg) rotateY(-55deg) rotateX(-70deg); }
    }
    /* --------------------------------- */
    @keyframes scale-in {
      0% { transform: scale(0.96); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-scale-in {
      animation: scale-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fade-in {
      0% { opacity: 0; transform: translateY(4px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.25s ease-out forwards;
    }
  `]
})
export class LoginComponent implements OnInit, AfterViewInit {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private spinner= inject(SpinnerService);

  @ViewChild('meshCanvas') meshCanvas!: ElementRef<HTMLCanvasElement>;

  // Portal dynamic routing state
  selectedRole = signal<'student' | 'faculty' | 'admin' | null>(null);

  // Authentications states
  authMethod     = signal<'password' | 'otp'>('password');
  showPassword   = signal(false);
  loading        = signal(false);
  error          = signal('');
  successMessage = signal('');
  otpSent        = signal(false);

  // Forms references
  loginForm!: FormGroup;
  otpForm!: FormGroup;

  // Sessional Progressive booting screen states
  isBootingApp   = false;
  bootProgress   = signal(0);
  bootingRole    = signal<string>('student'); // Actual authenticated role (not UI selection)

  // Sandbox profile random label (updates on each autofill tap)
  sandboxLabel   = signal<string>('Tap to auto-fill a random account');

  // Theme toggle (dark/light mode)
  isDarkMode     = signal<boolean>(true);

  // Left Panel features slides carousel
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
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });

    this.otpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp:   ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });



    this.startCarouselRotation();
  }

  ngAfterViewInit() {
    this.initMeshShader();
  }

  // ==========================================
  // CANVAS MESH SHADER LOGIC
  // ==========================================
  initMeshShader() {
    if (!this.meshCanvas) return;
    const canvas = this.meshCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.002;

      // Draw two large animated glowing blobs
      const drawBlob = (xOffset: number, yOffset: number, rBase: number, color: string, speed: number) => {
        const x = canvas.width/2 + Math.sin(time * speed + xOffset) * canvas.width * 0.4;
        const y = canvas.height/2 + Math.cos(time * speed * 1.3 + yOffset) * canvas.height * 0.4;
        const radius = rBase + Math.sin(time * speed * 2) * rBase * 0.1;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };

      // Use theme colors but dynamically calculated
      const isCyber = document.documentElement.classList.contains('theme-cyber');
      
      // Indigo blob
      drawBlob(0, 0, Math.max(canvas.width, canvas.height) * 0.7, 
               isCyber ? 'rgba(99, 102, 241, 0.4)' : 'rgba(37, 99, 235, 0.3)', 1.2);
      
      // Emerald / Purple blob
      drawBlob(2, 1, Math.max(canvas.width, canvas.height) * 0.6, 
               isCyber ? 'rgba(16, 185, 129, 0.3)' : 'rgba(168, 85, 247, 0.3)', 0.8);

      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  startCarouselRotation() {
    setInterval(() => {
      this.activeSlideIndex.update(idx => (idx + 1) % this.slides.length);
    }, 6000);

    // Watch query parameter parameters to keep selected portals bookmarkable!
    this.route.queryParams.subscribe(params => {
      const r = params['role'];
      if (['student', 'faculty', 'admin'].includes(r)) {
        this.selectedRole.set(r as any);
      } else {
        this.selectedRole.set(null);
      }

      // Handle OAuth authentication redirect success parameters
      if (params['token'] && params['user']) {
        try {
          const userObj = JSON.parse(decodeURIComponent(params['user']));
          this.auth.handleAuthSuccess({ token: params['token'], data: { user: userObj } });
          this.showBootingScreen(userObj.role.toLowerCase());
        } catch (e) {
          this.error.set('Failed to parse simulated identity callback.');
        }
      } else if (params['error']) {
        this.error.set(params['error']);
      }
    });
  }

  selectRole(role: 'student' | 'faculty' | 'admin' | null) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { role: role || null },
      queryParamsHandling: 'merge'
    });
    this.authMethod.set('password');
    this.error.set('');
    this.successMessage.set('');
    this.otpSent.set(false);
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
    // Full sandbox roster — all seeded accounts
    const SANDBOX: Record<string, { email: string; pass: string; name: string }[]> = {
      student: [
        { name: 'Aarav Sharma',   email: 'aarav.sharma@iiitranchi.ac.in',   pass: 'IIITR@2026' },
        { name: 'Ananya Verma',   email: 'ananya.verma@iiitranchi.ac.in',   pass: 'IIITR@2026' },
        { name: 'Kabir Gupta',    email: 'kabir.gupta@iiitranchi.ac.in',    pass: 'IIITR@2026' },
        { name: 'Ishaan Roy',     email: 'ishaan.roy@iiitranchi.ac.in',     pass: 'IIITR@2026' },
        { name: 'Sanya Iyer',     email: 'sanya.iyer@iiitranchi.ac.in',     pass: 'IIITR@2026' },
        { name: 'Diya Sen',       email: 'diya.sen@iiitranchi.ac.in',       pass: 'IIITR@2026' },
        { name: 'Rohan Mehta',    email: 'rohan.mehta@iiitranchi.ac.in',    pass: 'IIITR@2026' },
        { name: 'Aditi Rao',      email: 'aditi.rao@iiitranchi.ac.in',      pass: 'IIITR@2026' },
        { name: 'Aryan Joshi',    email: 'aryan.joshi@iiitranchi.ac.in',    pass: 'IIITR@2026' },
        { name: 'Meera Nair',     email: 'meera.nair@iiitranchi.ac.in',     pass: 'IIITR@2026' },
        { name: 'Pranav Saxena',  email: 'pranav.saxena@iiitranchi.ac.in',  pass: 'IIITR@2026' },
        { name: 'Kirti Mishra',   email: 'kirti.mishra@iiitranchi.ac.in',   pass: 'IIITR@2026' },
        { name: 'Devansh Patil',  email: 'devansh.patil@iiitranchi.ac.in',  pass: 'IIITR@2026' },
        { name: 'Nisha Reddy',    email: 'nisha.reddy@iiitranchi.ac.in',    pass: 'IIITR@2026' },
        { name: 'Yash Kapoor',    email: 'yash.kapoor@iiitranchi.ac.in',    pass: 'IIITR@2026' },
        // Legacy seed account
        { name: 'Karn Ashutosh',  email: 'student@iiitranchi.ac.in',        pass: 'student123' }
      ],
      faculty: [
        { name: 'Dr. R. K. Singh',   email: 'rk.singh@iiitranchi.ac.in',     pass: 'faculty123' },
        { name: 'Prof. Sneha Das',   email: 'sneha.das@iiitranchi.ac.in',    pass: 'faculty123' },
        { name: 'Dr. Vikram Seth',   email: 'vikram.seth@iiitranchi.ac.in',  pass: 'faculty123' },
        { name: 'Dr. Manoj Dubey',   email: 'manoj.dubey@iiitranchi.ac.in',  pass: 'faculty123' },
        { name: 'Prof. Priya Nair',  email: 'priya.nair@iiitranchi.ac.in',   pass: 'faculty123' },
        // Legacy seed account
        { name: 'Dr. Amit Kumar',    email: 'faculty@iiitranchi.ac.in',      pass: 'faculty123' }
      ],
      admin: [
        { name: 'System Admin',  email: 'admin@iiitranchi.ac.in',  pass: 'admin123' }
      ]
    };

    const pool = SANDBOX[role];
    // Pick a random profile from the pool on every tap
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.loginForm.patchValue({ email: pick.email, password: pick.pass });
    // Also update the sandbox label display
    this.sandboxLabel.set(pick.name);
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.triggerHapticFeedback();
    this.loading.set(true);
    this.error.set('');
    this.spinner.show();

    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.spinner.hide();
        this.showBootingScreen(res?.data?.user?.role?.toLowerCase() || 'student');
      },
      error: (err) => {
        this.loading.set(false);
        this.spinner.hide();
        this.error.set(err?.error?.message || 'Login failed. Please verify credentials.');
      }
    });
  }

  // Play full-screen progressive sessional boot transitions
  showBootingScreen(role: string) {
    this.bootingRole.set(role); // Stamp the REAL authenticated role for boot screen
    this.isBootingApp = true;
    this.bootProgress.set(0);

    const interval = setInterval(() => {
      if (this.bootProgress() < 100) {
        this.bootProgress.update(p => Math.min(100, p + Math.floor(Math.random() * 12 + 8)));
      } else {
        clearInterval(interval);
        setTimeout(() => {
          this.isBootingApp = false;
          this.auth.redirectByRole();
        }, 900);
      }
    }, 160);
  }

  toggleTheme() {
    const isDark = this.isDarkMode();
    this.isDarkMode.set(!isDark);
    // Toggle the theme class on the document root
    if (isDark) {
      document.documentElement.classList.add('theme-academic');
    } else {
      document.documentElement.classList.remove('theme-academic');
    }
  }

  onSendOtp() {
    if (this.otpForm.get('phone')?.invalid) return;

    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    setTimeout(() => {
      this.loading.set(false);
      this.otpSent.set(true);
      this.successMessage.set('Simulated SMS dispatch complete.');
    }, 1100);
  }

  onVerifyOtp() {
    this.loading.set(true);
    this.error.set('');

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

      this.showBootingScreen('student');
    }, 1200);
  }

  loginWithGoogle() {
    this.auth.loginWithGoogle();
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
