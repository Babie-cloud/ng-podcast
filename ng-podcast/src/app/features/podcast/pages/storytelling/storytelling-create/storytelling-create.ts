import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StorytellingStore } from '../../../store/storytelling.store';

@Component({
  selector: 'app-storytelling-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './storytelling-create.html',
})
export class StorytellingCreate {
  readonly store = inject(StorytellingStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly types = ['TESTIMONY', 'CONFESSION', 'EXPERIENCE', 'ANONYMOUS'];

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    content: [''],
    type: ['TESTIMONY'],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED'],
    anonymous: [false],
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const id = await this.store.create({
      title: v.title,
      content: v.content || '',
      type: v.type,
      status: v.status,
      anonymous: v.anonymous,
    });
    if (id) {
      await this.router.navigate(['/storytelling', id]);
    }
  }
}
