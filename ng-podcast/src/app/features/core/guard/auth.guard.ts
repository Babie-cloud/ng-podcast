
// ══════════════════════════════════════════════════════════
// src/app/core/guards/auth.guard.ts
// ══════════════════════════════════════════════════════════
// Usage dans les routes :
//   { path: 'podcasts/create', canActivate: [authGuard], ... }
//
import { inject }       from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService }  from '../../podcast/services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  await auth.whenAuthHydrated();

  if (auth.isLogged()) return true;

  router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
  return false;
};