import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings-hub',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings-hub.html',
  styleUrl: './settings-hub.scss',
})
export class SettingsHub {}
