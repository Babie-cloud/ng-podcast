export type NotificationType = 'NEW_EPISODE' | 'NEW_COMMENT';

export interface Notification {
  id: string;
  type: NotificationType;
  referenceId: string;
  read: boolean;
  createdAt: string;
  message: string;
  podcastId?: string | null;
  contentType?: string | null;
  contentId?: string | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}
