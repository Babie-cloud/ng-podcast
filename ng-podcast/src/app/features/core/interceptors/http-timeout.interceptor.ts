import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/** Render free tier + cold start ; au-delà, on libère l’UI (spinner infini). */
const API_TIMEOUT_MS = 25_000;

@Injectable({ providedIn: 'root' })
export class HttpTimeoutInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      timeout(API_TIMEOUT_MS),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 0,
                statusText: 'Gateway Timeout',
                url: req.url,
                error: {
                  detail:
                    'L’API ne répond pas (serveur en veille ou indisponible). Réessayez dans un instant.',
                },
              }),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
