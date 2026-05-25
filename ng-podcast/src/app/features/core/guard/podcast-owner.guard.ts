import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../podcast/services/auth.service';
import { PodcastService } from '../../podcast/services/podcast.service';

/** Le podcast (`:id`) doit exister et appartenir à l’utilisateur connecté ; sinon redirection. */
export const podcastOwnerGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const podcasts = inject(PodcastService);
  const id = route.paramMap.get('id');
  if (!id) {
    void router.navigate(['/podcasts']);
    return false;
  }
  await auth.whenAuthHydrated();
  const user = auth.user();
  if (!user) {
    void router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  try {
    const podcast = await podcasts.getById(id);
    if (podcast.authorId !== user.id) {
      void router.navigate(['/podcasts', id]);
      return false;
    }
    return true;
  } catch {
    void router.navigate(['/podcasts']);
    return false;
  }
};
