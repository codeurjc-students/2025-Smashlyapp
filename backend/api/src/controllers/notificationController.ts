import { Request, Response } from "express";
import { NotificationService } from "../services/notificationService";
import { AuthRequest } from "../types/user";
import { NotificationType } from "../types/notification";

interface CreateNotificationBody {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export class NotificationController {
  static async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { type, title, message, data } = req.body as CreateNotificationBody;

      console.log('Creating notification:', { userId, type, title, message, data });

      if (!type || !title || !message) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const notification = await NotificationService.createNotification(
        userId,
        type,
        title,
        message,
        data || {}
      );

      console.log('Notification created successfully:', notification);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unreadOnly === "true";

      const notifications = await NotificationService.getNotifications(
        userId,
        limit,
        offset,
        unreadOnly
      );

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const count = await NotificationService.getUnreadCount(userId);

      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await NotificationService.markAsRead(id, userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const count = await NotificationService.markAllAsRead(userId);

      res.json({ success: true, markedCount: count });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await NotificationService.deleteNotification(id, userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
