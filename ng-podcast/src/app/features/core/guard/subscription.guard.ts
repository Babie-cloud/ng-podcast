import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../podcast/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

/** Bloque l'accès créateur tant que l'abonnement Premium n'est pas actif (sauf comptes legacy). */
export const subscriptionGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  await auth.whenAuthHydrated();

  const user = auth.user();
  if (user?.premium || user?.role === 'ADMIN') {
    return true;
  }

  toast.info(
    'Abonnement requis',
    'Enregistrez votre carte bancaire pour accéder à ng-podcast Premium.',
  );
  return router.createUrlTree(['/'], { fragment: 'tarifs' });
};
