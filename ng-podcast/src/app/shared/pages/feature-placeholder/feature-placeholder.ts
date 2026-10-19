import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './feature-placeholder.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './feature-placeholder.scss',
})
export class FeaturePlaceholder {
  private readonly route = inject(ActivatedRoute);

  readonly title =
    (this.route.snapshot.data['title'] as string | undefined) ?? 'Bientôt disponible';
  readonly message =
    (this.route.snapshot.data['message'] as string | undefined) ??
    'Cette section sera disponible prochainement.';
}
