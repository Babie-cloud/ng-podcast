// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './features/core/guard/auth.guard';
import { guestGuard } from './features/core/guard/guest.guard';
import { premiumGuard } from './features/core/guard/premium.guard';

export const routes: Routes = [
  // ─── Auth (visiteurs uniquement) ───────────────────────────
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/podcast/auth/signin/signin').then((m) => m.Signin),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/podcast/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'resetpassword',
    loadComponent: () =>
      import('./features/podcast/auth/resetpassword/resetpassword').then(
        (m) => m.Resetpassword,
      ),
  },
  {
    path: 'resetpassword/confirm',
    loadComponent: () =>
      import('./features/podcast/auth/resetpassword/resetpassword').then(
        (m) => m.Resetpassword,
      ),
  },

  // ─── Légal (accessible pendant l'inscription) ──────────────
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

  // ─── Toute la plateforme exige un compte ───────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/podcast/auth/landingpage/landingpage').then(
        (m) => m.Landingpage,
      ),
  },
  {
    path: 'search',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/podcast/pages/search/search').then((m) => m.Search),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/podcast/pages/dashboard/dashboard').then(
        (m) => m.Dashboard,
      ),
  },
  {
    path: 'profil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/podcast/pages/profile/profil').then((m) => m.Profil),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/podcast/pages/settings/settings-hub').then(
        (m) => m.SettingsHub,
      ),
  },
  {
    path: 'writing',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/podcast/pages/writing/writing.routes').then(
        (m) => m.WRITING_ROUTES,
      ),
  },
  {
    path: 'storytelling',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/podcast/pages/storytelling/storytelling.routes').then(
        (m) => m.STORYTELLING_ROUTES,
      ),
  },
  {
    path: 'podcasts',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/podcast/podcast.routes').then((m) => m.PODCAST_ROUTES),
  },
  {
    path: 'premium',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'chat',
    canActivate: [authGuard, premiumGuard],
    loadComponent: () =>
      import('./features/podcast/pages/chat/chat').then((m) => m.Chat),
  },

  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/error-page/error-page').then((m) => m.ErrorPage),
    data: { kind: 'not-found' },
  },
];
