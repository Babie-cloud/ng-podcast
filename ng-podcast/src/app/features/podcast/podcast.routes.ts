// src/app/features/podcast/podcast.routes.ts
import { Routes } from '@angular/router';
import { podcastOwnerGuard } from '../core/guard/podcast-owner.guard';

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
    loadComponent: () =>
      import('./pages/my-podcasts/my-podcasts').then(m => m.MyPodcasts),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/create/create').then(m => m.Create),
  },
  {
    path: ':id/episode/:episodeId',
    loadComponent: () =>
      import('./pages/episode-play/episode-play').then((m) => m.EpisodePlay),
  },
  {
    path: ':id/studio',
    canActivate: [podcastOwnerGuard],
    loadComponent: () =>
      import('./pages/episode-studio/episode-studio').then((m) => m.EpisodeStudio),
  },
  {
    path: ':id/edit',
    canActivate: [podcastOwnerGuard],
    loadComponent: () =>
      import('./pages/podcast-edit/podcast-edit').then(m => m.PodcastEdit),
  },
  {
    path: ':id/publish',
    canActivate: [podcastOwnerGuard],
    loadComponent: () =>
      import('./pages/publish/publish').then(m => m.Publish),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/detail/detail').then(m => m.Detail),
  },
];
