// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './features/core/guard/auth.guard';

export const routes: Routes = [
  // ─── Landing (publique) ─────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/podcast/auth/landingpage/landingpage')
        .then(m => m.Landingpage)
  },

  // ─── Auth (publiques) ────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/podcast/auth/login/login')
        .then(m => m.Login)
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/podcast/auth/signin/signin')
        .then(m => m.Signin)
  },
  {
    path: 'resetpassword',
    loadComponent: () =>
      import('./features/podcast/auth/resetpassword/resetpassword')
        .then(m => m.Resetpassword)
  },

  // ─── Search (publique — visible sans connexion) ──────────
  {
    path: 'search',
    loadComponent: () =>
      import('./features/podcast/pages/search/search')
        .then(m => m.Search)
  },

  // ─── Écriture / Storytelling (protégé — même périmètre que la navbar) ──
  {
    path: 'writing',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/pages/feature-placeholder/feature-placeholder')
        .then(m => m.FeaturePlaceholder),
    data: {
      title: 'Écriture',
      message:
        'L\'interface sera reliée à l\'API /api/writings dans une prochaine étape.',
    },
  },
  {
    path: 'storytelling',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/pages/feature-placeholder/feature-placeholder')
        .then(m => m.FeaturePlaceholder),
    data: {
      title: 'Storytelling',
      message:
        'L\'interface sera reliée à l\'API /api/storytellings dans une prochaine étape.',
    },
  },

  // ─── Podcasts (protégé) ──────────────────────────────────
  {
    path: 'podcasts',
    canActivate: [authGuard],      // 🔒 connexion requise
    loadChildren: () =>
      import('./features/podcast/podcast.routes')
        .then(m => m.PODCAST_ROUTES)
  },

  // ─── 404 ─────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found/not-found')
        .then(m => m.NotFound)
  }
];