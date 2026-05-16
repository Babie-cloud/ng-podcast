import { Component, OnInit, inject } from '@angular/core';
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
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  readonly auth = inject(AuthService);
  readonly store = inject(PodcastStore);
  readonly writings = inject(WritingStore);
  readonly stories = inject(StorytellingStore);

  ngOnInit(): void {
    void Promise.all([
      this.store.loadMine(),
      this.writings.loadMine(),
      this.stories.loadMine(),
    ]);
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

}
