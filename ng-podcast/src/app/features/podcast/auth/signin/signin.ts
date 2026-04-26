import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})
export class Signin {
  private fb = new FormBuilder();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loginForm = this.fb.group({
    name: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.loginForm.getRawValue();
    if (password !== confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    // TODO: brancher l'appel réel à l'API d'inscription
    console.log('Signup attempt:', this.loginForm.value);
    this.loading.set(false);
  }
}
