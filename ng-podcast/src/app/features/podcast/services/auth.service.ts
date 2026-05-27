// src/app/features/podcast/services/auth.service.ts
import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SSR_API_BASE_URL } from '../../core/tokens/ssr-api-base-url.token';
import { JwtTokenBridge } from '../../core/services/jwt-token-bridge';

export interface AuthUser {
  id: string;
  email: string;
  /** Pseudo / nom affiché (≠ identifiant de connexion, qui reste l'email). */
  username: string;
  role: 'USER' | 'ADMIN';
  name?: string;
  prenom?: string;
  emailVerified: boolean;
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

/** Extrait le message exploitable depuis une erreur HTTP (login, profil, etc.). */
export function readApiErrorDetail(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { detail?: unknown; message?: unknown } | null;
    if (body?.detail !== undefined && body.detail !== null && `${body.detail}`.trim() !== '') {
      return String(body.detail);
    }
    if (typeof body?.message === 'string' && body.message) {
      return body.message;
    }
    if (err.message) return err.message;
  }
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router     = inject(Router);
  private readonly jwtBridge  = inject(JwtTokenBridge);
  private readonly apiRoot =
    inject(SSR_API_BASE_URL, { optional: true }) ?? environment.apiUrl;
  private readonly base       = `${this.apiRoot}/auth`;

  // ─── State ────────────────────────────────────────────────
  private readonly _user    = signal<AuthUser | null>(null);
  private readonly _token   = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);

  readonly user     = this._user.asReadonly();
  readonly token    = this._token.asReadonly();
  readonly loading  = this._loading.asReadonly();
  readonly error    = this._error.asReadonly();
  readonly isLogged = computed(() => {
    if (this._token()?.trim()) return true;
    if (!isPlatformBrowser(this.platformId)) return false;
    return !!(this.jwtBridge.current()?.trim());
  });
  readonly isAdmin  = computed(() => this._user()?.role === 'ADMIN');

  /**
   * Jeton pour l’en-tête Authorization : unifie le signal en mémoire et le pont
   * (localStorage). Évite les 403 où le front croit encore connecté sans envoyer Bearer.
   */
  effectiveAccessToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    let fromSignal = this._token()?.trim() ?? '';
    let fromBridge = this.jwtBridge.current()?.trim() ?? '';
    if (fromSignal && !fromBridge) {
      this.jwtBridge.remember(fromSignal);
    } else if (fromBridge && !fromSignal) {
      this._token.set(fromBridge);
      fromSignal = fromBridge;
    }
    const t = fromSignal.trim() || fromBridge.trim();
    return t ? t : null;
  }

  /** Résolu après vérif du JWT stocké (browser) ; évite les appels /mine avec jeton invalide avant logout. */
  private readonly authHydrated: Promise<void>;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      this.authHydrated = Promise.resolve();
      return;
    }
    const stored = this.jwtBridge.hydrateFromDisk();
    if (!stored) {
      this.authHydrated = Promise.resolve();
      return;
    }
    this._token.set(stored);
    this.authHydrated = this.fetchMe()
      .catch(() => this.logout())
      .then(() => undefined);
  }

  /** À attendre depuis authGuard avant toute route protégée (dashboard, etc.). */
  whenAuthHydrated(): Promise<void> {
    return this.authHydrated;
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
    } catch (e: unknown) {
      const msg = readApiErrorDetail(e, 'Email ou mot de passe incorrect.');
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
    } catch (e: unknown) {
      const msg = readApiErrorDetail(e, 'Erreur lors de l\'inscription.');
      this._error.set(msg);
      throw e;
    } finally {
      this._loading.set(false);
    }
  }

  // ─── Google Identity Services → POST /auth/google ─────────
  async googleLogin(idToken: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.base}/google`, { idToken })
      );
      this.saveSession(res);
    } catch (e: unknown) {
      const msg = readApiErrorDetail(e, 'Connexion Google impossible.');
      this._error.set(msg);
      throw e;
    } finally {
      this._loading.set(false);
    }
  }

  async resendVerification(email: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${this.base}/resend-verification`, { email })
    );
  }

  // ─── Reset password → POST /auth/reset-password ──────────
  async resetPassword(email: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.base}/reset-password`, { email })
      );
    } catch (e: unknown) {
      const msg = readApiErrorDetail(e, 'Erreur lors de la réinitialisation.');
      this._error.set(msg);
      throw e;
    } finally {
      this._loading.set(false);
    }
  }

  // ─── GET /users/me ────────────────────────────────────────
  async fetchMe(): Promise<void> {
    const user = await firstValueFrom(
      this.http.get<AuthUser>(`${this.apiRoot}/users/me`)
    );
    this._user.set(user);
  }

  /** PATCH /users/me — pseudo public + nom légal (email inchangé ici). */
  async updateProfile(body: {
    username: string;
    prenom: string;
    name: string;
  }): Promise<void> {
    const user = await firstValueFrom(
      this.http.patch<AuthUser>(`${this.apiRoot}/users/me`, body)
    );
    this._user.set(user);
  }

  // ─── Logout ───────────────────────────────────────────────
  logout(): void {
    this._token.set(null);
    this._user.set(null);
    this.jwtBridge.wipe();
    this.router.navigate(['/']);
  }

  // ─── Interne ──────────────────────────────────────────────
  private saveSession(res: AuthResponse): void {
    this._token.set(res.token);
    this._user.set(res.user);
    this.jwtBridge.remember(res.token);
  }
}