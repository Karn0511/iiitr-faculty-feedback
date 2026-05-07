import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon:  string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-surface-border"
         style="background: rgba(15,23,42,0.85); backdrop-filter: blur(20px);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          <!-- Logo + Brand -->
          <a routerLink="/" class="flex items-center gap-3 group">
            <div class="w-9 h-9 flex items-center justify-center flex-shrink-0">
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
            <div class="hidden sm:block">
              <p class="text-white font-bold text-sm leading-none">IIIT Ranchi</p>
              <p class="text-slate-400 text-xs leading-none mt-0.5">Feedback System</p>
            </div>
          </a>

          <!-- Nav Links (desktop) -->
          <div *ngIf="isLoggedIn()" class="hidden md:flex items-center gap-1">
            <a *ngFor="let item of navItems()"
               [routerLink]="item.route"
               routerLinkActive="bg-brand-500/15 text-brand-300"
               class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                      text-slate-400 hover:text-white hover:bg-surface-hover transition-all duration-200">
              <span [innerHTML]="item.icon" class="w-4 h-4"></span>
              {{ item.label }}
            </a>
          </div>

          <!-- Right: User Menu -->
          <div class="flex items-center gap-3">

            <!-- Role Badge -->
            <span *ngIf="user()" class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full
                         text-xs font-semibold border"
                  [ngClass]="roleBadgeClass()">
              {{ user()?.role }}
            </span>

            <!-- Avatar + Dropdown -->
            <div *ngIf="isLoggedIn()" class="relative">
              <button (click)="toggleMenu()"
                      class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-hover
                             transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                     style="background: linear-gradient(135deg, #6366f1, #a855f7);">
                  {{ userInitial() }}
                </div>
                <svg class="w-4 h-4 text-slate-400 hidden sm:block transition-transform duration-200"
                     [class.rotate-180]="menuOpen()"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <!-- Dropdown -->
              <div *ngIf="menuOpen()"
                   class="absolute right-0 top-12 w-56 glass-card rounded-2xl border border-surface-border
                          shadow-card py-2 animate-fade-in">
                <div class="px-4 py-3 border-b border-surface-border">
                  <p class="text-white font-semibold text-sm truncate">{{ user()?.name }}</p>
                  <p class="text-slate-400 text-xs truncate">{{ user()?.email }}</p>
                </div>
                <div class="py-1">
                  <button (click)="logout()"
                          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400
                                 hover:bg-rose-500/10 hover:text-rose-300 transition-colors duration-150">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            <!-- Login button (if not logged in) -->
            <a *ngIf="!isLoggedIn()" routerLink="/login" class="btn-primary text-sm px-4 py-2">
              Sign In
            </a>
          </div>

        </div>
      </div>
    </nav>

    <!-- Spacer for fixed navbar -->
    <div class="h-16"></div>
  `
})
export class NavbarComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly user       = this.auth.currentUser;
  readonly menuOpen   = signal(false);

  readonly userInitial = computed(() => {
    const name = this.user()?.name ?? '';
    return name.charAt(0).toUpperCase();
  });

  readonly roleBadgeClass = computed(() => {
    const role = this.user()?.role;
    return {
      'bg-brand-900/60 text-brand-300 border-brand-700/50':   role === 'Admin',
      'bg-emerald-900/60 text-emerald-300 border-emerald-700/50': role === 'Faculty',
      'bg-amber-900/60 text-amber-300 border-amber-700/50':   role === 'Student',
    };
  });

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.user()?.role;
    if (role === 'Admin')   return [
      { label: 'Dashboard', route: '/admin',             icon: '&#9783;' },
      { label: 'Users',     route: '/admin/users',       icon: '&#128101;' },
      { label: 'Sessions',  route: '/admin/sessions',    icon: '&#128197;' },
      { label: 'Analytics', route: '/admin/analytics',   icon: '&#128200;' },
    ];
    if (role === 'Faculty') return [
      { label: 'Dashboard', route: '/faculty',           icon: '&#128202;' },
      { label: 'AI Insights',route: '/faculty/insights', icon: '&#129302;' },
    ];
    if (role === 'Student') return [
      { label: 'My Courses', route: '/student',          icon: '&#128218;' },
      { label: 'Status',     route: '/student/status',   icon: '&#9989;' },
    ];
    return [];
  });

  toggleMenu() { this.menuOpen.update(v => !v); }

  logout() {
    this.menuOpen.set(false);
    this.auth.logout();
  }
}
