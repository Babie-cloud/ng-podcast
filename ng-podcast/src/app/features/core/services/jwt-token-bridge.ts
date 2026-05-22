import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AUTH_JWT_STORAGE_KEY } from '../constants/auth-storage';

/**
 * Évite tout décalage intercepteur VS AuthService :
 * AuthService doit rester hors de la chaîne HttpClient→intercepteurs, donc les deux lisaient jusqu'ici localStorage /
 * mémoire séparément ; l'intercepteur aligne désormais sur ce cache unique.
 */
@Injectable({ providedIn: 'root' })
export class JwtTokenBridge {
  private readonly platformId = inject(PLATFORM_ID);
  /** Source de vérité en navigateur pour le Bearer (prioritaire sur localStorage). */
  private memory: string | null = null;

  /** À appeler tôt depuis AuthService (navigateur) après lecture LS. */
  hydrateFromDisk(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const fromLs = localStorage.getItem(AUTH_JWT_STORAGE_KEY);
    if (fromLs?.trim()) {
      this.memory = fromLs.trim();
      return this.memory;
    }
    const fromSs = sessionStorage.getItem(AUTH_JWT_STORAGE_KEY);
    if (fromSs?.trim()) {
      this.memory = fromSs.trim();
      return this.memory;
    }
    this.memory = null;
    return null;
  }

  /** JWT à envoyer sur les routes API ; jamais d’espace parasite. */
  current(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (this.memory?.trim()) {
      return this.memory.trim();
    }
    const fromLs = localStorage.getItem(AUTH_JWT_STORAGE_KEY)?.trim();
    if (fromLs) {
      this.memory = fromLs;
      return fromLs;
    }
    const fromSs = sessionStorage.getItem(AUTH_JWT_STORAGE_KEY)?.trim();
    this.memory = fromSs ?? null;
    return this.memory;
  }

  remember(token: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const t = token.trim();
    this.memory = t;
    localStorage.setItem(AUTH_JWT_STORAGE_KEY, t);
  }

  wipe(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.memory = null;
    localStorage.removeItem(AUTH_JWT_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_JWT_STORAGE_KEY);
  }
}
