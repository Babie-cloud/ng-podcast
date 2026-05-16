import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JwtTokenBridge } from '../services/jwt-token-bridge';

/**
 * Pas d’inject(AuthService) ici → boucle HttpClient ↔ AuthService.
 * Le Bearer vient du {@link JwtTokenBridge}, synchronisé avec AuthService.login / logout.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }
  const bridge = inject(JwtTokenBridge);
  if (req.headers.has('Authorization')) {
    return next(req);
  }
  const token = bridge.current();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
