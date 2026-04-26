import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './resetpassword.html',
  styleUrl: './resetpassword.scss',
})
export class Resetpassword {
  readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly sent = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit(): void {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    // TODO: brancher l'appel réel à l'API de reset password
    setTimeout(() => {
      this.loading.set(false);
      this.sent.set(true);
    }, 600);
  }
}
