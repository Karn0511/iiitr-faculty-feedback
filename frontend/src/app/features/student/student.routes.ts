import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent)
  },
  {
    path: 'status',
    loadComponent: () =>
      import('./student-status/student-status.component').then(m => m.StudentStatusComponent)
  }
];
