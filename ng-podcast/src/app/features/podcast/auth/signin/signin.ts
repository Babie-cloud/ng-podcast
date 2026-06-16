// src/app/features/podcast/auth/signin/signin.ts
import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService, readApiErrorDetail } from '../../services/auth.service';
import { GoogleSigninButton } from '../google-signin-button/google-signin-button';
import { BillingFlowService, type BillingInterval } from '../../services/billing-flow.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, GoogleSigninButton],
  templateUrl: './signin.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './signin.scss',
})
export class Signin {
  private fb = new FormBuilder();
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private billingFlow = inject(BillingFlowService);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  readonly selectedPlan = signal<BillingInterval>(
    this.billingFlow.parseInterval(this.route.snapshot.queryParamMap.get('plan')),
  );

  loginForm = this.fb.group({
    name: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  planLabel(): string {
    return this.selectedPlan() === 'yearly' ? 'annuel' : 'mensuel';
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword, name, prenom, email } = this.loginForm.getRawValue();

    if (password !== confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.auth.register({
        name: name!,
        prenom: prenom!,
        email: email!,
        password: password!,
      });
      await this.billingFlow.redirectToCheckout(this.selectedPlan());
    } catch (e: unknown) {
      this.error.set(readApiErrorDetail(e, "Erreur lors de l'inscription."));
    } finally {
      this.loading.set(false);
    }
  }

  async onGoogleCredential(idToken: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.googleLogin(idToken);
      if (this.auth.user()?.premium) {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        await this.router.navigateByUrl(returnUrl);
        return;
      }
      await this.billingFlow.redirectToCheckout(this.selectedPlan());
    } catch (e: unknown) {
      this.error.set(readApiErrorDetail(e, 'Connexion Google impossible.'));
    } finally {
      this.loading.set(false);
    }
  }
}
