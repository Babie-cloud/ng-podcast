// src/app/app.ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Navbar } from './shared/pages/navbar/navbar';
import { Player } from './features/podcast/components/player/player';
import { Footer } from './features/layout/footer/footer';
import { ToastContainer } from './shared/components/toast-container/toast-container';

const AUTH_SHELL_PATHS = ['/signup', '/login', '/resetpassword'] as const;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Player, Footer, ToastContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!authShell()) {
      <app-navbar />
    }
    <main [class.np-main-auth-shell]="authShell()">
      <router-outlet />
    </main>
    @if (!authShell()) {
      <app-player />
      <app-footer />
    }
    <app-toast-container />
  `,
  styles: [`
    .np-main-auth-shell {
      min-height: 100vh;
    }
  `],
})
export class App {
  private readonly router = inject(Router);
  readonly authShell = signal(this.isAuthShell(this.router.url));

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.authShell.set(this.isAuthShell(e.urlAfterRedirects)));
  }

  private isAuthShell(url: string): boolean {
    const path = url.split('?')[0] ?? url;
    return AUTH_SHELL_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  }
}
