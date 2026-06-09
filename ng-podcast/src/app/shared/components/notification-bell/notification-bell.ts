import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../../../features/podcast/services/notification.service';
import { Notification } from '../../../features/podcast/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBell {
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  readonly panelOpen = signal(false);

  togglePanel(event: MouseEvent): void {
    event.stopPropagation();
    const opening = !this.panelOpen();
    this.panelOpen.set(opening);
    if (opening) {
      void this.notifications.refresh();
    }
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  async onNotificationClick(n: Notification, event: MouseEvent): Promise<void> {
    event.preventDefault();
    if (!n.read) {
      await this.notifications.markAsRead(n.id);
    }
    const route = this.notifications.notificationRoute(n);
    this.closePanel();
    if (route) {
      void this.router.navigate(route);
    }
  }

  iconFor(type: Notification['type']): string {
    return type === 'NEW_EPISODE'
      ? 'fa-solid fa-podcast'
      : 'fa-solid fa-comment';
  }

  @HostListener('document:click', ['$event'])
  onBackdropClose(event: MouseEvent): void {
    if (!this.panelOpen()) return;
    const target = event.target as Node | null;
    const host = this.hostEl.nativeElement;
    if (target && host.contains(target)) return;
    this.panelOpen.set(false);
  }
}
