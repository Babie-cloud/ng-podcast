import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StorytellingStore } from '../../../store/storytelling.store';

@Component({
  selector: 'app-storytelling-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './storytelling-edit.html',
})
export class StorytellingEdit implements OnInit {
  readonly store = inject(StorytellingStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly types = ['TESTIMONY', 'CONFESSION', 'EXPERIENCE', 'ANONYMOUS'];
  readonly id = signal<string>('');

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    content: [''],
    type: ['TESTIMONY'],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED'],
    anonymous: [false],
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
    });
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const rawId = this.id();
    if (!rawId) return;

    const v = this.form.getRawValue();
    const ok = await this.store.update(rawId, {
      title: v.title,
      content: v.content || '',
      type: v.type,
      status: v.status,
      anonymous: v.anonymous,
    });
    if (ok) {
      await this.router.navigate(['/storytelling', rawId]);
    }
  }
}
