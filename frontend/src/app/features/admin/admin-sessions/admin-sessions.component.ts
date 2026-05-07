import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, FeedbackSessionItem } from '../../../core/services/admin.service';

// ── Tiny inline calendar ──────────────────────────────────────────────────────
const DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

interface CalDay { date: Date; inMonth: boolean; }

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    /* Slide-down animation for calendar */
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }
    .calendar-animate { animation: slideDown 0.18s ease-out forwards; }

    /* Color-scheme override so browser won't tint the hidden date input */
    input[type="date"] { color-scheme: dark; }

    /* Scrollbar inside sessions list */
    .sessions-scroll::-webkit-scrollbar { width: 4px; }
    .sessions-scroll::-webkit-scrollbar-track { background: transparent; }
    .sessions-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }
  `],
  template: `
    <!-- Global Mesh Background -->
    <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none z-0"></div>
    <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-teal-500/10 blur-[80px] pointer-events-none z-0"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10 space-y-8">

      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">SCHEDULING</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Feedback Sessions</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Schedule feedback windows, control active student portals, and view scheduled evaluation dates.
          </p>
        </div>
      </div>

      <!-- Main Columns -->
      <div class="grid lg:grid-cols-12 gap-8">

        <!-- LEFT: Create session (5 cols) -->
        <div class="lg:col-span-5">
          <div class="glass-card p-6 sm:p-8 space-y-6">
            <h2 class="text-white font-extrabold text-base border-b border-surface-border pb-3 flex items-center gap-2">
              <span>📅</span> Schedule New Session
            </h2>

            <form (ngSubmit)="onCreateSession()" class="space-y-5">

              <!-- Session Name -->
              <div>
                <label class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Session Name</label>
                <input type="text" [(ngModel)]="newSessionName" name="sessionName"
                       placeholder="e.g. Spring Semester End 2026"
                       class="input-field py-2.5 text-xs" required />
              </div>

              <!-- Date Row -->
              <div class="grid grid-cols-2 gap-4">

                <!-- ── START DATE ── -->
                <div class="relative">
                  <label class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Start Date</label>
                  <button type="button"
                          (click)="toggleCal('start')"
                          class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl
                                 border border-slate-700/60 bg-slate-900/50 hover:border-brand-500/50
                                 text-xs font-mono text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                          [ngClass]="{'border-brand-500/60 bg-brand-500/5': activeCal() === 'start'}">
                    <span [class]="sessionStart ? 'text-white font-semibold' : 'text-slate-500'">
                      {{ sessionStart ? formatDisplay(sessionStart) : 'Pick date' }}
                    </span>
                    <svg class="w-3.5 h-3.5 text-slate-500 flex-shrink-0 transition-transform duration-200"
                         [class.rotate-180]="activeCal() === 'start'"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <!-- Start Calendar Popup -->
                  <div *ngIf="activeCal() === 'start'"
                       class="absolute left-0 top-full mt-2 z-50 calendar-animate"
                       style="width: 260px;">
                    <ng-container *ngTemplateOutlet="calendarTpl; context: { $implicit: 'start' }"></ng-container>
                  </div>
                </div>

                <!-- ── END DATE ── -->
                <div class="relative">
                  <label class="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">End Date</label>
                  <button type="button"
                          (click)="toggleCal('end')"
                          class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl
                                 border border-slate-700/60 bg-slate-900/50 hover:border-emerald-500/50
                                 text-xs font-mono text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          [ngClass]="{'border-emerald-500/60 bg-emerald-500/5': activeCal() === 'end'}">
                    <span [class]="sessionEnd ? 'text-white font-semibold' : 'text-slate-500'">
                      {{ sessionEnd ? formatDisplay(sessionEnd) : 'Pick date' }}
                    </span>
                    <svg class="w-3.5 h-3.5 text-slate-500 flex-shrink-0 transition-transform duration-200"
                         [class.rotate-180]="activeCal() === 'end'"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <!-- End Calendar Popup -->
                  <div *ngIf="activeCal() === 'end'"
                       class="absolute right-0 top-full mt-2 z-50 calendar-animate"
                       style="width: 260px;">
                    <ng-container *ngTemplateOutlet="calendarTpl; context: { $implicit: 'end' }"></ng-container>
                  </div>
                </div>

              </div><!-- /date row -->

              <!-- Range display pill -->
              <div *ngIf="sessionStart && sessionEnd"
                   class="flex items-center gap-2 p-3 rounded-xl bg-brand-500/8 border border-brand-500/20 text-[10px] font-mono text-brand-300">
                <span class="text-base">📆</span>
                <span>{{ formatDisplay(sessionStart) }}</span>
                <span class="text-slate-500">→</span>
                <span>{{ formatDisplay(sessionEnd) }}</span>
                <span class="ml-auto text-slate-500">{{ dayDiff() }} days</span>
              </div>

              <div *ngIf="errorMessage()" class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                ⚠️ {{ errorMessage() }}
              </div>

              <button type="submit" class="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider"
                      [disabled]="!newSessionName || !sessionStart || !sessionEnd">
                Initialize Evaluation Window
              </button>

            </form>
          </div>
        </div>

        <!-- RIGHT: Active Windows Grid (7 cols) -->
        <div class="lg:col-span-7">
          <div class="glass-card p-6 sm:p-8 space-y-4">
            <h2 class="text-white font-extrabold text-base border-b border-surface-border pb-3 flex items-center justify-between">
              <span>Configured Gates</span>
              <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded font-bold uppercase">WINDOWS: {{ sessions().length }}</span>
            </h2>

            <div *ngIf="loading()" class="text-center py-10 space-y-3">
              <div class="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-slate-500 text-xs font-mono">Syncing configured windows...</p>
            </div>

            <div *ngIf="!loading() && sessions().length === 0" class="text-center py-12 text-slate-500 text-xs">
              No evaluation windows have been scheduled yet.
            </div>

            <div *ngIf="!loading() && sessions().length > 0" class="space-y-4 max-h-[450px] overflow-y-auto sessions-scroll pr-1">
              <div *ngFor="let s of sessions()"
                   class="p-5 rounded-2xl border bg-slate-950/40 flex items-center justify-between gap-4 transition-all duration-200"
                   [ngClass]="s.isOpen ? 'border-emerald-500/30 bg-emerald-500/5 shadow-glow' : 'border-surface-border opacity-70'">
                <div>
                  <div class="flex items-center gap-2">
                    <span *ngIf="s.isOpen" class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h4 class="text-xs font-extrabold text-white">{{ s.sessionName }}</h4>
                  </div>
                  <p class="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                    ⏱️ {{ s.startDate | date:'mediumDate' }} — {{ s.endDate | date:'mediumDate' }}
                  </p>
                </div>
                <button (click)="toggleSession(s._id)"
                        class="px-4 py-2 text-[10px] font-black tracking-wider rounded-xl uppercase transition-all"
                        [ngClass]="s.isOpen
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'">
                  {{ s.isOpen ? '🔒 Close Portal' : '🔓 Open Portal' }}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         SHARED CALENDAR TEMPLATE
         ═══════════════════════════════════════════════ -->
    <ng-template #calendarTpl let-which>
      <div class="rounded-2xl overflow-hidden shadow-2xl"
           style="background: rgba(10,14,28,0.88); backdrop-filter: blur(28px) saturate(150%);
                  border: 1px solid rgba(255,255,255,0.07);
                  box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.12);">

        <!-- Month navigation -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <button type="button" (click)="prevMonth()"
                  class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <span class="text-xs font-black text-white tracking-wide select-none">
            {{ MONTHS[calView().month] }} {{ calView().year }}
          </span>

          <button type="button" (click)="nextMonth()"
                  class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Day headers -->
        <div class="grid grid-cols-7 px-3 pt-3 pb-1">
          <span *ngFor="let d of DAYS"
                class="text-center text-[9px] font-black uppercase tracking-widest select-none"
                [ngClass]="(d==='Sa'||d==='Su') ? 'text-violet-400/60' : 'text-slate-600'">
            {{ d }}
          </span>
        </div>

        <!-- Day grid -->
        <div class="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
          <button *ngFor="let cell of calDays()"
                  type="button"
                  (click)="pickDate(which, cell.date)"
                  [disabled]="!cell.inMonth"
                  class="relative flex items-center justify-center h-8 w-full rounded-lg text-[11px] font-semibold
                         transition-all duration-150 select-none"
                  [ngClass]="dayClass(which, cell)">
            {{ cell.date.getDate() }}
          </button>
        </div>

        <!-- Footer: today shortcut -->
        <div class="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
          <button type="button" (click)="clearDate(which)"
                  class="text-[10px] font-bold text-rose-400/70 hover:text-rose-300 uppercase tracking-wider transition-colors">
            Clear
          </button>
          <button type="button" (click)="pickDate(which, today)"
                  class="text-[10px] font-bold text-brand-400 hover:text-brand-300 uppercase tracking-wider transition-colors">
            Today
          </button>
        </div>

      </div>
    </ng-template>
  `
})
export class AdminSessionsComponent implements OnInit {
  private admin = inject(AdminService);

  readonly sessions     = signal<FeedbackSessionItem[]>([]);
  readonly loading      = signal(true);
  readonly errorMessage = signal('');

  newSessionName = '';
  sessionStart   = '';   // ISO yyyy-MM-dd strings
  sessionEnd     = '';

  // ── Calendar state ──────────────────────────────────────────────────────────
  readonly DAYS   = DAYS;
  readonly MONTHS = MONTHS;
  readonly today  = new Date();

  activeCal  = signal<'start' | 'end' | null>(null);
  calView    = signal<{ year: number; month: number }>({
    year:  new Date().getFullYear(),
    month: new Date().getMonth()
  });

  readonly calDays = computed<CalDay[]>(() => {
    const { year, month } = this.calView();
    const firstDay = new Date(year, month, 1);
    // Mon=0 … Sun=6 offset
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: CalDay[] = [];
    // Pad with prev-month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, inMonth: false });
    }
    // Current month days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), inMonth: true });
    }
    // Pad to full 6-row grid (42 cells)
    let next = 1;
    while (days.length < 42) {
      days.push({ date: new Date(year, month + 1, next++), inMonth: false });
    }
    return days;
  });

  readonly dayDiff = computed(() => {
    if (!this.sessionStart || !this.sessionEnd) return 0;
    const a = new Date(this.sessionStart).getTime();
    const b = new Date(this.sessionEnd).getTime();
    return Math.max(0, Math.round((b - a) / 86400000));
  });

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit() { this.loadSessions(); }

  loadSessions() {
    this.loading.set(true);
    this.admin.getAllSessions().subscribe({
      next: (res) => {
        if (res.success) this.sessions.set(res.data.sessions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // ── Calendar helpers ────────────────────────────────────────────────────────
  toggleCal(which: 'start' | 'end') {
    if (this.activeCal() === which) {
      this.activeCal.set(null);
      return;
    }
    // Initialise view to the currently selected date for that picker
    const raw = which === 'start' ? this.sessionStart : this.sessionEnd;
    const pivot = raw ? new Date(raw) : new Date();
    this.calView.set({ year: pivot.getFullYear(), month: pivot.getMonth() });
    this.activeCal.set(which);
  }

  prevMonth() {
    const { year, month } = this.calView();
    const d = new Date(year, month - 1, 1);
    this.calView.set({ year: d.getFullYear(), month: d.getMonth() });
  }

  nextMonth() {
    const { year, month } = this.calView();
    const d = new Date(year, month + 1, 1);
    this.calView.set({ year: d.getFullYear(), month: d.getMonth() });
  }

  pickDate(which: 'start' | 'end', date: Date) {
    const iso = this.toIso(date);
    if (which === 'start') {
      this.sessionStart = iso;
      // Auto-open end picker if end is unset or before new start
      if (!this.sessionEnd || new Date(this.sessionEnd) <= date) {
        this.sessionEnd = '';
        this.calView.set({ year: date.getFullYear(), month: date.getMonth() });
        this.activeCal.set('end');
      } else {
        this.activeCal.set(null);
      }
    } else {
      this.sessionEnd = iso;
      this.activeCal.set(null);
    }
  }

  clearDate(which: 'start' | 'end') {
    if (which === 'start') this.sessionStart = '';
    else this.sessionEnd = '';
    this.activeCal.set(null);
  }

  /** CSS classes for a calendar day cell */
  dayClass(which: 'start' | 'end', cell: CalDay): Record<string, boolean> {
    if (!cell.inMonth) return { 'opacity-0 pointer-events-none': true };

    const iso = this.toIso(cell.date);
    const isStart   = iso === this.sessionStart;
    const isEnd     = iso === this.sessionEnd;
    const isToday   = iso === this.toIso(this.today);
    const inRange   = !!(this.sessionStart && this.sessionEnd &&
                       iso > this.sessionStart && iso < this.sessionEnd);
    const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;

    return {
      // Selected start
      'bg-brand-600 text-white font-black shadow-lg': isStart,
      'rounded-l-lg': isStart,
      // Selected end
      'bg-emerald-600 text-white font-black shadow-lg': isEnd,
      'rounded-r-lg': isEnd,
      // In range
      'bg-brand-500/12 text-brand-200 rounded-none': inRange && !isStart && !isEnd,
      // Today ring
      'ring-1 ring-brand-500/60': isToday && !isStart && !isEnd,
      // Normal hover
      'hover:bg-white/8 text-slate-300': !isStart && !isEnd && !inRange,
      // Weekends get purple-ish tint
      'text-violet-300': isWeekend && !isStart && !isEnd,
    };
  }

  /** Convert Date → 'yyyy-MM-dd' */
  toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** Display string e.g. '7 May 2026' */
  formatDisplay(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
  }

  // ── Session CRUD ────────────────────────────────────────────────────────────
  onCreateSession() {
    this.errorMessage.set('');
    const payload = {
      sessionName: this.newSessionName,
      startDate:   this.sessionStart,
      endDate:     this.sessionEnd
    };

    this.admin.createSession(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.newSessionName = '';
          this.sessionStart   = '';
          this.sessionEnd     = '';
          this.loadSessions();
        }
      },
      error: (err) => this.errorMessage.set(err.error?.message || 'Failed to schedule feedback session')
    });
  }

  toggleSession(sessionId: string) {
    this.admin.toggleSession(sessionId).subscribe({
      next: () => this.loadSessions()
    });
  }
}
