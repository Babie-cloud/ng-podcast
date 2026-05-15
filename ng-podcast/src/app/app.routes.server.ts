// src/app/app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    // Évite les HttpClient/fetch pendant le rendu serveur (CORS / réseau différent du navigateur).
    renderMode: RenderMode.Client,
  },
];