// src/app/features/podcast/auth/signin/signin.ts
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})
export class Signin {
  private fb     = new FormBuilder();
  private router = inject(Router);
  readonly auth  = inject(AuthService);

  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  loginForm = this.fb.group({
    name:            ['', Validators.required],
    prenom:          ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword, name, prenom, email } =
      this.loginForm.getRawValue();

    if (password !== confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.auth.register({
        name:     name!,
        prenom:   prenom!,
        email:    email!,
        password: password!
      });
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(
        e?.error?.message ?? 'Erreur lors de l\'inscription.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}