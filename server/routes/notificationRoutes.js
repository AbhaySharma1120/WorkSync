import express from "express";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in user's notifications
router.get("/", protect, getNotifications);

// Mark all as read
// Keep this before /:id route
router.put("/read-all", protect, markAllNotificationsAsRead);

// Mark one as read
router.put("/:id/read", protect, markNotificationAsRead);

// Delete one notification
router.delete("/:id", protect, deleteNotification);

export default router;
