import { API_URL } from "../config/api";
import { getAuthToken } from "../utils/authUtils";
import { Notification, NotificationFilters } from "../types/notification";

const NOTIFICATIONS_STORAGE_KEY = "smashly_notifications_cache";
const NOTIFICATIONS_UNREAD_KEY = "smashly_notifications_unread";

export class NotificationService {
  private static saveToLocalStorage(notifications: Notification[]): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error("Error saving notifications to localStorage:", error);
    }
  }

  private static getFromLocalStorage(): Notification[] {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading notifications from localStorage:", error);
      return [];
    }
  }

  private static saveUnreadCount(count: number): void {
    try {
      localStorage.setItem(NOTIFICATIONS_UNREAD_KEY, String(count));
    } catch (error) {
      console.error("Error saving unread count to localStorage:", error);
    }
  }

  private static getUnreadCountFromStorage(): number {
    try {
      const count = localStorage.getItem(NOTIFICATIONS_UNREAD_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error("Error reading unread count from localStorage:", error);
      return 0;
    }
  }

  static async fetchNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    const token = getAuthToken();
    if (!token) {
      return this.getFromLocalStorage();
    }

    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append("limit", String(filters.limit));
      if (filters?.offset) params.append("offset", String(filters.offset));
      if (filters?.unreadOnly) params.append("unreadOnly", "true");

      const queryString = params.toString();
      const url = `${API_URL}/api/v1/notifications${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener las notificaciones");
      }

      const notifications = await response.json();
      this.saveToLocalStorage(notifications);
      return notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return this.getFromLocalStorage();
    }
  }

  static async getUnreadCount(): Promise<number> {
    const token = getAuthToken();
    if (!token) {
      return this.getUnreadCountFromStorage();
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/notifications/unread-count`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener el contador de notificaciones");
      }

      const data = await response.json();
      this.saveUnreadCount(data.count);
      return data.count;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return this.getUnreadCountFromStorage();
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    const token = getAuthToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al marcar la notificación como leída");
      }

      const localNotifications = this.getFromLocalStorage();
      const updatedNotifications = localNotifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      this.saveToLocalStorage(updatedNotifications);

      const currentUnread = this.getUnreadCountFromStorage();
      if (currentUnread > 0) {
        this.saveUnreadCount(currentUnread - 1);
      }

      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  static async markAllAsRead(): Promise<number> {
    const token = getAuthToken();
    if (!token) {
      return 0;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al marcar todas las notificaciones como leídas");
      }

      const data = await response.json();

      const localNotifications = this.getFromLocalStorage();
      const updatedNotifications = localNotifications.map((n) => ({ ...n, is_read: true }));
      this.saveToLocalStorage(updatedNotifications);
      this.saveUnreadCount(0);

      return data.markedCount || 0;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return 0;
    }
  }

  static async createNotification(
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<Notification | null> {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/notifications`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, title, message, data }),
      });

      console.log('Notification response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating notification:', errorData);
        throw new Error("Error al crear la notificación");
      }

      const notification = await response.json();
      console.log('Notification created:', notification);
      
      const localNotifications = this.getFromLocalStorage();
      const updatedNotifications = [notification, ...localNotifications];
      this.saveToLocalStorage(updatedNotifications);
      
      const currentUnread = this.getUnreadCountFromStorage();
      this.saveUnreadCount(currentUnread + 1);

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    const token = getAuthToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la notificación");
      }

      const localNotifications = this.getFromLocalStorage();
      const notificationToDelete = localNotifications.find((n) => n.id === notificationId);
      const updatedNotifications = localNotifications.filter((n) => n.id !== notificationId);
      this.saveToLocalStorage(updatedNotifications);

      if (notificationToDelete && !notificationToDelete.is_read) {
        const currentUnread = this.getUnreadCountFromStorage();
        if (currentUnread > 0) {
          this.saveUnreadCount(currentUnread - 1);
        }
      }

      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  static clearLocalStorage(): void {
    try {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      localStorage.removeItem(NOTIFICATIONS_UNREAD_KEY);
    } catch (error) {
      console.error("Error clearing notification localStorage:", error);
    }
  }
}
