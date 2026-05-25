// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/pages/navbar/navbar';
import { Player } from './features/podcast/components/player/player';
import { Footer } from './features/layout/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Player, Footer],
  template: `
    <app-navbar />
    <main>
      <router-outlet />
    </main>
    <app-player />
    <app-footer />
  `
})
export class App {}