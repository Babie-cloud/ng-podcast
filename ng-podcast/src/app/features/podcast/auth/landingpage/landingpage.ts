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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './landingpage.scss',
})
export class Landingpage implements OnInit {
  readonly store = inject(PodcastStore);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    void this.loadFeaturedPodcasts();
  }

  /** Aperçu du catalogue pour la landing — visible par tous. */
  private async loadFeaturedPodcasts(): Promise<void> {
    await this.auth.whenAuthHydrated();
    await this.store.loadAll();
  }

  /** Accès direct aux zones publiques ; sinon inscription / connexion avec retour. */
  navigate(target: string): void {
    if (this.isPublicBrowsePath(target) || this.auth.isLogged()) {
      void this.router.navigateByUrl(target);
      return;
    }
    void this.router.navigate(['/signup'], {
      queryParams: { returnUrl: target },
    });
  }

  private isPublicBrowsePath(target: string): boolean {
    if (target === '/podcasts' || target === '/podcasts/search') return true;
    if (/^\/podcasts\/[^/]+$/.test(target)) return true;
    return /^\/podcasts\/[^/]+\/episode\/[^/]+$/.test(target);
  }
}
