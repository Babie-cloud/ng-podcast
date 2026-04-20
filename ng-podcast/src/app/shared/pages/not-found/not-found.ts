// src/app/shared/pages/not-found/not-found.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container text-center py-5">
      <h1 class="display-1 fw-bold text-muted">404</h1>
      <p class="lead mb-4">Cette page n'existe pas.</p>
      <a routerLink="/podcasts" class="btn btn-primary">
        Retour aux podcasts
      </a>
    </div>
  `
})
export class NotFound {}