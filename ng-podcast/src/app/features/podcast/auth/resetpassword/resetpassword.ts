import { Component, signal, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './resetpassword.html',
  styleUrl: './resetpassword.scss',
})
export class Resetpassword {
  private readonly auth = inject(AuthService);

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

    this.auth.resetPassword(this.email.value).then(
      () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      (e: unknown) => {
        this.loading.set(false);
        let msg = 'Erreur lors de la réinitialisation.';
        if (
          typeof e === 'object' &&
          e !== null &&
          'error' in e &&
          typeof (e as { error?: { detail?: string } }).error === 'object'
        ) {
          const detail = (e as { error?: { detail?: string } }).error?.detail;
          if (detail) msg = detail;
        }
        this.error.set(msg);
      }
    );
  }
}
