import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-storytelling-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './storytelling-shell.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './storytelling-shell.scss',
})
export class StorytellingShell {}
