import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./admin-users/admin-users.component').then(m => m.AdminUsersComponent)
  },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./admin-sessions/admin-sessions.component').then(m => m.AdminSessionsComponent)
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./admin-analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent)
  }
];
