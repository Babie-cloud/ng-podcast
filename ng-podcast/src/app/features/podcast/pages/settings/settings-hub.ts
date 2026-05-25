import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import type { ThemeMode } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings-hub',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings-hub.html',
  styleUrl: './settings-hub.scss',
})
export class SettingsHub {
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);

  setThemeMode(mode: ThemeMode): void {
    this.theme.setMode(mode);
  }

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

  logout(): void {
    this.auth.logout();
  }
}
