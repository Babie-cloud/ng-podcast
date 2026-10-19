import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../podcast/services/auth.service';

/** Routes réservées aux visiteurs non connectés (inscription / connexion). */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenAuthHydrated();

  if (!auth.effectiveAccessToken()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
