import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guard/auth.guard';

export const WRITING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./writing-shell/writing-shell').then((m) => m.WritingShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./writing-list/writing-list').then((m) => m.WritingList),
      },
      {
        path: 'mine',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./writing-mine/writing-mine').then((m) => m.WritingMine),
      },
      {
        path: 'create',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./writing-create/writing-create').then((m) => m.WritingCreate),
      },
      {
        path: ':id/edit',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./writing-edit/writing-edit').then((m) => m.WritingEdit),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./writing-detail/writing-detail').then((m) => m.WritingDetail),
      },
    ],
  },
];
