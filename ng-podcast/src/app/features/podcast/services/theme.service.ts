// src/app/core/services/theme.service.ts

import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  // Signal réactif pour le thème actuel
  private readonly _isDark = signal<boolean>(false);

  // Expositions en lecture seule (utilisées dans tes composants)
  readonly isDark = this._isDark.asReadonly();

  private readonly STORAGE_KEY = 'ng-podcast-theme';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initTheme();

      // Effet qui applique le thème dès que le signal change
      effect(() => {
        this.applyTheme(this._isDark());
      });
    }
  }

  private initTheme(): void {
    // 1. Récupérer la préférence sauvegardée
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme | null;

    let shouldBeDark = false;

    if (savedTheme) {
      shouldBeDark = savedTheme === 'dark';
    } else {
      // 2. Sinon, suivre la préférence système (prefers-color-scheme)
      shouldBeDark = this.document.defaultView
        ?.matchMedia('(prefers-color-scheme: dark)')
        .matches ?? false;
    }

    this._isDark.set(shouldBeDark);
  }

  private applyTheme(isDark: boolean): void {
    const htmlElement = this.document.documentElement;

    if (isDark) {
      htmlElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    } else {
      htmlElement.removeAttribute('data-theme');
      localStorage.setItem(this.STORAGE_KEY, 'light');
    }
  }

  /** Bascule entre light et dark */
  toggle(): void {
    this._isDark.update(current => !current);
  }

  /** Force un thème spécifique */
  setTheme(theme: Theme): void {
    this._isDark.set(theme === 'dark');
  }
}