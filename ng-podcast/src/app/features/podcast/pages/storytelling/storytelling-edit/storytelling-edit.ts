import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StorytellingStore } from '../../../store/storytelling.store';
import { ContentUploadService } from '../../../services/content-upload.service';

@Component({
  selector: 'app-storytelling-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './storytelling-edit.html',
})
export class StorytellingEdit implements OnInit {
  readonly store = inject(StorytellingStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly uploads = inject(ContentUploadService);

  readonly types = ['TESTIMONY', 'CONFESSION', 'EXPERIENCE', 'ANONYMOUS'];
  readonly id = signal<string>('');
  readonly coverFile = signal<File | null>(null);
  readonly uploadError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    content: [''],
    type: ['TESTIMONY'],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED'],
    anonymous: [false],
    coverUrl: [''],
  });

  async ngOnInit(): Promise<void> {
    const raw = this.route.snapshot.paramMap.get('id');
    if (!raw) return;
    this.id.set(raw);
    await this.store.loadOne(raw);
    const s = this.store.selected();
    if (!s || s.id !== raw) return;
    this.form.patchValue({
      title: s.title,
      content: s.content,
      type: s.type,
      status: s.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      anonymous: s.anonymous,
      coverUrl: s.coverUrl ?? '',
    });
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const rawId = this.id();
    if (!rawId) return;

    const v = this.form.getRawValue();
    let cover = v.coverUrl.trim();
    this.uploadError.set(null);
    if (this.coverFile()) {
      try {
        cover = await this.uploads.uploadImage(this.coverFile()!);
      } catch {
        this.uploadError.set("Impossible d'importer l'image. Vous pouvez essayer avec une URL.");
        return;
      }
    }
    const ok = await this.store.update(rawId, {
      title: v.title,
      content: v.content || '',
      type: v.type,
      status: v.status,
      anonymous: v.anonymous,
      ...(cover !== '' ? { coverUrl: cover } : { coverUrl: undefined }),
    });
    if (ok) {
      await this.router.navigate(['/storytelling', rawId]);
    }
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.coverFile.set(input.files?.[0] ?? null);
    this.uploadError.set(null);
  }
}
