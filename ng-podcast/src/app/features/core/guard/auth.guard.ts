import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../podcast/services/auth.service';

/** JWT requis pour la route ; redirection login avec `returnUrl` fiable. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenAuthHydrated();

  if (auth.effectiveAccessToken()) return true;

  void router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
