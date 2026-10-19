import { isPlatformBrowser } from '@angular/common';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable, Injector, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { readApiErrorDetail } from '../../podcast/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

const SKIP_ERROR_UI_SEGMENTS = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/api/billing',
  '/api/billing/webhook',
  '/api/musixmatch/config',
  '/api/notifications',
] as const;

const RESOURCE_GET_PATTERN =
  /\/api\/(podcasts|writings|storytellings)\/[0-9a-f-]{36}(\/?$|\?)/i;

function shouldSkipErrorUi(url: string): boolean {
  return SKIP_ERROR_UI_SEGMENTS.some((s) => url.includes(s));
}

function isResourceDetailGet(req: HttpRequest<unknown>): boolean {
  const path = req.url.split('?')[0] ?? req.url;
  return (req.method === 'GET' || req.method === 'HEAD') && RESOURCE_GET_PATTERN.test(path);
}

function isQuotaError(err: HttpErrorResponse): boolean {
  if (err.status === 402) return true;
  const body = err.error as { code?: string; title?: string } | null;
  return body?.code === 'QUOTA_EXCEEDED' || body?.title === 'Quota dépassé';
}

@Injectable({ providedIn: 'root' })
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (
          !isPlatformBrowser(this.platformId) ||
          !(err instanceof HttpErrorResponse) ||
          shouldSkipErrorUi(req.url)
        ) {
          return throwError(() => err);
        }

        const router = this.injector.get(Router);
        const toast = this.injector.get(ToastService);
        const detail = readApiErrorDetail(err, '');

        if (err.status === 0) {
          toast.warning(
            'Connexion impossible',
            detail || 'Le serveur ne répond pas. Vérifiez que l’API est démarrée.',
          );
          return throwError(() => err);
        }

        if (err.status === 502 || err.status === 503 || err.status === 504) {
          toast.warning(
            'Service temporairement indisponible',
            detail || 'Réessayez dans quelques instants.',
          );
          return throwError(() => err);
        }

        if (err.status === 404 && isResourceDetailGet(req)) {
          void router.navigateByUrl('/error/not-found');
          return throwError(() => err);
        }

        if (isQuotaError(err)) {
          toast.warning(
            'Limite du plan gratuit atteinte',
            detail ||
              'Passez à Premium pour publier plus de contenu et accéder au chat.',
          );
          return throwError(() => err);
        }

        if (err.status >= 500) {
          toast.error(
            'Erreur serveur',
            detail || `Le serveur a renvoyé une erreur (${err.status}).`,
          );
          return throwError(() => err);
        }

        if (err.status === 403) {
          toast.warning('Accès refusé', detail || 'Vous n’avez pas les droits pour cette action.');
          return throwError(() => err);
        }

        if (err.status === 401) {
          return throwError(() => err);
        }

        if (err.status >= 400 && detail) {
          toast.error('Action impossible', detail);
        }

        return throwError(() => err);
      }),
    );
  }
}
