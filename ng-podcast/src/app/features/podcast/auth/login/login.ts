// src/app/features/podcast/auth/login/login.ts
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService, readApiErrorDetail } from '../../services/auth.service';
import { GoogleSigninButton } from '../google-signin-button/google-signin-button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, GoogleSigninButton],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb      = new FormBuilder();
  private router  = inject(Router);
  readonly auth   = inject(AuthService);

  showPassword = false;
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);
  readonly info    = signal<string | null>(null);

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.auth.login({ email: email!, password: password! });

      await this.router.navigateByUrl(this.returnUrl());

    } catch (e: unknown) {
      this.error.set(readApiErrorDetail(e, 'Email ou mot de passe incorrect.'));
    } finally {
      this.loading.set(false);
    }
  }

  async onGoogleCredential(idToken: string): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      await this.auth.googleLogin(idToken);
      await this.router.navigateByUrl(this.returnUrl());
    } catch (e: unknown) {
      this.error.set(readApiErrorDetail(e, 'Connexion Google impossible.'));
    } finally {
      this.loading.set(false);
    }
  }

  private returnUrl(): string {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === '1') {
      this.info.set('Email confirmé, vous pouvez vous connecter.');
    }
    return params.get('returnUrl') ?? '/dashboard';
  }
}