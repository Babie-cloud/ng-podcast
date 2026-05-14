import { InjectionToken } from '@angular/core';

/**
 * URL absolue vers l’API Spring pendant le rendu SSR (HttpClient côté serveur).
 * Dans le navigateur, les services utilisent `environment.apiUrl`.
 */
export const SSR_API_BASE_URL = new InjectionToken<string>('SSR_API_BASE_URL');
