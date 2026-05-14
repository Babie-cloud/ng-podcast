// src/app/features/podcast/auth/login/login.ts
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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

      // Redirige vers returnUrl si présent, sinon tableau de bord
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl') ?? '/dashboard';
      this.router.navigateByUrl(returnUrl);

    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Email ou mot de passe incorrect.');
    } finally {
      this.loading.set(false);
    }
  }
}