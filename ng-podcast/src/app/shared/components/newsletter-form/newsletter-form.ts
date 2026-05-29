import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../../features/podcast/services/newsletter.service';

@Component({
  selector: 'app-newsletter-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './newsletter-form.html',
})
export class NewsletterForm {
  /** `default` = home/landing layout; `footer` = compact footer layout */
  readonly variant = input<'default' | 'footer'>('default');
  readonly submitLabel = input('Subscribe');
  readonly placeholder = input('votre@email.com');

  private readonly newsletter = inject(NewsletterService);

  readonly email = signal('');
  readonly submitting = signal(false);
  readonly feedback = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  formClass(): string {
    return this.variant() === 'footer' ? 'np-nl-form-footer' : 'np-nl-form';
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.feedback.set(null);

    const value = this.email().trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.feedback.set({ type: 'error', text: 'Veuillez entrer une adresse e-mail valide.' });
      return;
    }

    this.submitting.set(true);
    try {
      const res = await this.newsletter.subscribe(value);
      this.feedback.set({ type: 'success', text: res.message });
      if (!res.alreadySubscribed) {
        this.email.set('');
      }
    } catch (err) {
      this.feedback.set({
        type: 'error',
        text: err instanceof Error ? err.message : 'Impossible de vous inscrire pour le moment.',
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
