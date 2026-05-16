import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
})
export class Profil {
  readonly auth = inject(AuthService);

  displayName(): string {
    const u = this.auth.user();
    if (!u) return 'Créateur';
    const pseudo = u.username?.trim();
    if (pseudo) return pseudo;
    const p = u.prenom?.trim();
    if (p && u.name?.trim()) return `${p} ${u.name.trim()}`;
    if (p) return p;
    const n = u.name?.trim();
    if (n) return n;
    return u.email;
  }
}
