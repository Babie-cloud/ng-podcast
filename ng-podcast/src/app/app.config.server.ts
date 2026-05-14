// src/app/app.config.server.ts

import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { SSR_API_BASE_URL } from './features/core/tokens/ssr-api-base-url.token';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(
      withRoutes(serverRoutes)
    ),
    { provide: SSR_API_BASE_URL, useValue: 'http://127.0.0.1:8080' },
  ]
};

export const AppServerConfig = mergeApplicationConfig(appConfig, serverConfig);