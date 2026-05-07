import { Routes } from '@angular/router';

export const FACULTY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./faculty-dashboard/faculty-dashboard.component').then(m => m.FacultyDashboardComponent)
  },
  {
    path: 'insights',
    loadComponent: () =>
      import('./faculty-insights/faculty-insights.component').then(m => m.FacultyInsightsComponent)
  }
];
