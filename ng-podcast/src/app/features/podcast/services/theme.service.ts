// src/app/core/services/theme.service.ts

import { Injectable, inject, signal, effect, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

/** Thème appliqué sur &lt;html data-theme&gt; */
export type Theme = 'light' | 'dark';
/** Choix utilisateur : suivre l’OS ou forcer un thème */
export type ThemeMode = 'system' | Theme;

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly _mode = signal<ThemeMode>('system');
  private readonly _systemPrefersDark = signal(false);

  /** Mode sélectionné (clair, sombre, ou synchro système). */
  readonly mode = this._mode.asReadonly();

  /** Thème résolu après application du mode + préférence OS si besoin */
  readonly isDark = computed(() => {
    const m = this._mode();
    if (m === 'dark') return true;
    if (m === 'light') return false;
    return this._systemPrefersDark();
  });

  private readonly STORAGE_KEY = 'ng-podcast-theme';

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const win = this.document.defaultView;
    const mq = win?.matchMedia('(prefers-color-scheme: dark)');
    const syncSystem = () => this._systemPrefersDark.set(mq?.matches ?? false);
    syncSystem();
    mq?.addEventListener('change', syncSystem);

    this.initFromStorage();

    effect(() => {
      this.syncDomAndStorage();
    });
  }

  private initFromStorage(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw === 'system' || raw === 'light' || raw === 'dark') {
      this._mode.set(raw);
      return;
    }
    this._mode.set('system');
  }

  private syncDomAndStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const htmlElement = this.document.documentElement;
    const themeAttr: Theme = this.isDark() ? 'dark' : 'light';
    htmlElement.setAttribute('data-theme', themeAttr);
    localStorage.setItem(this.STORAGE_KEY, this._mode());
  }

  /** Basculer vers l’inverse du rendu actuel (passe en clair ou sombre explicites). */
  toggle(): void {
    this._mode.set(this.isDark() ? 'light' : 'dark');
  }

  /** Forcer un thème clair ou sombre */
  setTheme(theme: Theme): void {
    this._mode.set(theme);
  }

  /** Inclut le mode « système » pour les préférences détaillées */
  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
  }
}
