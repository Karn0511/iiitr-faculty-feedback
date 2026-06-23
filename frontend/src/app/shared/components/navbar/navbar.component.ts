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
  styles: [`
    :host-context(.theme-academic) {
      nav {
        background: rgba(255, 255, 255, 0.85) !important;
        backdrop-filter: blur(24px) !important;
        border-color: rgba(15, 23, 42, 0.06) !important;
        box-shadow: 0 4px 30px rgba(15, 23, 42, 0.04), 0 1px 4px rgba(15, 23, 42, 0.01) !important;
      }
      .text-white {
        color: #0f172a !important;
      }
      .text-slate-400 {
        color: #475569 !important;
      }
      .hover\:text-white:hover {
        color: #0f172a !important;
      }
      
      /* Navigation links as luxurious interactive glass tabs */
      a.rounded-xl {
        background: rgba(15, 23, 42, 0.02) !important;
        border: 1px solid rgba(15, 23, 42, 0.03) !important;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.01) !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        margin: 0 4px !important;
        
        &:hover {
          color: #0f172a !important;
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.65) 100%) !important;
          border-color: rgba(15, 23, 42, 0.06) !important;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.02) !important;
          transform: translateY(-1.5px) !important;
        }
      }
      
      /* Active tab highlight */
      a[class*="bg-brand-500/15"] {
        color: #4f46e5 !important;
        background: linear-gradient(135deg, #ffffff 0%, rgba(243, 244, 246, 0.9) 100%) !important;
        border-color: rgba(99, 102, 241, 0.15) !important;
        box-shadow: 0 8px 20px rgba(99, 102, 241, 0.08), 0 2px 6px rgba(99, 102, 241, 0.04) !important;
        font-weight: 600 !important;
      }
      
      span[class*="bg-brand-900"] {
        background-color: rgba(99, 102, 241, 0.08) !important;
        color: #4f46e5 !important;
        border-color: rgba(99, 102, 241, 0.2) !important;
      }
      span[class*="bg-emerald-900"] {
        background-color: rgba(16, 185, 129, 0.08) !important;
        color: #059669 !important;
        border-color: rgba(16, 185, 129, 0.2) !important;
      }
      span[class*="bg-amber-900"] {
        background-color: rgba(245, 158, 11, 0.08) !important;
        color: #d97706 !important;
        border-color: rgba(245, 158, 11, 0.2) !important;
      }
      
      .glass-card {
        background: rgba(255, 255, 255, 0.92) !important;
        border-color: rgba(15, 23, 42, 0.08) !important;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08), 0 4px 10px rgba(15, 23, 42, 0.02) !important;
        
        .text-white {
          color: #0f172a !important;
        }
        .text-slate-400 {
          color: #475569 !important;
        }
        .border-b {
          border-color: rgba(15, 23, 42, 0.06) !important;
        }
      }
    }
  `],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-surface-border"
         style="background: rgba(15,23,42,0.85); backdrop-filter: blur(20px);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          <!-- Logo + Brand -->
          <a [routerLink]="homeRoute()" class="flex items-center gap-3 group">
            <div class="w-9 h-9 flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" class="w-8 h-8 object-contain rounded-lg" alt="IIIT Ranchi Logo" />
            </div>
            <div class="hidden sm:block">
              <p class="text-white font-bold text-sm leading-none">IIIT Ranchi</p>
              <p class="text-slate-400 text-[10px] leading-none mt-1">Faculty Feedback System</p>
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
                    <a routerLink="/privacy-settings" (click)="menuOpen.set(false)"
                       class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300
                              hover:bg-surface-hover hover:text-white transition-colors duration-150 cursor-pointer">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      Security & Privacy
                    </a>
                    <button (click)="logout()"
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400
                                   hover:bg-rose-500/10 hover:text-rose-300 transition-colors duration-150 text-left">
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

  readonly homeRoute = computed(() => {
    const role = this.user()?.role;
    if (role === 'Admin') return '/admin';
    if (role === 'Faculty') return '/faculty';
    if (role === 'Student') return '/student';
    return '/login';
  });

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
