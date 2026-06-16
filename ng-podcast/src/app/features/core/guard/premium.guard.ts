import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../podcast/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

export const premiumGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = auth.user();
  if (user?.premium || user?.role === 'ADMIN') {
    return true;
  }

  toast.warning(
    'Premium requis',
    'Le chat et les quotas illimités sont réservés aux abonnés Premium.',
  );
  return router.createUrlTree(['/'], { fragment: 'tarifs' });
};
