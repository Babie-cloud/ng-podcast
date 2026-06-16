import { Injectable, signal } from '@angular/core';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
  durationMs: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  show(kind: ToastKind, title: string, detail?: string, durationMs = 6000): void {
    const id = ++this.seq;
    const toast: ToastMessage = { id, kind, title, detail, durationMs };
    this.toasts.update((list) => [...list, toast]);
    if (durationMs > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  info(title: string, detail?: string): void {
    this.show('info', title, detail);
  }

  success(title: string, detail?: string): void {
    this.show('success', title, detail);
  }

  warning(title: string, detail?: string): void {
    this.show('warning', title, detail, 8000);
  }

  error(title: string, detail?: string): void {
    this.show('error', title, detail, 9000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
