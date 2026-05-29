import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NewsletterForm } from '../../../shared/components/newsletter-form/newsletter-form';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, NewsletterForm],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {}
