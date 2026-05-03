// src/app/features/podcast/services/auth.service.ts
import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

export interface AuthUser {
  id:       string;
  email:    string;
  username: string;
  role:     'USER' | 'ADMIN';
}

interface LoginPayload    { email: string; password: string; }
interface RegisterPayload {
  name:     string;
  prenom:   string;
  email:    string;
  password: string;
}
interface AuthResponse {
  token: string;
  user:  AuthUser;
}

const TOKEN_KEY = 'np_jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router     = inject(Router);
  private readonly base       = `${environment.apiUrl}/auth`;

  // ─── State ────────────────────────────────────────────────
  private readonly _user    = signal<AuthUser | null>(null);
  private readonly _token   = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);

  readonly user     = this._user.asReadonly();
  readonly token    = this._token.asReadonly();
  readonly loading  = this._loading.asReadonly();
  readonly error    = this._error.asReadonly();
  readonly isLogged = computed(() => !!this._token());
  readonly isAdmin  = computed(() => this._user()?.role === 'ADMIN');

  constructor() {
    // Rehydrate token au démarrage
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        this._token.set(stored);
        // Récupère le profil sans bloquer
        this.fetchMe().catch(() => this.logout());
      }
    }
  }

  // ─── Login → POST /auth/login ─────────────────────────────
  async login(payload: LoginPayload): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.base}/login`, payload)
      );
      this.saveSession(res);
    } catch (e: any) {
      const msg = e?.error?.message ?? 'Email ou mot de passe incorrect.';
      this._error.set(msg);
      throw e;
    } finally {
      this._loading.set(false);
    }
  }

  // ─── Register → POST /auth/register ──────────────────────
  async register(payload: RegisterPayload): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.base}/register`, payload)
      );
      this.saveSession(res);
    } catch (e: any) {
      const msg = e?.error?.message ?? 'Erreur lors de l\'inscription.';
      this._error.set(msg);
      throw e;
    } finally {
      this._loading.set(false);
    }
  }

  // ─── Reset password → POST /auth/reset-password ──────────
  async resetPassword(email: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.base}/reset-password`, { email })
      );
    } catch (e: any) {
      this._error.set(e?.error?.message ?? 'Erreur lors de la réinitialisation.');
      throw e;
    } finally {
      this._loading.set(false);
    }
  }

  // ─── GET /users/me ────────────────────────────────────────
  async fetchMe(): Promise<void> {
    const user = await firstValueFrom(
      this.http.get<AuthUser>(`${environment.apiUrl}/users/me`)
    );
    this._user.set(user);
  }

  // ─── Logout ───────────────────────────────────────────────
  logout(): void {
    this._token.set(null);
    this._user.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.router.navigate(['/']);
  }

  // ─── Interne ──────────────────────────────────────────────
  private saveSession(res: AuthResponse): void {
    this._token.set(res.token);
    this._user.set(res.user);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
  }
}