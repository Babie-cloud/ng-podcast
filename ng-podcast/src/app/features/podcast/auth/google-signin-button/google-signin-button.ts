import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
  PLATFORM_ID,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: 'popup' | 'redirect';
            login_uri?: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | number | boolean>,
          ) => void;
        };
      };
    };
  }
}

interface AuthPublicConfig {
  googleClientId: string;
}

const RETURN_URL_KEY = 'np_google_return_url';

@Component({
  selector: 'app-google-signin-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="text-center small text-muted mb-3">Chargement Google…</div>
    } @else if (missingConfig()) {
      <div class="np-alert np-alert-warning small mb-3">
        <strong>Connexion Google : configuration requise</strong>
        <p class="mb-2 mt-2">
          Définissez <code>GOOGLE_CLIENT_ID</code> sur l’API (Render), puis redéployez.
        </p>
        <ol class="mb-0 ps-3">
          <li>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener"
            >
              Google Cloud Console → Credentials
            </a>
          </li>
          <li>Client OAuth <strong>Web</strong></li>
          <li>
            Origines JS :
            <code>https://ng-podcast.vercel.app</code>,
            <code>http://localhost:4200</code>
          </li>
          <li>
            Redirect URI :
            <code>https://ngpodcast-api.onrender.com/auth/google/callback</code>
          </li>
        </ol>
      </div>
    } @else {
      <div #buttonHost class="d-flex justify-content-center mb-3"></div>
      <p class="text-center small text-muted mb-0">
        Connexion Google via redirection (pas de popup).
      </p>
    }
  `,
})
export class GoogleSigninButton implements AfterViewInit {
  @Input() text: 'signin_with' | 'signup_with' | 'continue_with' = 'continue_with';
  /** Conservé pour compat ; en mode redirect le callback navigateur n’est pas utilisé. */
  @Output() credential = new EventEmitter<string>();
  @ViewChild('buttonHost') buttonHost?: ElementRef<HTMLElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly publicHttp = new HttpClient(inject(HttpBackend));

  readonly loading = signal(isPlatformBrowser(this.platformId));
  readonly missingConfig = signal(false);
  private clientId = '';

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      this.clientId = await this.resolveClientId();
      this.missingConfig.set(!this.clientId);
      if (this.missingConfig()) return;

      await this.loadScript();
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }

    if (this.missingConfig()) return;

    const returnUrl =
      new URLSearchParams(window.location.search).get('returnUrl') ?? '/dashboard';
    try {
      sessionStorage.setItem(RETURN_URL_KEY, returnUrl);
    } catch {
      /* private mode */
    }

    const loginUri = `${environment.apiUrl.replace(/\/$/, '')}/auth/google/callback`;

    window.google?.accounts.id.initialize({
      client_id: this.clientId,
      // Fallback si un navigateur force encore le mode popup.
      callback: (response) => {
        if (response.credential) this.credential.emit(response.credential);
      },
      ux_mode: 'redirect',
      login_uri: loginUri,
    });

    const host = this.buttonHost?.nativeElement;
    if (!host) return;
    window.google?.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: this.text,
      width: 280,
    });
  }

  static consumeReturnUrl(fallback = '/dashboard'): string {
    try {
      const stored = sessionStorage.getItem(RETURN_URL_KEY);
      sessionStorage.removeItem(RETURN_URL_KEY);
      if (stored?.startsWith('/') && !stored.startsWith('//')) return stored;
    } catch {
      /* ignore */
    }
    return fallback;
  }

  private async resolveClientId(): Promise<string> {
    // Toujours préférer la config API (Render) pour rester aligné avec le backend.
    try {
      const config = await firstValueFrom(
        this.publicHttp.get<AuthPublicConfig>(`${environment.apiUrl}/auth/config`),
      );
      const fromApi = config.googleClientId?.trim() ?? '';
      if (fromApi) return fromApi;
    } catch {
      /* API down — fallback env */
    }
    return environment.googleClientId?.trim() ?? '';
  }

  private loadScript(): Promise<void> {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Impossible de charger Google Sign-In.'));
      document.head.appendChild(script);
    });
  }
}
