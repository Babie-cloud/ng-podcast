// core/store/auth.store.ts  ← créer ce fichier
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _token = signal<string | null>(
    localStorage.getItem('token')
  );

  readonly token      = this._token.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);

  setToken(token: string) {
    localStorage.setItem('token', token);
    this._token.set(token);
  }

  logout() {
    localStorage.removeItem('token');
    this._token.set(null);
  }
}