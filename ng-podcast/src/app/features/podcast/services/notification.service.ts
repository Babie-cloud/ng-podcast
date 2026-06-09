import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SSR_API_BASE_URL } from '../../core/tokens/ssr-api-base-url.token';
import {
  Notification,
  NotificationListResponse,
} from '../models/notification.model';
import { AuthService, readApiErrorDetail } from './auth.service';

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiRoot =
    inject(SSR_API_BASE_URL, { optional: true }) ?? environment.apiUrl;
  private readonly base = `${this.apiRoot}/api/notifications`;

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  private readonly _notifications = signal<Notification[]>([]);
  private readonly _unreadCount = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasUnread = computed(() => this._unreadCount() > 0);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    effect(() => {
      if (this.auth.isLogged()) {
        void this.refresh();
        this.startPolling();
      } else {
        this.stopPolling();
        this._notifications.set([]);
        this._unreadCount.set(0);
        this._error.set(null);
      }
    });
  }

  async refresh(): Promise<void> {
    if (!this.auth.isLogged()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<NotificationListResponse>(this.base)
      );
      this.applyResponse(res);
    } catch (err) {
      this._error.set(
        readApiErrorDetail(err, 'Impossible de charger les notifications.')
      );
    } finally {
      this._loading.set(false);
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      const updated = await firstValueFrom(
        this.http.patch<Notification>(`${this.base}/${id}/read`, {})
      );
      this._notifications.update((rows) =>
        rows.map((n) => (n.id === id ? updated : n))
      );
      this._unreadCount.update((c) => Math.max(0, c - (updated.read ? 1 : 0)));
    } catch (err) {
      this._error.set(
        readApiErrorDetail(err, 'Impossible de marquer la notification comme lue.')
      );
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.patch<NotificationListResponse>(`${this.base}/read-all`, {})
      );
      this.applyResponse(res);
    } catch (err) {
      this._error.set(
        readApiErrorDetail(err, 'Impossible de marquer toutes les notifications comme lues.')
      );
    }
  }

  notificationRoute(n: Notification): string[] | null {
    if (n.type === 'NEW_EPISODE' && n.podcastId) {
      return ['/podcasts', n.podcastId, 'episode', n.referenceId];
    }
    if (n.type === 'NEW_COMMENT' && n.contentType && n.contentId) {
      switch (n.contentType) {
        case 'PODCAST':
          return ['/podcasts', n.contentId];
        case 'WRITING':
          return ['/writing', n.contentId];
        case 'STORYTELLING':
          return ['/storytelling', n.contentId];
      }
    }
    return null;
  }

  startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      void this.refresh();
    }, POLL_INTERVAL_MS);
  }

  stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private applyResponse(res: NotificationListResponse): void {
    this._notifications.set(res.notifications ?? []);
    this._unreadCount.set(res.unreadCount ?? 0);
  }
}
