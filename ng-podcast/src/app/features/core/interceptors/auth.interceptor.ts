import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AUTH_JWT_STORAGE_KEY } from '../constants/auth-storage';

/**
 * Ne pas injecter AuthService ici : AuthService → HttpClient → intercepteurs → boucle circulaire.
 * Le jeton est lu depuis localStorage (aligné avec AuthService.login / logout).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }
  const token = localStorage.getItem(AUTH_JWT_STORAGE_KEY);
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
