import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WritingStore } from '../../../store/writing.store';

@Component({
  selector: 'app-writing-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './writing-edit.html',
})
export class WritingEdit implements OnInit {
  readonly store = inject(WritingStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly types = ['POEM', 'STORY', 'ESSAY', 'JOURNAL'];
  readonly id = signal<string>('');

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    content: ['', [Validators.required, Validators.minLength(5)]],
    type: ['POEM'],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED'],
  });

  async ngOnInit(): Promise<void> {
    const raw = this.route.snapshot.paramMap.get('id');
    if (!raw) return;
    this.id.set(raw);
    await this.store.loadOne(raw);
    const w = this.store.selected();
    if (!w || w.id !== raw) return;
    this.form.patchValue({
      title: w.title,
      content: w.content,
      type: w.type,
      status: w.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
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
      content: v.content,
      type: v.type,
      status: v.status,
    });
    if (ok) {
      await this.router.navigate(['/writing', rawId]);
    }
  }
}
