import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../podcast/services/auth.service';

/**
 * Bearer via {@link AuthService#effectiveAccessToken} pour aligner signal et stockage navigateur.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }
  const auth = inject(AuthService);
  if (req.headers.has('Authorization')) {
    return next(req);
  }
  const token = auth.effectiveAccessToken();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
