export type NotificationType = 
  | 'price_drop'
  | 'comparison_complete'
  | 'recommendation_complete'
  | 'review'
  | 'admin_update'
  | 'new_user'
  | 'new_store';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationFilters {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}
