import { Injectable, inject } from '@angular/core';
import { BillingService } from './billing.service';
import { ToastService } from '../../../shared/services/toast.service';
import { assertStripeRedirectUrl } from '../../core/utils/security.util';

export type BillingInterval = 'monthly' | 'yearly';

@Injectable({ providedIn: 'root' })
export class BillingFlowService {
  private readonly billing = inject(BillingService);
  private readonly toast = inject(ToastService);

  parseInterval(value: string | null | undefined): BillingInterval {
    return value === 'yearly' ? 'yearly' : 'monthly';
  }

  async redirectToCheckout(interval: BillingInterval): Promise<boolean> {
    try {
      const url = assertStripeRedirectUrl(await this.billing.checkout(interval));
      window.location.href = url;
      return true;
    } catch {
      this.toast.error(
        'Paiement indisponible',
        'Enregistrez votre carte bancaire pour activer Premium. Réessayez dans un instant.',
      );
      return false;
    }
  }

  async openPortal(): Promise<boolean> {
    try {
      const url = assertStripeRedirectUrl(await this.billing.portal());
      window.location.href = url;
      return true;
    } catch {
      this.toast.error('Portail Stripe', 'Aucun abonnement actif trouvé.');
      return false;
    }
  }
}
