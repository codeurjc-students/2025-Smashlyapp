import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.use(authenticateUser);

router.post("/", NotificationController.createNotification);
router.get("/", NotificationController.getNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/:id/read", NotificationController.markAsRead);
router.patch("/read-all", NotificationController.markAllAsRead);
router.delete("/:id", NotificationController.deleteNotification);

export default router;
