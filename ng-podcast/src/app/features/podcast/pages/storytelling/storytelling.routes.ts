import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guard/auth.guard';

export const STORYTELLING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./storytelling-shell/storytelling-shell').then(
        (m) => m.StorytellingShell
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./storytelling-list/storytelling-list').then(
            (m) => m.StorytellingList
          ),
      },
      {
        path: 'mine',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./storytelling-mine/storytelling-mine').then(
            (m) => m.StorytellingMine
          ),
      },
      {
        path: 'create',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./storytelling-create/storytelling-create').then(
            (m) => m.StorytellingCreate
          ),
      },
      {
        path: ':id/edit',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./storytelling-edit/storytelling-edit').then(
            (m) => m.StorytellingEdit
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./storytelling-detail/storytelling-detail').then(
            (m) => m.StorytellingDetail
          ),
      },
    ],
  },
];
