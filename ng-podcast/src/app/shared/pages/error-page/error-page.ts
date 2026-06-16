import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

export type ErrorPageKind = 'not-found' | 'server' | 'unavailable';

interface ErrorCopy {
  code: string;
  title: string;
  message: string;
}

const COPY: Record<ErrorPageKind, ErrorCopy> = {
  'not-found': {
    code: '404',
    title: 'Page introuvable',
    message: 'Ce contenu n’existe pas ou a été déplacé.',
  },
  server: {
    code: '500',
    title: 'Erreur serveur',
    message: 'Une erreur interne s’est produite. Réessayez dans quelques instants.',
  },
  unavailable: {
    code: '503',
    title: 'Service indisponible',
    message: 'Le serveur ne répond pas ou vous êtes hors ligne. Vérifiez votre connexion.',
  },
};

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
})
export class ErrorPage {
  private readonly route = inject(ActivatedRoute);

  readonly kind = (this.route.snapshot.data['kind'] as ErrorPageKind) ?? 'not-found';
  readonly copy = COPY[this.kind];
}
