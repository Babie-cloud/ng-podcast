import { Component } from '@angular/core';

@Component({
  selector: 'app-policy-privacy',
  imports: [],
  templateUrl: './policy-privacy.html',
  styleUrl: './policy-privacy.scss',
})
export class PolicyPrivacy {}


import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy-page.html',
  styleUrl: './privacy-page.scss',
})
export class PrivacyPage {}
