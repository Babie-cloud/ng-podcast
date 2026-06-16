// src/app/app.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/pages/navbar/navbar';
import { Player } from './features/podcast/components/player/player';
import { Footer } from './features/layout/footer/footer';
import { ToastContainer } from './shared/components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Player, Footer, ToastContainer],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-navbar />
    <main>
      <router-outlet />
    </main>
    <app-player />
    <app-footer />
    <app-toast-container />
  `,
})
export class App {}
