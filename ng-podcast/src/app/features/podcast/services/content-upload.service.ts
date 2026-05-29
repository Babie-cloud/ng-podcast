import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SSR_API_BASE_URL } from '../../core/tokens/ssr-api-base-url.token';

interface UploadResponse {
  url: string;
}

@Injectable({ providedIn: 'root' })
export class ContentUploadService {
  private readonly http = inject(HttpClient);
  private readonly apiRoot =
    inject(SSR_API_BASE_URL, { optional: true }) ?? environment.apiUrl;

  async uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('image', file);
    const res = await firstValueFrom(
      this.http.post<UploadResponse>(`${this.apiRoot}/files/images`, fd)
    );
    return res.url;
  }
}
