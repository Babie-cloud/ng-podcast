import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SSR_API_BASE_URL } from '../../core/tokens/ssr-api-base-url.token';
import { readApiErrorDetail } from './auth.service';

export interface NewsletterSubscribeResponse {
  message: string;
  alreadySubscribed: boolean;
}

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private readonly publicHttp = new HttpClient(inject(HttpBackend));
  private readonly apiRoot =
    inject(SSR_API_BASE_URL, { optional: true }) ?? environment.apiUrl;

  async subscribe(email: string): Promise<NewsletterSubscribeResponse> {
    const trimmed = email.trim();
    try {
      return await firstValueFrom(
        this.publicHttp.post<NewsletterSubscribeResponse>(
          `${this.apiRoot}/api/newsletter/subscribe`,
          { email: trimmed }
        )
      );
    } catch (err) {
      throw new Error(readApiErrorDetail(err, 'Impossible de vous inscrire pour le moment.'));
    }
  }
}
