// src/app/features/podcast/auth/landingpage/landingpage.ts
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastCard } from '../../components/podcast-card/podcast-card';
import { AuthService } from '../../services/auth.service';
import { NewsletterForm } from '../../../../shared/components/newsletter-form/newsletter-form';
import { BillingService, type BillingStatus } from '../../services/billing.service';
import { BillingFlowService, type BillingInterval } from '../../services/billing-flow.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [RouterLink, PodcastCard, NewsletterForm],
  templateUrl: './landingpage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './landingpage.scss',
})
export class Landingpage implements OnInit {
  readonly store = inject(PodcastStore);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly billing = inject(BillingService);
  private readonly billingFlow = inject(BillingFlowService);
  private readonly toast = inject(ToastService);

  readonly billingStatus = signal<BillingStatus | null>(null);
  readonly billingBusy = signal(false);

  ngOnInit(): void {
    void this.initPage();
  }

  private async initPage(): Promise<void> {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('checkout') === 'success') {
      this.toast.success(
        'Abonnement Premium',
        'Merci ! Votre carte est enregistrée — votre compte sera activé sous peu.',
      );
    }
    if (qp.get('checkout') === 'canceled') {
      this.toast.info(
        'Paiement annulé',
        'Vous pouvez réessayer quand vous voulez. L\'abonnement reste annulable à tout moment.',
      );
    }

    await this.auth.whenAuthHydrated();
    await this.loadFeaturedPodcasts();

    if (this.auth.isLogged()) {
      try {
        this.billingStatus.set(await this.billing.getStatus());
      } catch {
        /* billing optionnel sur la landing */
      }
    }
  }

  private async loadFeaturedPodcasts(): Promise<void> {
    await this.store.loadAll();
  }

  isPremium(): boolean {
    return this.billingStatus()?.premium ?? this.auth.user()?.premium ?? false;
  }

  pricing() {
    return (
      this.billingStatus()?.pricing ?? {
        monthlyEur: '10.95',
        yearlyEur: '75.99',
        trialDays: 30,
      }
    );
  }

  signupQueryParams(interval: BillingInterval): { plan: BillingInterval; returnUrl: string } {
    return { plan: interval, returnUrl: '/dashboard' };
  }

  async startCheckout(interval: BillingInterval): Promise<void> {
    if (!this.auth.isLogged()) {
      await this.router.navigate(['/signup'], { queryParams: this.signupQueryParams(interval) });
      return;
    }
    this.billingBusy.set(true);
    try {
      await this.billingFlow.redirectToCheckout(interval);
    } finally {
      this.billingBusy.set(false);
    }
  }

  async manageSubscription(): Promise<void> {
    this.billingBusy.set(true);
    try {
      await this.billingFlow.openPortal();
    } finally {
      this.billingBusy.set(false);
    }
  }

  navigate(target: string): void {
    if (this.isPublicBrowsePath(target) || this.auth.isLogged()) {
      void this.router.navigateByUrl(target);
      return;
    }
    void this.router.navigate(['/signup'], {
      queryParams: { plan: 'monthly', returnUrl: target },
    });
  }

  private isPublicBrowsePath(target: string): boolean {
    if (target === '/podcasts' || target === '/podcasts/search') return true;
    if (/^\/podcasts\/[^/]+$/.test(target)) return true;
    return /^\/podcasts\/[^/]+\/episode\/[^/]+$/.test(target);
  }
}
