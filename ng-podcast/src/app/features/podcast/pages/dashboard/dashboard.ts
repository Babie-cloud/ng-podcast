import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PodcastStore } from '../../store/podcast.store';
import { WritingStore } from '../../store/writing.store';
import { StorytellingStore } from '../../store/storytelling.store';
import { BillingService, type BillingStatus } from '../../services/billing.service';
import { BillingFlowService } from '../../services/billing-flow.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  readonly auth = inject(AuthService);
  readonly store = inject(PodcastStore);
  readonly writings = inject(WritingStore);
  readonly stories = inject(StorytellingStore);
  private readonly billing = inject(BillingService);
  private readonly billingFlow = inject(BillingFlowService);

  readonly billingStatus = signal<BillingStatus | null>(null);
  readonly billingBusy = signal(false);
  readonly verificationSending = signal(false);
  readonly verificationMessage = signal<string | null>(null);

  ngOnInit(): void {
    void Promise.all([
      this.store.loadMine(),
      this.writings.loadMine(),
      this.stories.loadMine(),
      this.loadBilling(),
    ]);
  }

  private async loadBilling(): Promise<void> {
    try {
      const status = await this.billing.getStatus();
      this.billingStatus.set(status);
      this.auth.updatePremiumFlags(status.premium, status.planTier);
    } catch {
      /* billing optionnel */
    }
  }

  isPremium(): boolean {
    return this.billingStatus()?.premium ?? this.auth.user()?.premium ?? false;
  }

  isStripeSubscriber(): boolean {
    const s = this.billingStatus();
    if (!s) return false;
    return !s.legacyPremium && s.subscriptionStatus !== 'NONE';
  }

  subscriptionLabel(): string {
    const s = this.billingStatus();
    if (!s) return 'Premium';
    if (s.legacyPremium) return 'Membre fondateur';
    if (s.subscriptionStatus === 'TRIALING') return 'Essai Premium';
    if (s.subscriptionStatus === 'ACTIVE') return 'Abonné Premium';
    return 'Premium';
  }

  async manageSubscription(): Promise<void> {
    this.billingBusy.set(true);
    try {
      await this.billingFlow.openPortal();
    } finally {
      this.billingBusy.set(false);
    }
  }

  displayName(): string {
    const u = this.auth.user();
    if (!u) return 'Créateur';
    const pseudo = u.username?.trim();
    if (pseudo) return pseudo;
    const p = u.prenom?.trim();
    if (p) return p;
    const n = u.name?.trim();
    if (n) return n;
    return u.email;
  }

  async resendVerificationEmail(): Promise<void> {
    const email = this.auth.user()?.email;
    if (!email || this.verificationSending()) return;

    this.verificationSending.set(true);
    this.verificationMessage.set(null);

    try {
      await this.auth.resendVerification(email);
      this.verificationMessage.set('Email de confirmation envoyé. Vérifiez votre boîte mail.');
    } catch {
      this.verificationMessage.set('Impossible d’envoyer le mail pour le moment.');
    } finally {
      this.verificationSending.set(false);
    }
  }
}
