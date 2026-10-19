import { Injectable, inject } from '@angular/core';
import { JwtTokenBridge } from '../services/jwt-token-bridge';
import { authMediaUrl } from '../utils/security.util';

@Injectable({ providedIn: 'root' })
export class MediaUrlService {
  private readonly jwtBridge = inject(JwtTokenBridge);

  withAuth(url: string | null | undefined): string {
    return authMediaUrl(url, this.jwtBridge.current());
  }
}
