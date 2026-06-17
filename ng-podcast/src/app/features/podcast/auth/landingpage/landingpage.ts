// src/app/features/podcast/auth/landingpage/landingpage.ts
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { PodcastStore } from '../../store/podcast.store';
import { PodcastCard } from '../../components/podcast-card/podcast-card';
import { AuthService } from '../../services/auth.service';
import { NewsletterForm } from '../../../../shared/components/newsletter-form/newsletter-form';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [RouterLink, PodcastCard, NewsletterForm],
  templateUrl: './landingpage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './landingpage.scss',
})
export class Landingpage implements OnInit {
  readonly store = inject(PodcastStore);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.loadFeaturedPodcasts();
  }

  private async loadFeaturedPodcasts(): Promise<void> {
    await this.auth.whenAuthHydrated();
    await this.store.loadAll();
  }

  navigate(target: string): void {
    void this.router.navigateByUrl(target);
  }
}
