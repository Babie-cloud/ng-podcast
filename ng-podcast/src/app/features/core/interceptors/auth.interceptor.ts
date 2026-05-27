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
 * Déconnexion : 401 général ; 403 anonyme après JWT périmé sur routes protégées (/mine, /users/me).
 */
function pathnameFromRequestUrl(fullUrl: string): string {
  const noQuery = fullUrl.split(/[?#]/)[0] ?? '';
  try {
    if (noQuery.startsWith('http://') || noQuery.startsWith('https://')) {
      return new URL(noQuery).pathname;
    }
  } catch {
    /* garder brute */
  }
  if (noQuery.startsWith('/')) {
    return noQuery;
  }
  const slashApi = noQuery.indexOf('/api/');
  if (slashApi >= 0) {
    return noQuery.slice(slashApi);
  }
  return noQuery;
}

const PUBLIC_CATALOG_ROOTS = ['/api/writings', '/api/storytellings', '/api/podcasts'] as const;

/**
 * Lectures publiques du catalogue (listes + détail par id) : pas de Bearer.
 * Évite qu’un JWT périmé fasse tomber la requête en 403 côté Spring alors que la route est permitAll.
 */
function isPublicCatalogRead(req: HttpRequest<unknown>): boolean {
  const m = req.method;
  if (m !== 'GET' && m !== 'HEAD') return false;
  const path = pathnameFromRequestUrl(req.url).replace(/\/+$/, '');
  if (path.includes('/mine')) return false;
  return PUBLIC_CATALOG_ROOTS.some((base) => path === base || path.startsWith(`${base}/`));
}

/** Endpoints auth publics : ne jamais envoyer un vieux Bearer (sinon JwtFilter bloque le POST). */
function isPublicAuthRequest(req: HttpRequest<unknown>): boolean {
  const path = pathnameFromRequestUrl(req.url);
  return (
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/reset-password')
  );
}

function shouldLogoutOnAuthFailure(err: HttpErrorResponse, reqUrl: string): boolean {
  if (shouldSkipUnauthorizedLogout(reqUrl)) return false;
  if (err.status === 401) return true;
  /*
   * Anonymous sur route « authenticated » : Spring peut renvoyer 403 après que le JwtFilter
   * a vidé un JWT périmé (GET). On déconnecte sur /mine et sur /users/me (hydrate).
   */
  if (
    err.status === 403 &&
    (reqUrl.includes('/mine') || reqUrl.includes('/users/me'))
  ) {
    return true;
  }
  return false;
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
    if (!isPlatformBrowser(this.platformId)) {
      return req;
    }
    if (isPublicCatalogRead(req) || isPublicAuthRequest(req)) {
      return req.headers.has('Authorization')
        ? req.clone({ headers: req.headers.delete('Authorization') })
        : req;
    }
    if (req.headers.has('Authorization')) {
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
