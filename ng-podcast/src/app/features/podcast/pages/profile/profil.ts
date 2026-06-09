import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, readApiErrorDetail } from '../../services/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './profil.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profil.scss',
})
export class Profil {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly editMode = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly deleteConfirmation = signal('');

  readonly profileForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(160)]],
    prenom: ['', [Validators.required, Validators.maxLength(120)]],
    name: ['', [Validators.required, Validators.maxLength(120)]],
  });

  displayName(): string {
    const u = this.auth.user();
    if (!u) return 'Créateur';
    const pseudo = u.username?.trim();
    if (pseudo) return pseudo;
    const p = u.prenom?.trim();
    if (p && u.name?.trim()) return `${p} ${u.name.trim()}`;
    if (p) return p;
    const n = u.name?.trim();
    if (n) return n;
    return u.email;
  }

  startEdit(): void {
    const u = this.auth.user();
    if (!u) return;
    this.saveError.set(null);
    this.profileForm.setValue({
      username: u.username ?? '',
      prenom: u.prenom ?? '',
      name: u.name ?? '',
    });
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.saveError.set(null);
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.saveError.set(null);
    this.saving.set(true);
    try {
      await this.auth.updateProfile(this.profileForm.getRawValue());
      this.editMode.set(false);
    } catch (e: unknown) {
      this.saveError.set(readApiErrorDetail(e, "Impossible d'enregistrer les modifications."));
    } finally {
      this.saving.set(false);
    }
  }

  async deleteProfile(): Promise<void> {
    if (this.deleteConfirmation().trim().toUpperCase() !== 'SUPPRIMER') {
      this.deleteError.set('Tapez SUPPRIMER pour confirmer la suppression du compte.');
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await this.auth.deleteAccount();
    } catch (e: unknown) {
      this.deleteError.set(
        readApiErrorDetail(e, 'Impossible de supprimer le compte pour le moment.'),
      );
    } finally {
      this.deleting.set(false);
    }
  }
}
