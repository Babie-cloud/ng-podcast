import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { JwtAuthInterceptor } from './features/core/interceptors/auth.interceptor';
import { JwtTokenBridge } from './features/core/services/jwt-token-bridge';
import { routes } from './app.routes';

/** Hydrate le JWT depuis le stockage avant les guards / premiers HttpClient. */
function hydrateJwtBridge(bridge: JwtTokenBridge): () => Promise<void> {
  return () => {
    bridge.hydrateFromDisk();
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useExisting: JwtAuthInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: hydrateJwtBridge,
      deps: [JwtTokenBridge],
      multi: true,
    },
  ],
};
