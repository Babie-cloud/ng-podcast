import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {
  readonly toastService = inject(ToastService);

  icon(kind: string): string {
    switch (kind) {
      case 'success':
        return 'fa-circle-check';
      case 'warning':
        return 'fa-triangle-exclamation';
      case 'error':
        return 'fa-circle-xmark';
      default:
        return 'fa-circle-info';
    }
  }
}
