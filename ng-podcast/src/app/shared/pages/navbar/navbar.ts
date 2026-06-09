// src/app/shared/pages/navbar/navbar.ts
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../features/podcast/services/auth.service';
import { ThemeService } from '../../../features/podcast/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  readonly menuOpen = signal(false);
  readonly profileMenuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.profileMenuOpen.update((o) => !o);
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.closeMenu();
    this.closeProfileMenu();
  }

  /** Identifiant de salutation dans le sous-menu — pseudo affiché, sinon prénom / email. */
  profileTitle(): string {
    const u = this.auth.user();
    if (!u) return '';
    const pseudo = u.username?.trim();
    if (pseudo) return pseudo;
    const p = u.prenom?.trim();
    if (p) return p;
    return u.email;
  }

  @HostListener('document:click', ['$event'])
  onBackdropClose(event: MouseEvent): void {
    if (!this.profileMenuOpen()) return;
    const target = event.target as Node | null;
    const host = this.hostEl.nativeElement;
    if (target && host.contains(target)) return;
    this.profileMenuOpen.set(false);
  }
}
