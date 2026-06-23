import { Routes } from '@angular/router';
import { authGuard }   from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  // Root → smart redirect: dashboard if logged in, login if not
  {
    path: '',
    pathMatch: 'full',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  // ── Public: Login & Signup (blocked for logged-in users)
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'reset-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'privacy-settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/privacy-settings/privacy-settings.component').then(m => m.PrivacySettingsComponent)
  },

  // ── Protected: Admin portal (lazy)
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['Admin'] },
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // ── Protected: Faculty portal (lazy)
  {
    path: 'faculty',
    canActivate: [authGuard],
    data: { roles: ['Faculty'] },
    loadChildren: () =>
      import('./features/faculty/faculty.routes').then(m => m.FACULTY_ROUTES)
  },

  // ── Protected: Student portal (lazy)
  {
    path: 'student',
    canActivate: [authGuard],
    data: { roles: ['Student'] },
    loadChildren: () =>
      import('./features/student/student.routes').then(m => m.STUDENT_ROUTES)
  },

  // ── 404 catch-all
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
