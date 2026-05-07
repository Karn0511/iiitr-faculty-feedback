import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * noAuthGuard — Prevents logged-in users from accessing public auth pages
 * (login, signup). If the user is already authenticated, redirect them
 * straight to their role-based dashboard.
 */
export const noAuthGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();

  if (user) {
    // Already logged in — send to their home dashboard
    const roleMap: Record<string, string> = {
      Admin:   '/admin',
      Faculty: '/faculty',
      Student: '/student',
    };
    router.navigate([roleMap[user.role] ?? '/login']);
    return false;
  }

  return true;
};
