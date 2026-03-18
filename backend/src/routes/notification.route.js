import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  listNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, listNotifications);
router.post("/:id/read", protectRoute, markNotificationRead);
router.post("/:id/unread", protectRoute, markNotificationUnread);
router.post("/read-all", protectRoute, markAllNotificationsRead);

export default router;

