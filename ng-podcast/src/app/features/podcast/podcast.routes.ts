// features/podcast/podcast.routes.ts
import { Routes } from '@angular/router';

export const PODCAST_ROUTES: Routes = [
  { path: '', loadComponent: () => 
    import('./pages/home/home').then(m => m.Home), 
    title: 'Accueil' 
  },
  { path: 'create', loadComponent: () => 
    import('./pages/create/create').then(m => m.Create), 
    title: 'Créer' 
  },
  { path: 'my-podcasts', loadComponent: () => 
    import('./pages/my-podcasts/my-podcasts').then(m => m.MyPodcasts), 
    title: 'Mes Podcasts' 
  },
  { path: ':id', loadComponent: () => 
    import('./pages/detail/detail').then(m => m.Detail), 
    title: 'Détail' 
  }   // ← en dernier
];