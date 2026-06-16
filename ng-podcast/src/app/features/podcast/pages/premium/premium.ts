import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BillingService, type BillingStatus } from '../../services/billing.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './premium.html',
  styleUrl: './premium.scss',
})
export class Premium implements OnInit {
  private readonly billing = inject(BillingService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly status = signal<BillingStatus | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('success') === '1') {
      this.toast.success('Abonnement Premium', 'Merci ! Votre compte sera mis à jour sous peu.');
    }
    if (qp.get('canceled') === '1') {
      this.toast.info('Paiement annulé', 'Vous pouvez réessayer quand vous voulez.');
    }
    await this.load();
  }

  async load(): Promise<void> {
    this.error.set(null);
    try {
      this.status.set(await this.billing.getStatus());
    } catch {
      this.error.set('Impossible de charger le statut Premium.');
    }
  }

  async checkout(interval: 'monthly' | 'yearly'): Promise<void> {
    this.busy.set(true);
    try {
      const url = await this.billing.checkout(interval);
      window.location.href = url;
    } catch {
      this.toast.error(
        'Stripe indisponible',
        'Configurez STRIPE_SECRET_KEY et les price IDs côté serveur.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  async openPortal(): Promise<void> {
    this.busy.set(true);
    try {
      const url = await this.billing.portal();
      window.location.href = url;
    } catch {
      this.toast.error('Portail Stripe', 'Aucun abonnement actif trouvé.');
    } finally {
      this.busy.set(false);
    }
  }

  isPremium(): boolean {
    return this.status()?.premium ?? this.auth.user()?.premium ?? false;
  }
}
