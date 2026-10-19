import { Pipe, PipeTransform, inject } from '@angular/core';
import { MediaUrlService } from '../../features/core/services/media-url.service';

@Pipe({
  name: 'authMedia',
  standalone: true,
})
export class AuthMediaPipe implements PipeTransform {
  private readonly mediaUrls = inject(MediaUrlService);

  transform(url: string | null | undefined): string {
    return this.mediaUrls.withAuth(url);
  }
}
