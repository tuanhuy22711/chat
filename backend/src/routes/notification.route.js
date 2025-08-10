import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Get notifications
router.get("/", protectRoute, getNotifications);

// Get unread count
router.get("/unread-count", protectRoute, getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", protectRoute, markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", protectRoute, markAllAsRead);

// Delete notification
router.delete("/:notificationId", protectRoute, deleteNotification);

export default router;
