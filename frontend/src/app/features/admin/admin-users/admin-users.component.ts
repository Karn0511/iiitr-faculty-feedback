import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  rollNo?: string;
  section?: string;
  semester?: number;
  createdAt: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Global Mesh Background -->
    <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none z-0"></div>
    <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none z-0"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10 space-y-8">
      
      <!-- Header Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-950/60 border border-surface-border p-8 shadow-glow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">DATABASE</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">Identity Directory</h1>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Inspect all registered student profiles, faculty credentials, and system controllers.
          </p>
        </div>

        <!-- Quick Summary Stats -->
        <div class="flex gap-4">
          <div class="bg-slate-900/60 border border-surface-border p-4 rounded-2xl min-w-[120px]">
            <span class="text-xs font-bold text-slate-500 block uppercase">Total Users</span>
            <span class="text-xl font-black text-white font-mono">{{ users().length }}</span>
          </div>
          <div class="bg-slate-900/60 border border-surface-border p-4 rounded-2xl min-w-[120px]">
            <span class="text-xs font-bold text-slate-500 block uppercase">Students</span>
            <span class="text-xl font-black text-amber-400 font-mono">{{ studentCount() }}</span>
          </div>
          <div class="bg-slate-900/60 border border-surface-border p-4 rounded-2xl min-w-[120px]">
            <span class="text-xs font-bold text-slate-500 block uppercase">Faculty</span>
            <span class="text-xl font-black text-emerald-400 font-mono">{{ facultyCount() }}</span>
          </div>
        </div>
      </div>

      <!-- Controls Block (Search & Filters) -->
      <div class="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Search bar -->
        <div class="relative flex-1 max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs">🔍</span>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search by name, email, roll number..."
                 class="input-field py-2.5 pl-10 text-xs w-full" />
        </div>

        <!-- Role filter tabs -->
        <div class="flex items-center gap-1.5 bg-slate-900/50 p-1.5 rounded-2xl border border-surface-border">
          <button (click)="roleFilter.set('ALL')" [ngClass]="roleFilter() === 'ALL' ? 'bg-brand-500/20 text-brand-300 font-bold border border-brand-500/20' : 'text-slate-400 border-transparent'" class="px-4 py-1.5 text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer border">All Roles</button>
          <button (click)="roleFilter.set('Student')" [ngClass]="roleFilter() === 'Student' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/20' : 'text-slate-400 border-transparent'" class="px-4 py-1.5 text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer border">Students</button>
          <button (click)="roleFilter.set('Faculty')" [ngClass]="roleFilter() === 'Faculty' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/20' : 'text-slate-400 border-transparent'" class="px-4 py-1.5 text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer border">Faculty</button>
          <button (click)="roleFilter.set('Admin')" [ngClass]="roleFilter() === 'Admin' ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/20' : 'text-slate-400 border-transparent'" class="px-4 py-1.5 text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer border">Admins</button>
        </div>
      </div>

      <!-- Users Grid/Table -->
      <div class="glass-card overflow-hidden">
        <div *ngIf="loading()" class="text-center py-20 space-y-4">
          <div class="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-slate-400 text-xs uppercase tracking-widest font-mono">Loading Identity Indexes...</p>
        </div>

        <div *ngIf="!loading() && filteredUsers().length === 0" class="text-center py-20">
          <span class="text-4xl block mb-3">📂</span>
          <p class="text-slate-400 text-sm font-semibold">No users matched your query.</p>
          <p class="text-slate-500 text-xs mt-1">Try refining your search text or switching filters.</p>
        </div>

        <div *ngIf="!loading() && filteredUsers().length > 0" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-surface-border bg-slate-950/40">
                <th class="py-4 px-6 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">User Identity</th>
                <th class="py-4 px-6 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Role & Credentials</th>
                <th class="py-4 px-6 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Institutional Specs</th>
                <th class="py-4 px-6 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Indexed On</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-border/50">
              <tr *ngFor="let u of filteredUsers()" class="hover:bg-slate-900/20 transition-colors">
                <!-- Name & Email -->
                <td class="py-4.5 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white"
                         [ngStyle]="{'background': getRandomGradient(u.name)}">
                      {{ u.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-white">{{ u.name }}</h4>
                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">{{ u.email }}</p>
                    </div>
                  </div>
                </td>

                <!-- Role Badge -->
                <td class="py-4.5 px-6">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border"
                        [ngClass]="{
                          'bg-amber-500/10 border-amber-500/20 text-amber-400': u.role === 'Student',
                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400': u.role === 'Faculty',
                          'bg-violet-500/10 border-violet-500/20 text-violet-400': u.role === 'Admin'
                        }">
                    {{ u.role.toUpperCase() }}
                  </span>
                </td>

                <!-- Specs -->
                <td class="py-4.5 px-6 font-mono-val">
                  <div *ngIf="u.role === 'Student'" class="space-y-0.5">
                    <p class="text-[11px] text-white font-bold">Roll: {{ u.rollNo || 'N/A' }}</p>
                    <p class="text-[9px] text-slate-400">Sec {{ u.section || 'N/A' }} • Sem {{ u.semester || 'N/A' }}</p>
                  </div>
                  <div *ngIf="u.role === 'Faculty'" class="text-[10px] text-emerald-400 font-bold">
                    Active Lecturer
                  </div>
                  <div *ngIf="u.role === 'Admin'" class="text-[10px] text-violet-400 font-bold">
                    Core Security Officer
                  </div>
                </td>

                <!-- Date -->
                <td class="py-4.5 px-6 text-slate-400 text-[10px] font-mono font-medium">
                  {{ u.createdAt | date:'mediumDate' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  private admin = inject(AdminService);

  readonly users       = signal<UserItem[]>([]);
  readonly loading     = signal(true);
  readonly searchQuery = signal('');
  readonly roleFilter  = signal<'ALL' | 'Student' | 'Faculty' | 'Admin'>('ALL');

  readonly studentCount = computed(() => this.users().filter(u => u.role === 'Student').length);
  readonly facultyCount = computed(() => this.users().filter(u => u.role === 'Faculty').length);

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const role  = this.roleFilter();

    return this.users().filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.rollNo && u.rollNo.toLowerCase().includes(query));

      const matchesRole = role === 'ALL' || u.role === role;

      return matchesSearch && matchesRole;
    });
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.admin.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.users.set(res.data.users);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getRandomGradient(name: string): string {
    const codes = name.split('').map(c => c.charCodeAt(0));
    const sum = codes.reduce((a, b) => a + b, 0);
    const index = sum % 4;

    const gradients = [
      'linear-gradient(135deg, #6366f1, #a855f7)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    ];
    return gradients[index];
  }
}
