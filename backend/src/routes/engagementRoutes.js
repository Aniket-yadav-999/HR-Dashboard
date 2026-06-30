import { Router } from "express";
import { requireAuth, requireHrOrAdmin } from "../middleware/auth.js";
import { EngagementItem } from "../models/EngagementItem.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

const router = Router();
const categories = ["birthday", "work_anniversary", "office_anniversary", "promotion", "recognition", "event", "feedback"];

function labelFor(category) {
  return {
    birthday: "Birthday",
    work_anniversary: "Work Anniversary",
    office_anniversary: "Office Anniversary",
    promotion: "Promotion",
    recognition: "Recognition",
    event: "Event",
    feedback: "Feedback"
  }[category];
}

function toEngagementCard(item) {
  return {
    id: item._id,
    category: item.category,
    categoryLabel: labelFor(item.category),
    title: item.title,
    description: item.description,
    eventDate: item.eventDate,
    employeeName: item.employeeName,
    createdAt: item.createdAt
  };
}

function toEngagementPerson(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    department: user.department,
    designation: user.designation,
    teamName: user.teamName,
    managerName: user.managerName,
    managerEmail: user.managerEmail,
    joinedAt: user.joinedAt,
    dateOfBirth: user.dateOfBirth,
    avatarColor: user.avatarColor
  };
}

function buildPayload(body) {
  const payload = {
    category: categories.includes(body.category) ? body.category : "",
    title: body.title?.trim(),
    description: body.description?.trim() || "",
    employeeName: body.employeeName?.trim() || "",
    eventDate: body.eventDate ? new Date(body.eventDate) : undefined
  };

  if (!payload.category || !payload.title) {
    throw new Error("Category and title are required");
  }

  return payload;
}

async function notifyAllUsers({ actor, item, action }) {
  const users = await User.find({ status: "active" }).select("_id");

  if (!users.length) {
    return;
  }

  const notifications = users
    .filter((user) => String(user._id) !== String(actor._id))
    .map((user) => ({
      recipient: user._id,
      actor: actor._id,
      title: `${labelFor(item.category)} ${action}`,
      message: `${actor.name} ${action} ${item.title}.`,
      type: item.category || "engagement"
    }));

  if (notifications.length) {
    await Notification.insertMany(notifications);
  }
}

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const items = await EngagementItem.find().sort({ eventDate: 1, createdAt: -1 });
    res.json(items.map(toEngagementCard));
  } catch (error) {
    next(error);
  }
});

router.get("/people", requireAuth, async (_req, res, next) => {
  try {
    const people = await User.find({ status: "active" }).sort({ name: 1 });
    res.json(people.map(toEngagementPerson));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    if (req.body.category !== "feedback" && !["admin", "hr"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only HR or Admin can publish this engagement item" });
    }

    const item = await EngagementItem.create({ ...buildPayload(req.body), createdBy: req.user._id });
    await notifyAllUsers({ actor: req.user, item, action: "added" });
    res.status(201).json(toEngagementCard(item));
  } catch (error) {
    if (error.message === "Category and title are required") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.put("/:id", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const item = await EngagementItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Engagement item not found" });
    }

    Object.assign(item, buildPayload(req.body));
    await item.save();
    await notifyAllUsers({ actor: req.user, item, action: "updated" });
    res.json(toEngagementCard(item));
  } catch (error) {
    if (error.message === "Category and title are required") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.delete("/:id", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const item = await EngagementItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Engagement item not found" });
    }

    await notifyAllUsers({ actor: req.user, item, action: "deleted" });
    res.json({ message: "Engagement item deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
