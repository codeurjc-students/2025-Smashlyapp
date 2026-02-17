import { supabase } from "../config/supabase";
import { Notification, NotificationType } from "../types/notification";

export class NotificationService {
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, unknown> = {}
  ): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating notification: ${error.message}`);
    }

    return notification;
  }

  static async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching notifications: ${error.message}`);
    }

    return data || [];
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      throw new Error(`Error fetching unread count: ${error.message}`);
    }

    return count || 0;
  }

  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }

    return true;
  }

  static async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select("id");

    if (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }

    return data?.length || 0;
  }

  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error deleting notification: ${error.message}`);
    }

    return true;
  }

  static async createPriceDropNotification(
    userId: string,
    racketName: string,
    oldPrice: number,
    newPrice: number,
    racketId: number
  ): Promise<Notification> {
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    
    return this.createNotification(
      userId,
      "price_drop",
      "¡Precio reducido!",
      `La pala "${racketName}" ha bajdo un ${discount}% (de ${oldPrice}€ a ${newPrice}€)`,
      { racketId, oldPrice, newPrice, discount }
    );
  }

  static async createComparisonCompleteNotification(
    userId: string,
    comparisonId: string
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      "comparison_complete",
      "Comparación completada",
      "Tu comparación de palas está lista. ¡Descúbrela!",
      { comparisonId }
    );
  }

  static async createRecommendationCompleteNotification(
    userId: string,
    formType: "basic" | "advanced"
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      "recommendation_complete",
      "Recomendación lista",
      `Tu recomendación ${formType === "advanced" ? "avanzada" : "básica"} está lista. ¡Descúbrela!`,
      { formType }
    );
  }

  static async createReviewNotification(
    storeOwnerId: string,
    racketName: string,
    rating: number,
    reviewText?: string
  ): Promise<Notification> {
    return this.createNotification(
      storeOwnerId,
      "review",
      "Nueva valoración",
      `Han valorado "${racketName}" con ${rating}/5 estrellas${reviewText ? `: "${reviewText}"` : ""}`,
      { racketName, rating, reviewText }
    );
  }
}
