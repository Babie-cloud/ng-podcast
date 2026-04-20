// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [

  // ─── Page principale : redirige vers /podcasts ──────────────
  {
    path: '',
    redirectTo: 'podcasts',
    pathMatch: 'full'
  },

  // ─── Module Podcast ─────────────────────────────────────────
  {
    path: 'podcasts',
    loadChildren: () =>
      import('./features/podcast/podcast.routes')
        .then(m => m.PODCAST_ROUTES)
  },

  // ─── (à venir) Module Écriture ──────────────────────────────
  // {
  //   path: 'writing',
  //   loadChildren: () =>
  //     import('./features/writing/writing.routes')
  //       .then(m => m.WRITING_ROUTES)
  // },

  // ─── (à venir) Module Storytelling ──────────────────────────
  // {
  //   path: 'storytelling',
  //   loadChildren: () =>
  //     import('./features/storytelling/storytelling.routes')
  //       .then(m => m.STORYTELLING_ROUTES)
  // },

  // ─── (à venir) Auth ─────────────────────────────────────────
  // {
  //   path: 'auth',
  //   loadChildren: () =>
  //     import('./features/auth/auth.routes')
  //       .then(m => m.AUTH_ROUTES)
  // },

  // ─── Page 404 ───────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found/not-found')
        .then(m => m.NotFound)
  }
];