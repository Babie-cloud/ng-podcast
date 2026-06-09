import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, readApiErrorDetail } from '../../services/auth.service';

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './resetpassword.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './resetpassword.scss',
})
export class Resetpassword {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly resetForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly confirmMode = signal(Boolean(this.token));
  readonly sent = signal(false);
  readonly done = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly devResetLink = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }

    this.error.set(null);
    this.devResetLink.set(null);
    this.loading.set(true);

    try {
      const res = await this.auth.resetPassword(this.email.value);
      this.sent.set(true);
      if (res.resetToken) {
        this.devResetLink.set(`/resetpassword/confirm?token=${encodeURIComponent(res.resetToken)}`);
      }
    } catch (e: unknown) {
      this.error.set(readApiErrorDetail(e, 'Erreur lors de la réinitialisation.'));
    } finally {
      this.loading.set(false);
    }
  }

  async confirmReset(): Promise<void> {
    if (!this.token) {
      this.error.set('Lien de réinitialisation invalide.');
      return;
    }
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.resetForm.getRawValue();
    if (password !== confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    try {
      await this.auth.confirmResetPassword(this.token, password);
      this.done.set(true);
      setTimeout(() => void this.router.navigate(['/login']), 1400);
    } catch (e: unknown) {
      this.error.set(readApiErrorDetail(e, 'Lien invalide ou expiré.'));
    } finally {
      this.loading.set(false);
    }
  }
}
