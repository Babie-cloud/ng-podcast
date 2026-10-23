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
            cancel_on_tap_outside?: boolean;
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
          Définissez <code>GOOGLE_CLIENT_ID</code> sur l’API, puis redémarrez / redéployez.
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
          <li>Client OAuth <strong>Web</strong> (même ID que l’API)</li>
          <li>
            <strong>Authorized JavaScript origins</strong> (exact) :
            <code>https://ng-podcast.vercel.app</code>,
            <code>http://localhost:4200</code>,
            <code>http://127.0.0.1:4200</code>
          </li>
        </ol>
      </div>
    } @else {
      <div #buttonHost class="d-flex justify-content-center mb-3"></div>
      @if (popupHint()) {
        <p class="text-center small text-warning mb-0">
          Si rien ne s’ouvre : autorisez les popups pour ce site (icône dans la barre d’adresse),
          ou utilisez Chrome.
        </p>
      }
    }
  `,
})
export class GoogleSigninButton implements AfterViewInit {
  @Input() text: 'signin_with' | 'signup_with' | 'continue_with' = 'continue_with';
  @Output() credential = new EventEmitter<string>();
  @ViewChild('buttonHost') buttonHost?: ElementRef<HTMLElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly publicHttp = new HttpClient(inject(HttpBackend));

  readonly loading = signal(isPlatformBrowser(this.platformId));
  readonly missingConfig = signal(false);
  readonly popupHint = signal(false);
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

    // Mode popup : n’exige PAS de Redirect URI dans Google Cloud
    // (seulement Authorized JavaScript origins). Évite redirect_uri_mismatch.
    window.google?.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response) => {
        if (response.credential) {
          this.credential.emit(response.credential);
          return;
        }
        this.popupHint.set(true);
        this.cdr.detectChanges();
      },
      ux_mode: 'popup',
      cancel_on_tap_outside: true,
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

    // Aide Firefox : après clic, si toujours pas de credential sous 3s
    host.addEventListener(
      'click',
      () => {
        window.setTimeout(() => {
          this.popupHint.set(true);
          this.cdr.detectChanges();
        }, 2500);
      },
      { once: true, capture: true },
    );
  }

  private async resolveClientId(): Promise<string> {
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
