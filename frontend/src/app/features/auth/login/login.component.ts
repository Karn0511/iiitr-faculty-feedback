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
    <div class="min-h-screen w-full flex items-center justify-center relative p-4 sm:p-6 overflow-hidden bg-[#020617] text-slate-200">

      <!-- 1. Immersive aurora background grid and floating blobs -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div class="bg-grid"></div>
        <div class="aurora-blob top-0 left-0"></div>
        <div class="aurora-blob-2 bottom-0 right-0"></div>
      </div>

      <!-- Main Dual Pane Glass Panel Container -->
      <div class="w-full max-w-[1200px] min-h-[700px] lg:h-[750px] grid lg:grid-cols-12 glass-panel rounded-3xl overflow-hidden relative z-10 animate-fade-in shadow-2xl shadow-black/60">

        <!-- LEFT SIDE: Spinning Tech Rings & Animated Brand Carousel -->
        <div class="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 relative overflow-hidden bg-slate-950/40 border-r border-slate-800/40 z-10">
          <div class="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-brand-600/10 blur-[60px] pointer-events-none"></div>

          <!-- Institutional Header branding -->
          <div class="relative z-10 flex items-center gap-3.5">
            <div class="w-11 h-11 flex items-center justify-center bg-slate-900/60 border border-slate-800 rounded-xl p-1.5 shadow-md">
              <svg class="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div>
              <h2 class="text-white font-black text-sm tracking-tight leading-none uppercase">IIIT Ranchi</h2>
              <span class="text-brand-400 text-[9px] font-black tracking-widest uppercase block mt-1">Feedback Portal</span>
            </div>
          </div>

          <!-- Tech spinning concentric rings visualizer -->
          <div class="relative z-10 flex-1 flex flex-col justify-center items-center text-center py-6">
            <div class="relative w-52 h-52 mb-8 flex items-center justify-center">
              <div class="absolute inset-0 border border-brand-500/25 rounded-full spin-reverse" style="animation-duration: 20s;"></div>
              <div class="absolute inset-4 border border-violet-500/15 rounded-full spin-fast" style="animation-duration: 12s;"></div>
              <div class="absolute inset-8 border border-dashed border-cyan-500/20 rounded-full spin-reverse" style="animation-duration: 8s;"></div>
              
              <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl p-4">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/ee/Indian_Institute_of_Information_Technology%2C_Ranchi_Logo.png" class="w-14 h-14 object-contain animate-pulse" alt="IIIT Ranchi Emblem" />
              </div>
            </div>

            <!-- Carousel Slider texts -->
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
        <div class="lg:col-span-7 flex flex-col justify-center p-6 sm:p-12 md:p-16 bg-slate-900/10 backdrop-blur-sm z-10 relative">

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
                  🔑 Sandbox Credentials profile
                </span>
                <span class="text-[9px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-bold">Auto-Seed</span>
              </div>
              <button (click)="useDemoProfile(role)"
                      class="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800/60 bg-slate-950/60 hover:bg-slate-900/60 hover:border-brand-500/30 transition-all text-left">
                <div>
                  <div class="text-xs font-bold text-white uppercase">{{ role }} sandbox account</div>
                  <div class="text-[10px] text-slate-400 font-mono mt-0.5">{{ role }}&#64;iiitranchi.ac.in</div>
                </div>
                <span class="text-[10px] font-black text-brand-400 uppercase tracking-widest">TAP TO AUTOFill ➔</span>
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

              <!-- Action Button -->
              <button type="submit" class="btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-glow shadow-brand-500/20" [disabled]="loading() || loginForm.invalid">
                <svg *ngIf="loading()" class="w-4 h-4 animate-spin inline mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ loading() ? 'Authenticating...' : 'Secure Sign In' }}
              </button>
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

            <!-- Role specific Google oauth redirect - Only for students -->
            <div *ngIf="role === 'student'" class="space-y-4">
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

      <!-- C. FUTURISTIC TECH BOOT SCREEN OVERLAY -->
      <div *ngIf="isBootingApp"
           class="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-all duration-500">
        
        <!-- Spinning Tech Boot circles -->
        <div class="relative w-32 h-32 mb-8 flex items-center justify-center">
          <div class="absolute inset-0 border-t-2 border-brand-500 rounded-full animate-spin"></div>
          <div class="absolute inset-2 border-r-2 border-emerald-500 rounded-full animate-spin" style="animation-duration: 1.5s"></div>
          <div class="absolute inset-4 border-b-2 border-cyan-400 rounded-full animate-spin" style="animation-duration: 2s"></div>
          
          <div class="absolute font-mono text-[9px] text-emerald-400 font-black animate-pulse uppercase tracking-widest text-center leading-relaxed">
            INITIALIZING<br>SESSION
          </div>
        </div>

        <!-- Progress visual bar -->
        <div class="w-64 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div class="h-full bg-gradient-to-r from-brand-500 via-emerald-500 to-cyan-400 transition-all duration-150 ease-out"
               [style.width.%]="bootProgress()"></div>
        </div>

        <!-- Academic custom progression text strings -->
        <div class="mt-5 font-mono text-xs text-slate-400 text-center font-bold tracking-wide">
          <span *ngIf="bootProgress() < 30" class="animate-pulse">Establishing secure link with IIIT Ranchi cloud shard...</span>
          
          <span *ngIf="bootProgress() >= 30 && bootProgress() < 70 && selectedRole() === 'student'" class="animate-pulse">
            Encrypting sessional credentials & loading courses registry...
          </span>
          <span *ngIf="bootProgress() >= 30 && bootProgress() < 70 && selectedRole() === 'faculty'" class="animate-pulse">
            Syncing analytics engine & retrieving aggregates...
          </span>
          <span *ngIf="bootProgress() >= 30 && bootProgress() < 70 && selectedRole() === 'admin'" class="animate-pulse">
            Opening control terminal & validating active sessions locks...
          </span>
          
          <span *ngIf="bootProgress() >= 70" class="animate-pulse">Authenticating role authorization profile dashboard...</span>
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
export class LoginComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private spinner= inject(SpinnerService);

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
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.otpForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      otp: ['', [Validators.pattern(/^[0-9]{6}$/)]]
    });

    // Auto rotative active features slides
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
    const map = {
      student: { email: 'student@iiitranchi.ac.in', pass: 'student123' },
      faculty: { email: 'faculty@iiitranchi.ac.in', pass: 'faculty123' },
      admin:   { email: 'admin@iiitranchi.ac.in',   pass: 'admin123' }
    };
    const prof = map[role];
    this.loginForm.patchValue({ email: prof.email, password: prof.pass });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

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
    this.isBootingApp = true;
    this.bootProgress.set(0);

    const interval = setInterval(() => {
      if (this.bootProgress() < 100) {
        this.bootProgress.update(p => Math.min(100, p + Math.floor(Math.random() * 15 + 10)));
      } else {
        clearInterval(interval);
        setTimeout(() => {
          this.isBootingApp = false;
          this.auth.redirectByRole();
        }, 800);
      }
    }, 180);
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
}
