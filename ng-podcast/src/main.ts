// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';   // ← correspond à "export class App"

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));