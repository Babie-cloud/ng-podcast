import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-writing-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './writing-shell.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './writing-shell.scss',
})
export class WritingShell {}
