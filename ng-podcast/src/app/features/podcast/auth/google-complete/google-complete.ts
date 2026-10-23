import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleSigninButton } from '../google-signin-button/google-signin-button';

@Component({
  selector: 'app-google-complete',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="np-page np-section" style="max-width: 28rem; margin: 4rem auto; text-align: center">
      @if (error()) {
        <div class="np-alert np-alert-danger mb-3">{{ error() }}</div>
        <a routerLink="/login" class="btn-np">Retour à la connexion</a>
      } @else {
        <p class="np-text-muted">Finalisation de la connexion Google…</p>
      }
    </div>
  `,
})
export class GoogleComplete implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim();
    if (!token) {
      this.error.set('Jeton Google manquant. Réessayez la connexion.');
      return;
    }

    try {
      await this.auth.completeSessionFromToken(token);
      const target = GoogleSigninButton.consumeReturnUrl('/dashboard');
      await this.router.navigateByUrl(target);
    } catch {
      this.error.set('Impossible de finaliser la session Google.');
    }
  }
}
