// src/app/shared/components/navbar/navbar.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../features/podcast/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="np-navbar">
      <!-- Brand -->
      <a routerLink="/" class="np-brand me-4">ng-podcast</a>

      <!-- Liens -->
      <div class="d-flex align-items-center gap-1 flex-grow-1">
        <a routerLink="/podcasts"
           routerLinkActive="active"
           class="np-nav-link">
          Podcasts
        </a>
        <a routerLink="/writing"
           routerLinkActive="active"
           class="np-nav-link">
          Écriture
        </a>
        <a routerLink="/storytelling"
           routerLinkActive="active"
           class="np-nav-link">
          Storytelling
        </a>
      </div>

      <!-- Actions droite -->
      <div class="d-flex align-items-center gap-3">

        <!-- Toggle dark/light -->
        <button
          class="np-theme-toggle"
          [class.dark]="theme.isDark()"
          (click)="theme.toggle()"
          [title]="theme.isDark() ? 'Mode clair' : 'Mode sombre'"
        >
          <span class="np-toggle-thumb" [class.dark]="theme.isDark()"></span>
        </button>

        <!-- Icône thème -->
        <span style="font-size:16px">
          {{ theme.isDark() ? '🌙' : '☀️' }}
        </span>

        <!-- Bouton connexion -->
        <a routerLink="/auth/login" class="btn-np-outline">
          Connexion
        </a>

      </div>
    </nav>
  `
})
export class Navbar {
  readonly theme = inject(ThemeService);
}