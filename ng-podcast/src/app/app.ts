// src/app/app.component.ts
import {
  Component,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from './features/podcast/services/theme.service';
import { PodcastStore } from './features/podcast/store/podcast.store';
import { Player } from './features/podcast/components/player/player';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Player],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  
  `,
  styles: [`
    /* ── Navbar ─────────────────────────────────────────── */
    .np-navbar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0 2rem;
      height: 64px;
      background: var(--np-player-bg);
      backdrop-filter: var(--np-blur-strong);
      border-bottom: 1px solid var(--np-border);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .np-brand {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--np-primary-light);
      text-decoration: none;
      letter-spacing: .03em;
      white-space: nowrap;
    }

    .np-nav-links {
      display: flex;
      align-items: center;
      gap: .25rem;
      margin-left: auto;
      flex-wrap: wrap;

      a {
        font-size: 13.5px;
        font-weight: 500;
        color: var(--np-text-muted);
        text-decoration: none;
        padding: .45rem .85rem;
        border-radius: var(--np-radius-sm);
        transition: var(--np-transition);

        &:hover           { color: var(--np-text); background: var(--np-surface); }
        &.np-nav-active   { color: var(--np-primary-light); background: var(--np-primary-soft); }
      }

      .btn-np {
        color: white !important;
        background: var(--np-primary) !important;
        margin-left: .5rem;

        &:hover { background: var(--np-primary-light) !important; }
      }
    }

    /* ── Theme toggle ─────────────────────────────────── */
    .np-theme-toggle {
      background: none;
      border: 1px solid var(--np-border);
      border-radius: var(--np-radius-sm);
      width: 36px;
      height: 36px;
      cursor: pointer;
      font-size: 1rem;
      transition: var(--np-transition);
      flex-shrink: 0;

      &:hover { background: var(--np-surface); }
    }

    /* ── Main layout ──────────────────────────────────── */
    .np-main {
      min-height: calc(100vh - 64px);
    }
    /* Quand le player est visible, on laisse de l'espace en bas */
    .np-main-with-player {
      padding-bottom: 100px;
    }

    /* ── Responsive ───────────────────────────────────── */
    @media (max-width: 640px) {
      .np-navbar { padding: 0 1rem; gap: .75rem; }
      .np-nav-links a:not(.btn-np) { display: none; }
    }
  `],
})
export class App {
  readonly theme = inject(ThemeService);
  readonly store = inject(PodcastStore);
}