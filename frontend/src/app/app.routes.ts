import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Root → redirect to login
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ── Public: Login & Signup
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'reset-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
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
