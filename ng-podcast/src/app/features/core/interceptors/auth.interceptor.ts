import { isPlatformBrowser } from '@angular/common';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable, Injector, PLATFORM_ID } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SKIP_UNAUTHORIZED_LOGOUT_SEGMENTS } from '../constants/auth-http.constants';
import { AUTH_JWT_STORAGE_KEY } from '../constants/auth-storage';
import { AuthService } from '../../podcast/services/auth.service';
import { JwtTokenBridge } from '../services/jwt-token-bridge';

function normalizeBearer(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  return t.replace(/^Bearer\s+/i, '').trim();
}

function shouldSkipUnauthorizedLogout(reqUrl: string): boolean {
  return SKIP_UNAUTHORIZED_LOGOUT_SEGMENTS.some((s) => reqUrl.includes(s));
}

/**
 * Déconnexion : 401 général ; 403 uniquement pour les sous-ressources `.../mine` où un jeton périmé
 * est ignoré côté filtre JWT (requête anonyme) et Spring renvoie alors 403.
 */
function shouldLogoutOnAuthFailure(err: HttpErrorResponse, reqUrl: string): boolean {
  if (shouldSkipUnauthorizedLogout(reqUrl)) return false;
  if (err.status === 401) return true;
  return err.status === 403 && reqUrl.includes('/mine');
}

/**
 * 1) Ajoute `Authorization: Bearer <jwt>` sur chaque requête HttpClient (navigateur).
 * 2) Déconnexion sur erreurs d’auth (voir `shouldLogoutOnAuthFailure`) — sauf login / inscription / reset.
 */
@Injectable({ providedIn: 'root' })
export class JwtAuthInterceptor implements HttpInterceptor {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly bridge = inject(JwtTokenBridge);
  private readonly injector = inject(Injector);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(req);
    }

    const authReq = this.withBearerIfNeeded(req);

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && shouldLogoutOnAuthFailure(err, authReq.url)) {
          this.clearSessionQuietly();
        }
        return throwError(() => err);
      }),
    );
  }

  private withBearerIfNeeded(req: HttpRequest<unknown>): HttpRequest<unknown> {
    if (!isPlatformBrowser(this.platformId) || req.headers.has('Authorization')) {
      return req;
    }
    let token = normalizeBearer(this.bridge.current() ?? '');
    if (!token && typeof localStorage !== 'undefined') {
      token = normalizeBearer(localStorage.getItem(AUTH_JWT_STORAGE_KEY) ?? '');
    }
    if (!token && typeof sessionStorage !== 'undefined') {
      token = normalizeBearer(sessionStorage.getItem(AUTH_JWT_STORAGE_KEY) ?? '');
      if (token) {
        this.bridge.remember(token);
      }
    }
    if (!token) {
      return req;
    }
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  /** `inject(AuthService)` au constructeur créerait un cycle avec HttpClient. */
  private clearSessionQuietly(): void {
    try {
      this.injector.get(AuthService).logout();
    } catch {
      /* Service pas encore disponible dans de rares cas bootstrap */
      this.bridge.wipe();
    }
  }
}
