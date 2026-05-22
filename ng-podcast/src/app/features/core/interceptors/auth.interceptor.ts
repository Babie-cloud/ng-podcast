import { isPlatformBrowser } from '@angular/common';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { AUTH_JWT_STORAGE_KEY } from '../constants/auth-storage';
import { JwtTokenBridge } from '../services/jwt-token-bridge';

function normalizeBearer(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  return t.replace(/^Bearer\s+/i, '').trim();
}

/**
 * Ajoute `Authorization: Bearer <jwt>` sur chaque requête HttpClient (navigateur).
 *
 * Implémenté via {@link HTTP_INTERCEPTORS} + {@link provideHttpClient#withInterceptorsFromDi}
 * pour garantir que la chaîne d’intercepteurs est bien branchée (Angular 21).
 */
@Injectable({ providedIn: 'root' })
export class JwtAuthInterceptor implements HttpInterceptor {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly bridge = inject(JwtTokenBridge);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(req);
    }
    if (req.headers.has('Authorization')) {
      return next.handle(req);
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
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      }),
    );
  }
}
