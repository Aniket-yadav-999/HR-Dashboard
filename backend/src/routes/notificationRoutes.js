import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const query = { recipient: req.user._id };

    if (!["admin", "hr"].includes(req.user.role)) {
      query.type = { $nin: ["feedback", "training_suggestion"] };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("actor", "name email role");

    res.json(
      notifications.map((notification) => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        actor: notification.actor
          ? {
              name: notification.actor.name,
              email: notification.actor.email,
              role: notification.actor.role
            }
          : null
      }))
    );
  } catch (error) {
    next(error);
  }
});

export default router;
