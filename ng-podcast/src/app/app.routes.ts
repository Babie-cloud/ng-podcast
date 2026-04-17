// features/podcast/podcast.routes.ts
import { Routes } from '@angular/router';

export const PODCAST_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/podcast/pages/home/home').then(m => m.Home)
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./features/podcast/pages/create/create').then(m => m.Create)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/podcast/pages/detail/detail').then(m => m.Detail)
  },
  {
    path: 'my-podcasts',
    loadComponent: () =>
      import('./features/podcast/pages/my-podcasts/my-podcasts').then(m => m.MyPodcasts)
  }, 
  
];