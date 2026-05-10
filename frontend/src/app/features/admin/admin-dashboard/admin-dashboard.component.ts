import { Component, OnInit, inject, signal, computed, AfterViewInit, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService, AdminStats, FacultyLeaderboardItem, QuestionItem, FeedbackSessionItem } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Global Mesh Background -->
    <canvas #meshCanvas class="fixed inset-0 w-full h-full opacity-[0.1] mix-blend-screen pointer-events-none z-[-1]"></canvas>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10">

      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 mb-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-violet-500/10 blur-[80px]"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px]"></div>

        <div class="relative z-10">
          <span class="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">Dashboard</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Academic Surveys &amp; Feedback Administration</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Welcome, <span class="text-white font-semibold">{{ auth.currentUser()?.name }}</span>.
            Manage surveys, questions, feedback sessions, and monitor faculty performance.
          </p>
        </div>

        <!-- Global stats cards -->
        <div class="relative z-10 flex flex-wrap gap-4">
          <div class="bg-slate-900/60 border border-surface-border p-4 rounded-2xl flex items-center gap-3 w-40 sm:w-44">
            <span class="text-2xl">🎓</span>
            <div>
              <div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Students</div>
              <div class="text-base font-black text-white font-mono">{{ stats()?.totalStudents || 0 }}</div>
            </div>
          </div>
          <div class="bg-slate-900/60 border border-surface-border p-4 rounded-2xl flex items-center gap-3 w-40 sm:w-44">
            <span class="text-2xl">📋</span>
            <div>
              <div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Feedback</div>
              <div class="text-base font-black text-white font-mono">{{ stats()?.totalFeedback || 0 }}</div>
            </div>
          </div>
          <div class="bg-slate-900/60 border border-surface-border p-4 rounded-2xl flex items-center gap-3 w-40 sm:w-44">
            <span class="text-2xl">🏛️</span>
            <div>
              <div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Institute Avg</div>
              <div class="text-base font-black text-brand-400 font-mono">
                {{ stats()?.averageInstituteScore || 0 | number:'1.1-1' }}<span class="text-slate-500 text-xs">/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Analytics Link -->
      <div class="mb-6">
        <button (click)="router.navigate(['/admin/analytics'])"
                class="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-glow transition-all duration-300 flex items-center gap-2">
          📊 View Detailed Analytics
        </button>
      </div>

      <!-- FEEDBACK PERFORMANCE HUB -->
      <div class="mb-8 animate-fade-in">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-surface-border">
          <div class="flex items-center gap-2.5">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
            </span>
            <div>
              <h2 class="text-sm font-black uppercase tracking-widest text-slate-200">Feedback Performance Overview</h2>
              <p class="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">Key metrics and performance tracking</p>
            </div>
          </div>

          <!-- Glassmorphic Tab Toggle buttons -->
          <div class="flex p-1 bg-slate-950/60 border border-surface-border rounded-xl">
            <button (click)="deanInsightTab.set('downs')"
                    class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200"
                    [ngClass]="deanInsightTab() === 'downs' ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black' : 'text-slate-400 hover:text-white'">
              📉 Low Ratings
            </button>
            <button (click)="deanInsightTab.set('ups')"
                    class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200"
                    [ngClass]="deanInsightTab() === 'ups' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black' : 'text-slate-400 hover:text-white'">
              🏆 Top Performers
            </button>
            <button (click)="deanInsightTab.set('math')"
                    class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200"
                    [ngClass]="deanInsightTab() === 'math' ? 'bg-brand-500/15 border border-brand-500/30 text-brand-400 font-black' : 'text-slate-400 hover:text-white'">
              📊 Statistics
            </button>
          </div>
        </div>

        <!-- TAB CONTENT 1: Warning Drops ("downs") -->
        <div *ngIf="deanInsightTab() === 'downs'" class="space-y-4 animate-fade-in">
          <div *ngIf="alerts().length === 0" class="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
            No significant rating drops detected.
          </div>

          <div *ngIf="alerts().length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let alert of alerts()"
                 class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/10 via-slate-950/40 to-slate-950/60 border border-rose-500/30 p-5 shadow-glow shadow-rose-500/5 hover:border-rose-500/55 transition-all duration-300 animate-pulse-slow">
              <!-- Pulsing red background blob -->
              <div class="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-rose-500/10 blur-2xl"></div>

              <div class="relative z-10 flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <span class="text-[9px] font-extrabold tracking-widest uppercase bg-rose-500/15 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">Rating Drop Alert</span>
                  <h3 class="text-sm font-extrabold text-white mt-2 leading-snug">{{ alert.courseId?.courseName }}</h3>
                  <p class="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">{{ alert.courseId?.courseCode }}</p>
                </div>

                <!-- Huge drop percentage badge -->
                <div class="text-right">
                  <div class="text-2xl font-black text-rose-400 font-mono tracking-tighter animate-pulse">-{{ alert.dropPercentage }}%</div>
                  <div class="text-[8px] font-extrabold text-rose-500 uppercase tracking-wider">Drop</div>
                </div>
              </div>

              <!-- Score comparison -->
              <div class="relative z-10 mt-3 pt-3 border-t border-rose-500/15 flex items-center justify-between text-xs">
                <div class="text-slate-400">
                  Previous: <span class="text-white font-extrabold font-mono">{{ alert.previousScore | number:'1.1-1' }}</span>
                </div>
                <div class="text-slate-400">
                  Current: <span class="text-rose-400 font-extrabold font-mono">{{ alert.currentScore | number:'1.1-1' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT 2: Achievements / Ups -->
        <div *ngIf="deanInsightTab() === 'ups'" class="space-y-4 animate-fade-in">
          <div *ngIf="leaderboard().length === 0" class="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
            Waiting for feedback submissions to show top performers.
          </div>

          <div *ngIf="leaderboard().length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Dynamic achievements calculated directly from high scoring leaders -->
            <ng-container *ngFor="let item of leaderboard().slice(0, 3); let idx = index">
              <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-950/40 to-slate-950/60 border border-emerald-500/30 p-5 shadow-glow shadow-emerald-500/5 hover:border-emerald-500/55 transition-all duration-300">
                <div class="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl"></div>

                <div class="relative z-10 flex items-start justify-between gap-4">
                  <div class="space-y-1">
                    <span class="text-[9px] font-extrabold tracking-widest uppercase bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Top Rating</span>
                    <h3 class="text-sm font-extrabold text-white mt-2 leading-snug">{{ item.name }}</h3>
                    <p class="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">{{ item.email }}</p>
                  </div>

                  <!-- Rank Badge -->
                  <div class="text-right">
                    <div class="text-2xl font-black text-emerald-400 font-mono tracking-tighter">#{{ idx + 1 }}</div>
                    <div class="text-[8px] font-extrabold text-emerald-500 uppercase tracking-wider">Rank</div>
                  </div>
                </div>

                <!-- Calculation details -->
                <div class="mt-4 p-2 bg-emerald-950/20 border border-emerald-950/40 rounded-lg text-[9px] font-mono text-emerald-300/80">
                  Responses: {{ item.totalSubmissions }} × Score: {{ item.averageScore }} = {{ (item.totalSubmissions * item.averageScore) | number:'1.1-1' }}
                </div>

                <!-- Score details -->
                <div class="relative z-10 mt-3 pt-3 border-t border-emerald-500/15 flex items-center justify-between text-xs">
                  <div class="text-slate-400">
                    Total Reviews: <span class="text-white font-extrabold font-mono">{{ item.totalSubmissions }}</span>
                  </div>
                  <div class="text-slate-400">
                    Score: <span class="text-emerald-400 font-extrabold font-mono">{{ item.averageScore | number:'1.2-2' }}/10</span>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- TAB CONTENT 3: Live Calculations & Formulas ("math") -->
        <div *ngIf="deanInsightTab() === 'math'" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          <!-- Card 1: Sample Standard Deviation Formula -->
          <div class="bg-slate-900/60 border border-surface-border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
            <div class="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-brand-500/5 blur-2xl"></div>
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-[9px] font-extrabold tracking-widest uppercase bg-brand-500/15 border border-brand-500/20 text-brand-300 px-2.5 py-0.5 rounded-full">SAMPLE STANDARD DEVIATION</span>
                <span class="text-sm">📐</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed mb-4">
                Measures the amount of variation or dispersion of course sentiment averages across the institute.
              </p>

              <!-- Equation Block -->
              <div class="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-center font-mono text-white text-xs mb-4">
                &sigma; = &radic; [ &Sigma;(x<sub>i</sub> - &mu;)<sup>2</sup> / N ]
              </div>

              <!-- Computed Real Calculations -->
              <div class="space-y-1.5 text-xs font-mono text-slate-300">
                <div class="flex justify-between">
                  <span>Institute Mean (&mu;):</span>
                  <span class="text-white font-bold">{{ statsMath().mean }} / 10</span>
                </div>
                <div class="flex justify-between">
                  <span>Total Faculty (N):</span>
                  <span class="text-white font-bold">{{ leaderboard().length }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Computed Variance (&sigma;<sup>2</sup>):</span>
                  <span class="text-white font-bold">{{ statsMath().variance }}</span>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-800/60 mt-4 flex justify-between items-center text-[10px] font-mono">
              <span class="text-slate-500">Live Result:</span>
              <span class="text-brand-400 font-bold">&sigma; = &plusmn;{{ statsMath().stdDev }}</span>
            </div>
          </div>

          <!-- Card 2: Z-Score & 95% Confidence Interval Formula -->
          <div class="bg-slate-900/60 border border-surface-border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
            <div class="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-brand-500/5 blur-2xl"></div>
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-[9px] font-extrabold tracking-widest uppercase bg-brand-500/15 border border-brand-500/20 text-brand-300 px-2.5 py-0.5 rounded-full">CONFIDENCE INTERVAL (95%)</span>
                <span class="text-sm">📊</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed mb-4">
                Computes the range in which the true mean parameter of feedback lies with a 95% probability weight.
              </p>

              <!-- Equation Block -->
              <div class="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-center font-mono text-white text-xs mb-4">
                C.I. = &mu; &plusmn; 1.96 &times; ( &sigma; / &radic;N )
              </div>

              <!-- Computed Real Calculations -->
              <div class="space-y-1.5 text-xs font-mono text-slate-300">
                <div class="flex justify-between">
                  <span>Standard Error (SE):</span>
                  <span class="text-white font-bold">{{ statsMath().standardError | number:'1.3-3' }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Upper Margin Limit:</span>
                  <span class="text-emerald-400 font-bold">{{ statsMath().confidenceIntervalUpper }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Lower Margin Limit:</span>
                  <span class="text-rose-400 font-bold">{{ statsMath().confidenceIntervalLower }}</span>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-800/60 mt-4 flex justify-between items-center text-[10px] font-mono">
              <span class="text-slate-500">Interval limits:</span>
              <span class="text-emerald-400 font-bold">[{{ statsMath().confidenceIntervalLower }} , {{ statsMath().confidenceIntervalUpper }}]</span>
            </div>
          </div>

          <!-- Card 3: Feedback Density Volume Weighting -->
          <div class="bg-slate-900/60 border border-surface-border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
            <div class="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-brand-500/5 blur-2xl"></div>
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-[9px] font-extrabold tracking-widest uppercase bg-brand-500/15 border border-brand-500/20 text-brand-300 px-2.5 py-0.5 rounded-full">STATISTICAL CONSISTENCY INDEX</span>
                <span class="text-sm">🔬</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed mb-4">
                Computes standard error scaling over response densities to evaluate overall survey consistency.
              </p>

              <!-- Equation Block -->
              <div class="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-center font-mono text-white text-xs mb-4">
                W<sub>i</sub> = &Sigma;(S<sub>i</sub> &times; R<sub>i</sub>) / Total R
              </div>

              <!-- Computed Real Calculations -->
              <div class="space-y-1.5 text-xs font-mono text-slate-300">
                <div class="flex justify-between">
                  <span>Summed Scalar Weight:</span>
                  <span class="text-white font-bold">{{ statsMath().totalFeedbackWeight }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Active Responses (Total R):</span>
                  <span class="text-white font-bold">{{ statsMath().totalSubmissions }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Average Drop Factor:</span>
                  <span class="text-rose-400 font-bold">{{ statsMath().averageDrop }}%</span>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-800/60 mt-4 flex justify-between items-center text-[10px] font-mono">
              <span class="text-slate-500">Live index score:</span>
              <span class="text-brand-400 font-bold">W<sub>i</sub> = {{ statsMath().weightedIndex | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Admin Sections -->
      <div class="grid lg:grid-cols-12 gap-8">

        <!-- LEFT COLUMN: Leaderboard & Feedback Sessions (Lg: 7cols) -->
        <div class="lg:col-span-7 space-y-8">

          <!-- SECTION 1: Questionnaire soft-toggle CRUD -->
          <div class="glass-card p-6 sm:p-8 space-y-6">
            <div class="pb-3 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 class="text-white font-extrabold text-base">Questionnaire Structure</h2>
                <p class="text-slate-400 text-xs mt-0.5">Toggling preserves historical evaluations instead of deleting.</p>
              </div>
              <span class="text-xs font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded font-bold">SOFT-TOGGLE</span>
            </div>

            <!-- Add Question Form -->
            <form (ngSubmit)="onAddQuestion()" class="flex gap-3">
              <input type="text" [(ngModel)]="newQuestionText" name="newQuestion" placeholder="Enter new survey question text..."
                     class="input-field py-3 text-xs flex-1" required />
              <button type="submit" class="btn-primary py-3 px-5 text-xs font-bold uppercase tracking-wider whitespace-nowrap" [disabled]="!newQuestionText.trim()">
                Add Question
              </button>
            </form>

            <!-- Questions list -->
            <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <div *ngFor="let q of questions(); let i = index"
                   class="p-4 rounded-2xl border bg-slate-950/40 flex items-center justify-between gap-4"
                   [ngClass]="q.isActive ? 'border-surface-border' : 'border-dashed border-slate-800 opacity-60'">
                <div class="flex-1">
                  <span class="text-[10px] font-mono text-slate-500 block uppercase font-bold">QUESTION #{{ i + 1 }}</span>
                  <p class="text-xs text-white font-medium mt-1 leading-relaxed">{{ q.questionText }}</p>
                </div>

                <button (click)="toggleQuestion(q._id)"
                        class="px-3.5 py-1.5 text-[10px] font-extrabold tracking-wider rounded-xl uppercase transition-all"
                        [ngClass]="q.isActive ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'">
                  {{ q.isActive ? 'DEACTIVATE' : 'ACTIVATE' }}
                </button>
              </div>
            </div>
          </div>

          <!-- SECTION 2: Faculty Performance Leaderboard -->
          <div class="glass-card p-6 sm:p-8 space-y-4">
            <h2 class="text-white font-extrabold text-base border-b border-surface-border pb-3">Faculty Leaderboard</h2>

            <div *ngIf="leaderboard().length === 0" class="text-center py-6 text-slate-500 text-xs">
              No performance feedback is populated yet. Once students submit, leaderboards will update.
            </div>

            <div *ngIf="leaderboard().length > 0" class="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              <div *ngFor="let item of leaderboard(); let idx = index"
                   class="p-3.5 rounded-2xl bg-slate-950/40 border border-surface-border flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 font-extrabold text-xs flex items-center justify-center font-mono">
                    #{{ idx + 1 }}
                  </span>
                  <div>
                    <h4 class="text-xs font-bold text-white">{{ item.name }}</h4>
                    <p class="text-[10px] text-slate-500 font-medium">{{ item.email }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <span class="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Responses</span>
                    <span class="text-xs font-extrabold text-white font-mono">{{ item.totalSubmissions }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Avg Score</span>
                    <span class="text-sm font-black text-emerald-400 font-mono">{{ item.averageScore | number:'1.1-1' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Evaluation Session Controls (Lg: 5cols) -->
        <div class="lg:col-span-5 space-y-8">

          <!-- SECTION 3: Feedback Session Admin Controls -->
          <div class="glass-card p-6 sm:p-8 space-y-6">
            <div class="pb-3 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 class="text-white font-extrabold text-base">Evaluation Windows</h2>
                <p class="text-slate-400 text-xs mt-0.5">Control active gates for student submissions.</p>
              </div>
              <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">ACTIVE LOCKS</span>
            </div>

            <!-- Create Session Form -->
            <form (ngSubmit)="onCreateSession()" class="space-y-3.5">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule Evaluation Period</h3>
              <div>
                <input type="text" [(ngModel)]="newSessionName" name="sessionName" placeholder="Session Name (e.g. Autumn Midterm 2026)"
                       class="input-field py-2.5 text-xs" required />
              </div>

              <!-- Custom glassmorphism date pickers -->
              <div class="grid grid-cols-2 gap-3">

                <!-- START DATE -->
                <div class="relative">
                  <label class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Start Date</label>
                  <button type="button" (click)="toggleDashCal('start')"
                          class="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl
                                 border border-slate-700/60 bg-slate-900/50 hover:border-brand-500/50
                                 text-xs font-mono text-left transition-all duration-200 focus:outline-none"
                          [ngClass]="{'border-brand-500/60 bg-brand-500/5': dashActiveCal() === 'start'}">
                    <span [class]="sessionStart ? 'text-white font-semibold' : 'text-slate-500'" class="truncate text-[10px]">
                      {{ sessionStart ? dashFormatDisplay(sessionStart) : 'Pick date' }}
                    </span>
                    <svg class="w-3 h-3 text-slate-500 flex-shrink-0 transition-transform duration-200"
                         [class.rotate-180]="dashActiveCal() === 'start'"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  <!-- Start Calendar -->
                  <div *ngIf="dashActiveCal() === 'start'" class="absolute left-0 top-full mt-1 z-50"
                       style="animation: slideDown 0.18s ease-out forwards; width: 250px;">
                    <ng-container *ngTemplateOutlet="dashCalTpl; context: { $implicit: 'start' }"></ng-container>
                  </div>
                </div>

                <!-- END DATE -->
                <div class="relative">
                  <label class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">End Date</label>
                  <button type="button" (click)="toggleDashCal('end')"
                          class="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl
                                 border border-slate-700/60 bg-slate-900/50 hover:border-emerald-500/50
                                 text-xs font-mono text-left transition-all duration-200 focus:outline-none"
                          [ngClass]="{'border-emerald-500/60 bg-emerald-500/5': dashActiveCal() === 'end'}">
                    <span [class]="sessionEnd ? 'text-white font-semibold' : 'text-slate-500'" class="truncate text-[10px]">
                      {{ sessionEnd ? dashFormatDisplay(sessionEnd) : 'Pick date' }}
                    </span>
                    <svg class="w-3 h-3 text-slate-500 flex-shrink-0 transition-transform duration-200"
                         [class.rotate-180]="dashActiveCal() === 'end'"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  <!-- End Calendar -->
                  <div *ngIf="dashActiveCal() === 'end'" class="absolute right-0 top-full mt-1 z-50"
                       style="animation: slideDown 0.18s ease-out forwards; width: 250px;">
                    <ng-container *ngTemplateOutlet="dashCalTpl; context: { $implicit: 'end' }"></ng-container>
                  </div>
                </div>

              </div>

              <!-- Range pill -->
              <div *ngIf="sessionStart && sessionEnd"
                   class="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500/8 border border-brand-500/20 text-[9px] font-mono text-brand-300">
                <span>📆</span>
                <span>{{ dashFormatDisplay(sessionStart) }}</span>
                <span class="text-slate-500">→</span>
                <span>{{ dashFormatDisplay(sessionEnd) }}</span>
              </div>

              <button type="submit" class="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider"
                      [disabled]="!newSessionName || !sessionStart || !sessionEnd">
                Open Evaluation Window
              </button>
            </form>

            <!-- ── SHARED DASHBOARD CALENDAR TEMPLATE ── -->
            <ng-template #dashCalTpl let-which>
              <div class="rounded-2xl overflow-hidden shadow-2xl"
                   style="background: rgba(10,14,28,0.90); backdrop-filter: blur(28px) saturate(150%);
                          border: 1px solid rgba(255,255,255,0.07);
                          box-shadow: 0 20px 50px rgba(0,0,0,0.65), 0 0 0 1px rgba(99,102,241,0.12);">

                <!-- Month nav -->
                <div class="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
                  <button type="button" (click)="dashPrevMonth()"
                          class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <span class="text-[11px] font-black text-white tracking-wide select-none">
                    {{ DASH_MONTHS[dashCalView().month] }} {{ dashCalView().year }}
                  </span>
                  <button type="button" (click)="dashNextMonth()"
                          class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>

                <!-- Day headers -->
                <div class="grid grid-cols-7 px-2 pt-2 pb-1">
                  <span *ngFor="let d of DASH_DAYS"
                        class="text-center text-[8px] font-black uppercase tracking-widest select-none"
                        [ngClass]="(d==='Sa'||d==='Su') ? 'text-violet-400/60' : 'text-slate-600'">{{ d }}</span>
                </div>

                <!-- Day grid -->
                <div class="grid grid-cols-7 px-2 pb-2 gap-y-0.5">
                  <button *ngFor="let cell of dashCalDays()"
                          type="button"
                          (click)="dashPickDate(which, cell.date)"
                          [disabled]="!cell.inMonth"
                          class="relative flex items-center justify-center h-7 w-full rounded-lg text-[10px] font-semibold
                                 transition-all duration-150 select-none"
                          [ngClass]="dashDayClass(which, cell)">
                    {{ cell.date.getDate() }}
                  </button>
                </div>

                <!-- Footer -->
                <div class="flex items-center justify-between px-3 py-2 border-t border-white/5">
                  <button type="button" (click)="dashClearDate(which)"
                          class="text-[9px] font-bold text-rose-400/70 hover:text-rose-300 uppercase tracking-wider transition-colors">
                    Clear
                  </button>
                  <button type="button" (click)="dashPickDate(which, dashToday)"
                          class="text-[9px] font-bold text-brand-400 hover:text-brand-300 uppercase tracking-wider transition-colors">
                    Today
                  </button>
                </div>

              </div>
            </ng-template>

            <!-- Sessions List -->
            <div class="space-y-3 pt-4 border-t border-surface-border/50">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Windows</h3>
              <div *ngFor="let s of sessions()"
                   class="p-4 rounded-2xl border bg-slate-950/40 flex items-center justify-between gap-4"
                   [ngClass]="s.isOpen ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-surface-border opacity-70'">
                <div>
                  <h4 class="text-xs font-bold text-white">{{ s.sessionName }}</h4>
                  <p class="text-[10px] text-slate-400 mt-1">Period: {{ s.startDate | date:'shortDate' }} - {{ s.endDate | date:'shortDate' }}</p>
                </div>

                <button (click)="toggleSession(s._id)"
                        class="px-3 py-1.5 text-[9px] font-black tracking-wider rounded-xl uppercase transition-all"
                        [ngClass]="s.isOpen ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'">
                  {{ s.isOpen ? 'CLOSE WINDOW' : 'OPEN WINDOW' }}
                </button>
              </div>
            </div>
          </div>

          <!-- SECTION 4: Institutional Bulk Ingestion Hub -->
          <div class="glass-card p-6 sm:p-8 space-y-6">
            <div class="pb-3 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 class="text-white font-extrabold text-base">Bulk Data Ingestion Portal</h2>
                <p class="text-slate-400 text-xs mt-0.5">Import student rosters, faculty, and mappings.</p>
              </div>
              <span class="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-bold">BULK IMPORT</span>
            </div>

            <!-- Ingestion Mode Switcher -->
            <div class="flex p-1 bg-slate-950/60 border border-surface-border rounded-xl max-w-xs">
              <button type="button" (click)="ingestMode.set('csv'); uploadResult.set(null);"
                      class="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200"
                      [ngClass]="ingestMode() === 'csv' ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-black' : 'text-slate-400 hover:text-white'">
                📂 Standard CSV
              </button>
              <button type="button" (click)="ingestMode.set('ai'); uploadResult.set(null);"
                      class="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200"
                      [ngClass]="ingestMode() === 'ai' ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-black' : 'text-slate-400 hover:text-white'">
                ✨ AI Text Ingest
              </button>
            </div>

            <!-- Upload Tabs — Premium Glassmorphic Bar -->
            <div class="tab-bar mb-5">
              <button (click)="activeTab.set('students'); selectedFile.set(null); uploadResult.set(null); aiPreviewData.set([]);"
                      class="tab-btn tab-brand"
                      [class.tab-active]="activeTab() === 'students'">
                🎓 Students
              </button>
              <button (click)="activeTab.set('faculty'); selectedFile.set(null); uploadResult.set(null); aiPreviewData.set([]);"
                      class="tab-btn tab-emerald"
                      [class.tab-active]="activeTab() === 'faculty'">
                👨‍🏫 Faculty
              </button>
              <button (click)="activeTab.set('assignments'); selectedFile.set(null); uploadResult.set(null); aiPreviewData.set([]);"
                      class="tab-btn tab-violet"
                      [class.tab-active]="activeTab() === 'assignments'">
                🔗 Assignments
              </button>
            </div>

            <!-- Ingestion instructions & required headers -->
            <div class="bg-slate-950/40 border border-surface-border p-4 rounded-xl space-y-2 mb-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-[10px] font-mono text-slate-500 block uppercase font-bold">Required Format &amp; Headers</span>
              </div>

              <div *ngIf="activeTab() === 'students'" class="space-y-1">
                <div class="flex items-center justify-between">
                  <p class="text-[11px] text-slate-300 font-medium">Headers: <span class="font-mono text-brand-300 font-bold">[Name, Email, RollNo, Section, Semester]</span></p>
                  <button (click)="downloadTemplate('students')" class="text-[9px] font-bold text-brand-400 hover:text-brand-300 underline uppercase bg-transparent border-none p-0 cursor-pointer">📥 Sample CSV</button>
                </div>
                <p class="text-[10px] text-slate-500 leading-relaxed">Imports student accounts and generates a default password: <span class="text-emerald-400 font-semibold">IIITR&#64;2026</span></p>
              </div>

              <div *ngIf="activeTab() === 'faculty'" class="space-y-1">
                <div class="flex items-center justify-between">
                  <p class="text-[11px] text-slate-300 font-medium">Headers: <span class="font-mono text-brand-300 font-bold">[Name, Email]</span></p>
                  <button (click)="downloadTemplate('faculty')" class="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 underline uppercase bg-transparent border-none p-0 cursor-pointer">📥 Sample CSV</button>
                </div>
                <p class="text-[10px] text-slate-500 leading-relaxed">Imports faculty accounts and generates default email local-part password.</p>
              </div>

              <div *ngIf="activeTab() === 'assignments'" class="space-y-1">
                <div class="flex items-center justify-between">
                  <p class="text-[11px] text-slate-300 font-medium">Headers: <span class="font-mono text-brand-300 font-bold">[FacultyEmail, CourseCode, Section, Semester]</span></p>
                  <button (click)="downloadTemplate('assignments')" class="text-[9px] font-bold text-violet-400 hover:text-violet-300 underline uppercase bg-transparent border-none p-0 cursor-pointer">📥 Sample CSV</button>
                </div>
                <p class="text-[10px] text-slate-500 leading-relaxed">Establishes faculty-course assignments with the database Relational Linker.</p>
              </div>
            </div>

            <ng-container *ngIf="ingestMode() === 'csv'">
              <!-- Hidden File Input -->
              <input #csvFileRef id="csvFileInput" type="file" class="sr-only" accept=".csv" (change)="onFileSelected($event)" />

              <!-- Drop Zone -->
              <div class="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 relative mb-4 select-none"
                   [ngClass]="{
                     'border-brand-500 bg-brand-500/5': isDragOver(),
                     'border-slate-700 bg-slate-950/20 hover:border-brand-500/40': !isDragOver()
                   }"
                   (click)="csvFileRef.click()"
                   (dragover)="$event.preventDefault(); $event.stopPropagation(); isDragOver.set(true)"
                   (dragleave)="$event.preventDefault(); $event.stopPropagation(); isDragOver.set(false)"
                   (dragenter)="$event.preventDefault(); $event.stopPropagation(); isDragOver.set(true)"
                   (drop)="onFileDrop($event)">
                <div class="space-y-2 pointer-events-none">
                  <span class="text-3xl block">{{ isDragOver() ? '🎯' : '📥' }}</span>
                  <span class="text-xs font-semibold text-slate-300 block">
                    {{ selectedFile() ? selectedFile()?.name : (isDragOver() ? 'Drop your CSV file here!' : 'Drag & drop or click to select CSV file') }}
                  </span>
                  <span *ngIf="selectedFile()" class="text-[10px] text-slate-500 font-mono block">
                    Size: {{ (selectedFile()?.size || 0) / 1024 | number:'1.1-1' }} KB
                  </span>
                </div>
              </div>

              <!-- Upload and Reset buttons -->
              <div class="flex gap-3 mb-4">
                <button type="button" (click)="selectedFile() ? onUpload() : csvFileRef.click()" class="btn-primary py-2.5 px-5 text-xs font-bold uppercase tracking-wider flex-1"
                        [disabled]="uploading()">
                  <span *ngIf="uploading()">UPLOADING...</span>
                  <span *ngIf="!uploading() && !selectedFile()">📂 SELECT FILE</span>
                  <span *ngIf="!uploading() && selectedFile()">UPLOAD DATA</span>
                </button>
                <button type="button" *ngIf="selectedFile()" (click)="selectedFile.set(null); uploadResult.set(null);"
                        class="btn-ghost py-2.5 px-3 text-xs font-bold uppercase tracking-wider">
                  RESET
                </button>
              </div>
            </ng-container>

            <ng-container *ngIf="ingestMode() === 'ai'">
              <!-- AI Ingest Container -->
              <div class="space-y-4 animate-fade-in">
                <div>
                  <label class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Paste Unstructured Academic Text</label>
                  <p class="text-[10px] text-slate-500 leading-relaxed mb-2">
                    Paste raw text tables, lists, or unstructured notes below. Our integrated Gemini uploader structures the raw copy directly into records.
                  </p>
                  <textarea [(ngModel)]="aiRawText" placeholder="Example student data:&#10;Amit Kumar, amit.kumar&#64;iiitr.ac.in, Roll 2022BCS021, Sec A, Sem 3&#10;Sneha Verma, sneha.verma&#64;iiitr.ac.in, Roll 2022BCS022, Sec B, Sem 3"
                            class="input-field h-36 text-xs font-mono p-4 resize-none leading-relaxed custom-scroll"
                            [disabled]="processingAI()"></textarea>
                </div>

                <!-- Process Button -->
                <button type="button" (click)="onProcessAIIngest()" 
                        class="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider"
                        [disabled]="processingAI() || !aiRawText.trim()">
                  <span *ngIf="processingAI()" class="flex items-center justify-center gap-2">
                    <span class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Extracting Records via Gemini...
                  </span>
                  <span *ngIf="!processingAI()">✨ Extract &amp; Structure Records</span>
                </button>

                <!-- AI Extracted Preview Data Table -->
                <div *ngIf="aiPreviewData().length > 0" class="space-y-3.5 pt-4 border-t border-surface-border/50 animate-scale-in">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                      Extracted Records Preview ({{ aiPreviewData().length }})
                    </span>
                    <button type="button" (click)="aiPreviewData.set([])" class="text-[9px] font-bold text-rose-400 hover:text-rose-300 uppercase underline bg-transparent border-none p-0 cursor-pointer">
                      Clear Preview
                    </button>
                  </div>

                  <!-- High fidelity glass scrollable preview table -->
                  <div class="overflow-x-auto rounded-xl border border-surface-border bg-slate-950/20 max-h-[220px] custom-scroll">
                    <table class="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr class="bg-slate-950/60 border-b border-surface-border">
                          <th *ngFor="let col of getObjectKeys(aiPreviewData()[0])" class="p-3 font-bold text-slate-400 uppercase tracking-wider font-mono">
                            {{ col }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of aiPreviewData()" class="border-b border-surface-border/35 hover:bg-white/5 transition-colors">
                          <td *ngFor="let col of getObjectKeys(row)" class="p-3 text-slate-300 font-semibold truncate max-w-[150px]">
                            {{ row[col] }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Finalize AI Bulk Upload Button -->
                  <button type="button" (click)="onFinalizeAI()" 
                          class="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-glow"
                          [disabled]="uploading()">
                    <span *ngIf="uploading()">SAVING TO DATABASE...</span>
                    <span *ngIf="!uploading()">🚀 Verify &amp; Save Records to Database</span>
                  </button>
                </div>
              </div>
            </ng-container>



            <!-- Response Alert -->
            <div *ngIf="uploadResult()" class="p-4 rounded-xl border animate-fade-in"
                 [ngClass]="uploadResult()?.success ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-rose-500/30 bg-rose-500/5 text-rose-400'">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-extrabold tracking-wider uppercase font-mono">
                  {{ uploadResult()?.success ? 'UPLOAD SUCCESSFUL' : 'UPLOAD WITH NOTICES' }}
                </span>
                <button (click)="uploadResult.set(null)" class="text-[10px] font-mono font-bold hover:underline bg-transparent text-slate-400 border-none cursor-pointer">DISMISS</button>
              </div>
              <p class="text-[11px] leading-relaxed mb-2">{{ uploadResult()?.message }}</p>
              <div class="text-[10px] font-mono grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800">
                <div>Total Rows: <span class="text-white font-bold">{{ uploadResult()?.total }}</span></div>
                <div>Inserted: <span class="text-emerald-400 font-bold">{{ uploadResult()?.inserted }}</span></div>
                <div>Skipped: <span class="text-amber-400 font-bold">{{ uploadResult()?.skipped || 0 }}</span></div>
              </div>
              <!-- Validation Errors -->
              <div *ngIf="uploadResult()?.validationErrors && uploadResult()?.validationErrors.length > 0" class="mt-3 space-y-1">
                <span class="text-[9px] font-bold uppercase text-rose-400 block tracking-wider">Validation Errors:</span>
                <div class="max-h-[100px] overflow-y-auto pr-1 space-y-1 text-[9px] font-mono text-slate-400">
                  <div *ngFor="let err of uploadResult()?.validationErrors">
                    Row {{ err.row }}: {{ err.reason }} ({{ err.email || 'N/A' }})
                  </div>
                </div>
              </div>
              <!-- Duplicates -->
              <div *ngIf="uploadResult()?.duplicates && uploadResult()?.duplicates.length > 0" class="mt-3 space-y-1">
                <span class="text-[9px] font-bold uppercase text-amber-400 block tracking-wider">Duplicates Skipped:</span>
                <div class="max-h-[100px] overflow-y-auto pr-1 space-y-1 text-[9px] font-mono text-slate-400">
                  <div *ngFor="let dup of uploadResult()?.duplicates">
                    Row {{ dup.row || 'N/A' }} - {{ dup.email || 'N/A' }}: {{ dup.reason }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  auth         = inject(AuthService);
  adminService = inject(AdminService);
  router       = inject(Router);

  @ViewChild('meshCanvas') meshCanvas!: ElementRef<HTMLCanvasElement>;

  stats        = signal<AdminStats | null>(null);
  leaderboard  = signal<FacultyLeaderboardItem[]>([]);
  questions    = signal<QuestionItem[]>([]);
  sessions     = signal<FeedbackSessionItem[]>([]);
  alerts       = signal<any[]>([]);

  // Dean Insight Hub Tabs: 'downs' (Warnings), 'ups' (Achievements), 'math' (Real Math Models)
  deanInsightTab = signal<'downs' | 'ups' | 'math'>('downs');

  // Computed Real Mathematical Models & Statistical Inferences (with zero errors/mistakes)
  statsMath = computed(() => {
    const list = this.leaderboard();
    if (list.length === 0) {
      return {
        mean: 0,
        variance: 0,
        stdDev: 0,
        highestRating: 0,
        lowestRating: 0,
        totalSubmissions: 0,
        averageDrop: 0,
        confidenceIntervalUpper: 0,
        confidenceIntervalLower: 0,
        standardError: 0,
        totalFeedbackWeight: 0,
        weightedIndex: 0
      };
    }

    const scores = list.map(item => item.averageScore);
    const mean = scores.reduce((sum, val) => sum + val, 0) / scores.length;

    const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const highestRating = Math.max(...scores);
    const lowestRating = Math.min(...scores);
    const totalSubmissions = list.reduce((sum, item) => sum + (item.totalSubmissions || 0), 0);
    const totalFeedbackWeight = list.reduce((sum, item) => sum + (item.averageScore * (item.totalSubmissions || 0)), 0);

    const alertList = this.alerts();
    const averageDrop = alertList.length > 0
      ? alertList.reduce((sum, a) => sum + a.dropPercentage, 0) / alertList.length
      : 0;

    const sqrtN = Math.sqrt(list.length || 1);
    const standardError = stdDev / sqrtN;

    return {
      mean: Math.round(mean * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      highestRating,
      lowestRating,
      totalSubmissions,
      averageDrop: Math.round(averageDrop * 10) / 10,
      confidenceIntervalUpper: Math.round((mean + (1.96 * standardError)) * 100) / 100,
      confidenceIntervalLower: Math.round((mean - (1.96 * standardError)) * 100) / 100,
      standardError: Math.round(standardError * 1000) / 1000,
      totalFeedbackWeight: Math.round(totalFeedbackWeight * 10) / 10,
      weightedIndex: Math.round((totalFeedbackWeight / (totalSubmissions || 1)) * 100) / 100
    };
  });


  // CSV Bulk Ingestion Signals
  activeTab    = signal<'students' | 'faculty' | 'assignments'>('students');
  ingestMode   = signal<'csv' | 'ai'>('csv');
  selectedFile = signal<File | null>(null);
  uploading    = signal<boolean>(false);
  uploadResult = signal<any | null>(null);
  isDragOver   = signal<boolean>(false);

  // AI Ingest Signals
  aiRawText      = '';
  processingAI   = signal<boolean>(false);
  aiPreviewData  = signal<any[]>([]);

  // Add Question Input
  newQuestionText = '';

  // Add Session Inputs
  newSessionName = '';
  sessionStart   = '';
  sessionEnd     = '';

  // ── Dashboard Calendar State ────────────────────────────────────────────────
  readonly DASH_DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  readonly DASH_MONTHS = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December'];
  readonly dashToday   = new Date();

  dashActiveCal = signal<'start' | 'end' | null>(null);
  dashCalView   = signal<{ year: number; month: number }>({
    year:  new Date().getFullYear(),
    month: new Date().getMonth()
  });

  readonly dashCalDays = computed(() => {
    const { year, month } = this.dashCalView();
    const firstDay = new Date(year, month, 1);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    const days: { date: Date; inMonth: boolean }[] = [];
    for (let i = startOffset - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), inMonth: false });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) days.push({ date: new Date(year, month, d), inMonth: true });
    let next = 1;
    while (days.length < 42) days.push({ date: new Date(year, month + 1, next++), inMonth: false });
    return days;
  });

  toggleDashCal(which: 'start' | 'end') {
    if (this.dashActiveCal() === which) { this.dashActiveCal.set(null); return; }
    const raw   = which === 'start' ? this.sessionStart : this.sessionEnd;
    const pivot = raw ? new Date(raw) : new Date();
    this.dashCalView.set({ year: pivot.getFullYear(), month: pivot.getMonth() });
    this.dashActiveCal.set(which);
  }

  dashPrevMonth() {
    const { year, month } = this.dashCalView();
    const d = new Date(year, month - 1, 1);
    this.dashCalView.set({ year: d.getFullYear(), month: d.getMonth() });
  }

  dashNextMonth() {
    const { year, month } = this.dashCalView();
    const d = new Date(year, month + 1, 1);
    this.dashCalView.set({ year: d.getFullYear(), month: d.getMonth() });
  }

  dashPickDate(which: 'start' | 'end', date: Date) {
    const iso = this.dashToIso(date);
    if (which === 'start') {
      this.sessionStart = iso;
      if (!this.sessionEnd || new Date(this.sessionEnd) <= date) {
        this.sessionEnd = '';
        this.dashCalView.set({ year: date.getFullYear(), month: date.getMonth() });
        this.dashActiveCal.set('end');
      } else {
        this.dashActiveCal.set(null);
      }
    } else {
      this.sessionEnd = iso;
      this.dashActiveCal.set(null);
    }
  }

  dashClearDate(which: 'start' | 'end') {
    if (which === 'start') this.sessionStart = '';
    else this.sessionEnd = '';
    this.dashActiveCal.set(null);
  }

  dashDayClass(which: 'start' | 'end', cell: { date: Date; inMonth: boolean }): Record<string, boolean> {
    if (!cell.inMonth) return { 'opacity-0 pointer-events-none': true };
    const iso     = this.dashToIso(cell.date);
    const isStart = iso === this.sessionStart;
    const isEnd   = iso === this.sessionEnd;
    const isToday = iso === this.dashToIso(this.dashToday);
    const inRange = !!(this.sessionStart && this.sessionEnd && iso > this.sessionStart && iso < this.sessionEnd);
    const isWknd  = cell.date.getDay() === 0 || cell.date.getDay() === 6;
    return {
      'bg-brand-600 text-white font-black shadow-lg rounded-l-lg': isStart,
      'bg-emerald-600 text-white font-black shadow-lg rounded-r-lg': isEnd,
      'bg-brand-500/12 text-brand-200 rounded-none': inRange && !isStart && !isEnd,
      'ring-1 ring-brand-500/60': isToday && !isStart && !isEnd,
      'hover:bg-white/8 text-slate-300': !isStart && !isEnd && !inRange,
      'text-violet-300': isWknd && !isStart && !isEnd,
    };
  }

  dashToIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  dashFormatDisplay(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getDate()} ${this.DASH_MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  downloadTemplate(type: 'students' | 'faculty' | 'assignments') {
    let csvContent = '';
    let filename = '';

    if (type === 'students') {
      csvContent = [
        'Name,Email,RollNo,Section,Semester',
        'Rahul Sharma,rahul.sharma@iiitr.ac.in,2021BCS001,A,5',
        'Priya Singh,priya.singh@iiitr.ac.in,2021BCS002,A,5',
        'Amit Kumar,amit.kumar@iiitr.ac.in,2021BCS003,B,5',
        'Sneha Patel,sneha.patel@iiitr.ac.in,2022BCS001,A,3',
        'Rohit Verma,rohit.verma@iiitr.ac.in,2022BCS002,B,3'
      ].join('\r\n');
      filename = 'students_template.csv';
    } else if (type === 'faculty') {
      csvContent = [
        'Name,Email',
        'Dr. Rajesh Gupta,rajesh.gupta@iiitr.ac.in',
        'Prof. Anita Sharma,anita.sharma@iiitr.ac.in',
        'Dr. Suresh Mehta,suresh.mehta@iiitr.ac.in',
        'Prof. Kavita Rao,kavita.rao@iiitr.ac.in'
      ].join('\r\n');
      filename = 'faculty_template.csv';
    } else if (type === 'assignments') {
      csvContent = [
        'FacultyEmail,CourseCode,Section,Semester',
        'rajesh.gupta@iiitr.ac.in,CS101,A,5',
        'rajesh.gupta@iiitr.ac.in,CS102,B,5',
        'anita.sharma@iiitr.ac.in,CS201,A,3',
        'suresh.mehta@iiitr.ac.in,CS301,A,5'
      ].join('\r\n');
      filename = 'assignments_template.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  ngOnInit() {
    this.fetchGlobalData();
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
      time += 0.001; // Slower ambient movement for Admin

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

  fetchGlobalData() {
    // 1. Fetch Stats
    this.adminService.getGlobalStats().subscribe({
      next: (res) => this.stats.set(res?.data || null)
    });

    // 2. Fetch Leaderboard
    this.adminService.getFacultyLeaderboard().subscribe({
      next: (res) => this.leaderboard.set(res?.data?.leaderboard || [])
    });

    // 3. Fetch Questions
    this.adminService.getAllQuestions().subscribe({
      next: (res) => this.questions.set(res?.data?.questions || [])
    });

    // 4. Fetch Sessions
    this.adminService.getAllSessions().subscribe({
      next: (res) => this.sessions.set(res?.data?.sessions || [])
    });

    // 5. Fetch Dean Velocity Alerts
    this.adminService.getAlerts().subscribe({
      next: (res) => this.alerts.set(res?.data?.alerts || [])
    });
  }

  onAddQuestion() {
    if (!this.newQuestionText.trim()) return;

    this.adminService.addQuestion(this.newQuestionText.trim()).subscribe({
      next: () => {
        this.newQuestionText = '';
        // Re-fetch questions list
        this.adminService.getAllQuestions().subscribe({
          next: (res) => this.questions.set(res?.data?.questions || [])
        });
      }
    });
  }

  toggleQuestion(qid: string) {
    this.adminService.toggleQuestion(qid).subscribe({
      next: () => {
        // Toggle active status in local signal immediately
        this.questions.update(items =>
          items.map(q => q._id === qid ? { ...q, isActive: !q.isActive } : q)
        );
      }
    });
  }

  onCreateSession() {
    if (!this.newSessionName || !this.sessionStart || !this.sessionEnd) return;

    const payload = {
      sessionName: this.newSessionName,
      startDate: new Date(this.sessionStart).toISOString(),
      endDate: new Date(this.sessionEnd).toISOString()
    };

    this.adminService.createSession(payload).subscribe({
      next: () => {
        this.newSessionName = '';
        this.sessionStart = '';
        this.sessionEnd = '';
        // Re-fetch sessions list
        this.adminService.getAllSessions().subscribe({
          next: (res) => this.sessions.set(res?.data?.sessions || [])
        });
      }
    });
  }

  toggleSession(sid: string) {
    this.adminService.toggleSession(sid).subscribe({
      next: () => {
        // Toggle status in local signal immediately
        this.sessions.update(items =>
          items.map(s => s._id === sid ? { ...s, isOpen: !s.isOpen } : s)
        );
      }
    });
  }

  // ============================================================
  // CSV DATA BULK INGESTION HANDLERS
  // ============================================================
  onFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile.set(fileList[0]);
      this.uploadResult.set(null);
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
        this.selectedFile.set(file);
        this.uploadResult.set(null);
      } else {
        this.uploadResult.set({ success: false, message: 'Only CSV files are accepted. Please drop a .csv file.' });
      }
    }
  }

  onUpload() {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.uploadResult.set(null);

    const tab = this.activeTab();
    let upload$ = this.adminService.uploadStudents(file);

    if (tab === 'faculty') {
      upload$ = this.adminService.uploadFaculty(file);
    } else if (tab === 'assignments') {
      upload$ = this.adminService.uploadAssignments(file);
    }

    upload$.subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.selectedFile.set(null);
        this.uploadResult.set({
          success: true,
          message: res.message || 'CSV file uploaded and parsed successfully!',
          total: res.total || 0,
          inserted: res.inserted || 0,
          skipped: res.skipped,
          validationErrors: res.validationErrors,
          duplicates: res.duplicates
        });
        // Re-fetch global stats to update student counts
        this.fetchGlobalData();
      },
      error: (err) => {
        this.uploading.set(false);
        const errorMsg = err.error?.message || 'An error occurred during file ingestion.';
        this.uploadResult.set({
          success: false,
          message: errorMsg,
          total: err.error?.total || 0,
          inserted: err.error?.inserted || 0,
          skipped: err.error?.skipped || 0,
          validationErrors: err.error?.validationErrors || [],
          duplicates: err.error?.duplicates || []
        });
      }
    });
  }

  // ============================================================
  // AI DATA BULK INGESTION HANDLERS
  // ============================================================
  onProcessAIIngest() {
    if (!this.aiRawText.trim()) return;

    this.processingAI.set(true);
    this.uploadResult.set(null);
    this.aiPreviewData.set([]);

    this.adminService.processAIIngest(this.aiRawText, this.activeTab()).subscribe({
      next: (res) => {
        this.processingAI.set(false);
        if (res.success && res.data && Array.isArray(res.data)) {
          this.aiPreviewData.set(res.data);
        }
      },
      error: (err) => {
        this.processingAI.set(false);
        this.uploadResult.set({
          success: false,
          message: 'Gemini extraction failed: ' + (err.error?.message || err.message)
        });
      }
    });
  }

  onFinalizeAI() {
    const data = this.aiPreviewData();
    if (!data || data.length === 0) return;

    this.uploading.set(true);
    this.uploadResult.set(null);

    this.adminService.uploadBulkJSON(this.activeTab(), data).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.aiRawText = '';
        this.aiPreviewData.set([]);

        this.uploadResult.set({
          success: true,
          message: res.message || 'AI JSON Bulk Upload successful!',
          total: res.total || 0,
          inserted: res.inserted || 0,
          validationErrors: res.errors || []
        });
        this.fetchGlobalData();
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadResult.set({
          success: false,
          message: err.error?.message || 'Bulk Insert Failed'
        });
      }
    });
  }
}
