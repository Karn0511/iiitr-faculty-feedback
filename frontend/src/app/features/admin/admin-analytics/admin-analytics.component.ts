import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStats, FacultyLeaderboardItem } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Global Mesh Background -->
    <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none z-0"></div>
    <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-fuchsia-500/10 blur-[80px] pointer-events-none z-0"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10 space-y-8">
      
      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">INTELLIGENCE</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Institutional Analytics</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Real-time aggregates, global score indices, and exhaustive faculty evaluation standings.
          </p>
        </div>
      </div>

      <!-- Quick Summary Metric Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- CARD 1: Institute Rating -->
        <div class="glass-card p-6 flex items-center justify-between relative overflow-hidden group">
          <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-brand-500/5 group-hover:bg-brand-500/10 transition-all duration-300 blur-2xl"></div>
          <div>
            <span class="text-[10px] font-mono text-slate-500 block uppercase font-bold tracking-wider">Institute Index</span>
            <h3 class="text-3xl font-black text-brand-400 font-mono mt-2 flex items-baseline gap-1">
              {{ stats()?.averageInstituteScore || 0 | number:'1.2-2' }}
              <span class="text-slate-500 text-xs">/10</span>
            </h3>
            <p class="text-[10px] text-slate-400 mt-1.5">Weighted academic average</p>
          </div>
          <span class="text-3xl">🏛️</span>
        </div>

        <!-- CARD 2: Total Evaluation Feedbacks -->
        <div class="glass-card p-6 flex items-center justify-between relative overflow-hidden group">
          <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-all duration-300 blur-2xl"></div>
          <div>
            <span class="text-[10px] font-mono text-slate-500 block uppercase font-bold tracking-wider">Evaluation Count</span>
            <h3 class="text-3xl font-black text-white font-mono mt-2">
              {{ stats()?.totalFeedback || 0 }}
            </h3>
            <p class="text-[10px] text-slate-400 mt-1.5">Completed survey entries</p>
          </div>
          <span class="text-3xl">📋</span>
        </div>

        <!-- CARD 3: Active Student Body -->
        <div class="glass-card p-6 flex items-center justify-between relative overflow-hidden group">
          <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-all duration-300 blur-2xl"></div>
          <div>
            <span class="text-[10px] font-mono text-slate-500 block uppercase font-bold tracking-wider">Enrolled Body</span>
            <h3 class="text-3xl font-black text-amber-400 font-mono mt-2">
              {{ stats()?.totalStudents || 0 }}
            </h3>
            <p class="text-[10px] text-slate-400 mt-1.5">Verified active students</p>
          </div>
          <span class="text-3xl">🎓</span>
        </div>

        <!-- CARD 4: Individual Ratings Count -->
        <div class="glass-card p-6 flex items-center justify-between relative overflow-hidden group">
          <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all duration-300 blur-2xl"></div>
          <div>
            <span class="text-[10px] font-mono text-slate-500 block uppercase font-bold tracking-wider">Individual Ratings</span>
            <h3 class="text-3xl font-black text-emerald-400 font-mono mt-2">
              {{ stats()?.totalRatings || 0 }}
            </h3>
            <p class="text-[10px] text-slate-400 mt-1.5">Aggregated feedback cells</p>
          </div>
          <span class="text-3xl">📊</span>
        </div>

      </div>

      <!-- Advanced Score Gauge & Leaderboard -->
      <div class="grid lg:grid-cols-12 gap-8">
        
        <!-- LEFT: Gauge / Score Breakdown (5cols) -->
        <div class="lg:col-span-5 space-y-8">
          <div class="glass-card p-6 sm:p-8 space-y-6">
            <h2 class="text-white font-extrabold text-base border-b border-surface-border pb-3">Quality Indexes</h2>
            
            <!-- Progress gauge -->
            <div class="flex flex-col items-center justify-center py-6 text-center">
              <div class="relative w-40 h-40 flex items-center justify-center">
                <!-- Circular progress SVG -->
                <svg class="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" class="stroke-slate-800" stroke-width="12" fill="transparent" />
                  <circle cx="80" cy="80" r="70" class="stroke-indigo-500" stroke-width="12" fill="transparent"
                          [attr.stroke-dasharray]="circleCircumference"
                          [attr.stroke-dashoffset]="circleDashOffset()"
                          stroke-linecap="round" />
                </svg>
                <div class="absolute flex flex-col items-center">
                  <span class="text-4xl font-black text-white font-mono leading-none">
                    {{ percentageScore() | number:'1.0-0' }}%
                  </span>
                  <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">APPROVAL RATE</span>
                </div>
              </div>
            </div>

            <!-- Detailed progress bars -->
            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span>Academic Efficiency</span>
                  <span class="font-mono text-emerald-400">{{ (stats()?.averageInstituteScore || 0) * 10 | number:'1.0-0' }}%</span>
                </div>
                <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full transition-all duration-1000" [style.width.%]="(stats()?.averageInstituteScore || 0) * 10"></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span>Evaluation Participation</span>
                  <span class="font-mono text-indigo-400">{{ participationRate() | number:'1.0-0' }}%</span>
                </div>
                <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" [style.width.%]="participationRate()"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Dedicated Faculty Leaderboard (7cols) -->
        <div class="lg:col-span-7">
          <div class="glass-card p-6 sm:p-8 space-y-4">
            <h2 class="text-white font-extrabold text-base border-b border-surface-border pb-3 flex items-center justify-between">
              <span>Faculty Performance Standings</span>
              <span class="text-xs font-mono text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded font-bold uppercase">RANKINGS</span>
            </h2>

            <div *ngIf="loading()" class="text-center py-12 space-y-3">
              <div class="inline-block w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-slate-500 text-xs font-mono">Synthesizing evaluations...</p>
            </div>

            <div *ngIf="!loading() && leaderboard().length === 0" class="text-center py-16 text-slate-500 text-xs">
              No performance feedback is loaded yet. Submit evaluations to update standings.
            </div>

            <div *ngIf="!loading() && leaderboard().length > 0" class="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              <div *ngFor="let item of leaderboard(); let idx = index"
                   class="p-4 rounded-2xl bg-slate-950/40 border border-surface-border flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold text-xs flex items-center justify-center font-mono">
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
                    <span class="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Average Index</span>
                    <span class="text-sm font-black text-emerald-400 font-mono">{{ item.averageScore | number:'1.2-2' }}</span>
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
export class AdminAnalyticsComponent implements OnInit {
  private admin = inject(AdminService);

  readonly stats       = signal<any | null>(null);
  readonly leaderboard = signal<FacultyLeaderboardItem[]>([]);
  readonly loading     = signal(true);

  readonly circleCircumference = 2 * Math.PI * 70; // r=70

  readonly percentageScore = computed(() => {
    const avg = this.stats()?.averageInstituteScore || 0;
    return (avg / 10) * 100;
  });

  readonly circleDashOffset = computed(() => {
    const pct = this.percentageScore();
    return this.circleCircumference - (pct / 100) * this.circleCircumference;
  });

  readonly participationRate = computed(() => {
    const feedbacks = this.stats()?.totalFeedback || 0;
    const students  = this.stats()?.totalStudents || 1;
    const rate = (feedbacks / (students * 5)) * 100; // Assume avg 5 courses per student
    return Math.min(Math.max(rate, 12), 100); // Bounds check
  });

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading.set(true);
    this.admin.getGlobalStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats.set(res.data);
        }
        this.admin.getFacultyLeaderboard().subscribe({
          next: (lbRes) => {
            if (lbRes.success) {
              this.leaderboard.set(lbRes.data.leaderboard);
            }
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }
}
