import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();

  // Gate 1: Not authenticated at all
  if (!user) {
    router.navigate(['/login'], { queryParams: { returnUrl: route.url.join('/') } });
    return false;
  }

  // Gate 2: Wrong role for this portal
  const allowedRoles: string[] = route.data?.['roles'] ?? [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleMap: Record<string, string> = {
      Admin: '/admin', Faculty: '/faculty', Student: '/student'
    };
    router.navigate([roleMap[user.role] ?? '/login']);
    return false;
  }

  return true;
};
