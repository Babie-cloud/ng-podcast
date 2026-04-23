// src/app/features/podcast/podcast.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../core/guard/auth.guard';

export const PODCAST_ROUTES: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then(m => m.Home),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search/search').then(m => m.Search),
  },
  {
    path: 'mine',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/my-podcasts/my-podcasts').then(m => m.MyPodcasts),
  },
  {
    path: 'create',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/create/create').then(m => m.Create),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/detail/detail').then(m => m.Detail),
  },
  {
    path: ':id/publish',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/publish/publish').then(m => m.Publish),
  },
];