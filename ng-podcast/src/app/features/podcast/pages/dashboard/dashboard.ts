import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PodcastStore } from '../../store/podcast.store';
import { WritingStore } from '../../store/writing.store';
import { StorytellingStore } from '../../store/storytelling.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  readonly auth = inject(AuthService);
  readonly store = inject(PodcastStore);
  readonly writings = inject(WritingStore);
  readonly stories = inject(StorytellingStore);
  readonly verificationSending = signal(false);
  readonly verificationMessage = signal<string | null>(null);

  ngOnInit(): void {
    void Promise.all([this.store.loadMine(), this.writings.loadMine(), this.stories.loadMine()]);
  }

  displayName(): string {
    const u = this.auth.user();
    if (!u) return 'Créateur';
    const pseudo = u.username?.trim();
    if (pseudo) return pseudo;
    const p = u.prenom?.trim();
    if (p) return p;
    const n = u.name?.trim();
    if (n) return n;
    return u.email;
  }

  async resendVerificationEmail(): Promise<void> {
    const email = this.auth.user()?.email;
    if (!email || this.verificationSending()) return;

    this.verificationSending.set(true);
    this.verificationMessage.set(null);

    try {
      await this.auth.resendVerification(email);
      this.verificationMessage.set('Email de confirmation envoyé. Vérifiez votre boîte mail.');
    } catch {
      this.verificationMessage.set('Impossible d’envoyer le mail pour le moment.');
    } finally {
      this.verificationSending.set(false);
    }
  }
}
