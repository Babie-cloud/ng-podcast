// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './features/core/guard/auth.guard';
import { premiumGuard } from './features/core/guard/premium.guard';
import { subscriptionGuard } from './features/core/guard/subscription.guard';

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
  {
    path: 'resetpassword/confirm',
    loadComponent: () =>
      import('./features/podcast/auth/resetpassword/resetpassword')
        .then(m => m.Resetpassword)
  },

  // ─── Légal / English canonical text (site UI may be localized) ──
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/layout/terms/terms').then((m) => m.TermsPage),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/layout/policy-privacy/policy-privacy').then(
        (m) => m.PrivacyPage,
      ),
  },

  // ─── Search (publique — visible sans connexion) ──────────
  {
    path: 'search',
    loadComponent: () =>
      import('./features/podcast/pages/search/search')
        .then(m => m.Search)
  },

  // ─── Écriture / Storytelling (protégé pour création — fil public dans les enfants) ──
  {
    path: 'writing',
    loadChildren: () =>
      import('./features/podcast/pages/writing/writing.routes').then(
        (m) => m.WRITING_ROUTES
      ),
  },
  {
    path: 'storytelling',
    loadChildren: () =>
      import('./features/podcast/pages/storytelling/storytelling.routes').then(
        (m) => m.STORYTELLING_ROUTES
      ),
  },

  // ─── Tableau de bord (connecté) ──────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard, subscriptionGuard],
    loadComponent: () =>
      import('./features/podcast/pages/dashboard/dashboard')
        .then(m => m.Dashboard),
  },

  {
    path: 'profil',
    canActivate: [authGuard, subscriptionGuard],
    loadComponent: () =>
      import('./features/podcast/pages/profile/profil').then((m) => m.Profil),
  },

  {
    path: 'settings',
    canActivate: [authGuard, subscriptionGuard],
    loadComponent: () =>
      import('./features/podcast/pages/settings/settings-hub').then(
        (m) => m.SettingsHub,
      ),
  },

  // ─── Podcasts : accueil + détail publics ; création / édition gardés dans podcast.routes.ts ───
  {
    path: 'podcasts',
    loadChildren: () =>
      import('./features/podcast/podcast.routes').then((m) => m.PODCAST_ROUTES),
  },

  // ─── Pages d'erreur ───────────────────────────────────────
  {
    path: 'error/not-found',
    loadComponent: () =>
      import('./shared/pages/error-page/error-page').then((m) => m.ErrorPage),
    data: { kind: 'not-found' },
  },
  {
    path: 'error/server',
    loadComponent: () =>
      import('./shared/pages/error-page/error-page').then((m) => m.ErrorPage),
    data: { kind: 'server' },
  },
  {
    path: 'error/unavailable',
    loadComponent: () =>
      import('./shared/pages/error-page/error-page').then((m) => m.ErrorPage),
    data: { kind: 'unavailable' },
  },

  {
    path: 'premium',
    redirectTo: '',
    pathMatch: 'full',
  },

  {
    path: 'chat',
    canActivate: [authGuard, subscriptionGuard, premiumGuard],
    loadComponent: () =>
      import('./features/podcast/pages/chat/chat').then((m) => m.Chat),
  },

  // ─── 404 ─────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/error-page/error-page').then((m) => m.ErrorPage),
    data: { kind: 'not-found' },
  },
];