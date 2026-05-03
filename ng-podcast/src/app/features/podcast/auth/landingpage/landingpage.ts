// src/app/features/podcast/auth/landingpage/landingpage.ts
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastCard } from '../../components/podcast-card/podcast-card';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [RouterLink, PodcastCard],
  templateUrl: './landingpage.html',
  styleUrl: './landingpage.scss',
})
export class Landingpage implements OnInit {
  readonly store  = inject(PodcastStore);
  readonly auth   = inject(AuthService);
  private router  = inject(Router);

  ngOnInit(): void {
    this.store.loadAll();
  }

  // ─── Redirige vers login si pas connecté, sinon vers la cible ─
  navigate(target: string): void {
    if (this.auth.isLogged()) {
      this.router.navigate([target]);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: target }
      });
    }
  }
}