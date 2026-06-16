import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BillingStatus {
  configured: boolean;
  premium: boolean;
  planTier: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  premiumUntil: string | null;
  quota: {
    premium: boolean;
    planTier: string;
    subscriptionStatus: string;
    maxPublishedEpisodesPerPodcast: number;
    maxDraftEpisodesPerPodcast: number;
    maxPublishedWritings: number;
    maxPublishedStorytellings: number;
  };
  pricing: {
    monthlyEur: string;
    yearlyEur: string;
    trialDays: number;
  };
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/billing`;

  getStatus(): Promise<BillingStatus> {
    return firstValueFrom(this.http.get<BillingStatus>(`${this.base}/status`));
  }

  checkout(interval: 'monthly' | 'yearly'): Promise<string> {
    return firstValueFrom(
      this.http.post<{ url: string }>(`${this.base}/checkout`, { interval }),
    ).then((r) => r.url);
  }

  portal(): Promise<string> {
    return firstValueFrom(this.http.post<{ url: string }>(`${this.base}/portal`, {})).then(
      (r) => r.url,
    );
  }
}
