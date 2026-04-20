// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Player } from './features/podcast/components/player/player';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, Player],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <a class="navbar-brand" routerLink="/">ng-podcast</a>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto gap-2">
          <li class="nav-item">
            <a class="nav-link" routerLink="/podcasts">Podcasts</a>
          </li>
        </ul>
      </div>
    </nav>

    <main>
      <router-outlet />
    </main>

    <app-player />
  `
})
export class App {}   // ← nom "App" pour correspondre aux imports dans main.ts