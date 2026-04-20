// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../../../features/podcast/store/auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthStore);
  const token = auth.token();

  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  );
};