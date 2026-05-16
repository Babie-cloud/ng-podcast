import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../podcast/services/theme.service';
import { AuthService } from '../../podcast/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  readonly profileMenuOpen = signal(false);

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.profileMenuOpen.update((o) => !o);
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.closeProfileMenu();
  }

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
