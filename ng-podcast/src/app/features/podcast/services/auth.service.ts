// ══════════════════════════════════════════════════════════
// src/app/core/services/auth.service.ts
// ══════════════════════════════════════════════════════════
import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient }    from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { environment }   from '../../../../environments/environment';

export interface AuthUser {
  id:       string;
  email:    string;
  username: string;
  role:     'USER' | 'ADMIN';
}

interface LoginPayload    { email: string; password: string; }
interface RegisterPayload { email: string; password: string; username: string; }
interface AuthResponse    { token: string; user: AuthUser; }

const TOKEN_KEY = 'np_jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly base       = `${environment.apiUrl}/auth`;

  // ─── État réactif ──────────────────────────────────────────────────────────
  private readonly _user  = signal<AuthUser | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly user      = this._user.asReadonly();
  readonly token     = this._token.asReadonly();
  readonly isLogged  = computed(() => !!this._token());
  readonly isAdmin   = computed(() => this._user()?.role === 'ADMIN');

  constructor() {
    // Rehydrate depuis localStorage au démarrage
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        this._token.set(stored);
        this.fetchMe().catch(() => this.logout());
      }
    }
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(payload: LoginPayload): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.base}/login`, payload)
    );
    this.saveSession(res);
  }

  // ─── Register ────────────────────────────────────────────────────────────
  async register(payload: RegisterPayload): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.base}/register`, payload)
    );
    this.saveSession(res);
  }

  // ─── Récupère le profil depuis l'API (avec le token stocké) ───────────────
  async fetchMe(): Promise<void> {
    const user = await firstValueFrom(
      this.http.get<AuthUser>(`${environment.apiUrl}/users/me`)
    );
    this._user.set(user);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout(): void {
    this._token.set(null);
    this._user.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  // ─── Utilitaire interne ────────────────────────────────────────────────────
  private saveSession(res: AuthResponse): void {
    this._token.set(res.token);
    this._user.set(res.user);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
  }
}

