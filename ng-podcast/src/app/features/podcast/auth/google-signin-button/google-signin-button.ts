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
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (loading()) {
      <div class="text-center small text-muted mb-3">Chargement Google…</div>
    } @else if (missingConfig()) {
      <div class="np-alert np-alert-warning small mb-3">
        <strong>Connexion Google : configuration requise</strong>
        <p class="mb-2 mt-2">
          Définissez <code>GOOGLE_CLIENT_ID</code> côté API Spring, puis redémarrez le serveur.
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
          <li>Créez un <strong>OAuth 2.0 Client ID</strong> (type Web)</li>
          <li>
            Ajoutez les origines : <code>http://localhost:4200</code> et
            <code>http://127.0.0.1:4200</code>
          </li>
          <li>
            Dans <code>sdk-podcast/mon-api/.env</code> :
            <code>GOOGLE_CLIENT_ID=votre-id.apps.googleusercontent.com</code>
          </li>
        </ol>
      </div>
    } @else {
      <div #buttonHost class="d-flex justify-content-center mb-3"></div>
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
  private clientId = '';

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this.clientId = await this.resolveClientId();
    this.loading.set(false);
    this.missingConfig.set(!this.clientId);
    this.cdr.detectChanges();

    if (this.missingConfig()) return;

    await this.loadScript();
    window.google?.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response) => {
        if (response.credential) this.credential.emit(response.credential);
      },
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

  private async resolveClientId(): Promise<string> {
    const fromEnv = environment.googleClientId?.trim() ?? '';
    if (fromEnv) return fromEnv;

    try {
      const config = await firstValueFrom(
        this.publicHttp.get<AuthPublicConfig>(`${environment.apiUrl}/auth/config`),
      );
      return config.googleClientId?.trim() ?? '';
    } catch {
      return '';
    }
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
