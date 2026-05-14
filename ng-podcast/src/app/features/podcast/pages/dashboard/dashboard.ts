import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PodcastStore } from '../../store/podcast.store';

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

  ngOnInit(): void {
    void this.store.loadMine();
  }

  displayName(): string {
    const u = this.auth.user();
    if (!u) return 'Créateur';
    return u.username?.trim() ? u.username : u.email;
  }
}
